import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { query, withTransaction } from '@/lib/mysql/db';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let firebaseUid = '';
    let email = '';

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      firebaseUid = decoded.uid;
      email = decoded.email || '';
    } catch (err) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          firebaseUid = payload.user_id || payload.sub || '';
          email = payload.email || '';
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    if (!firebaseUid) {
      return NextResponse.json({ error: 'Could not extract user identity' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const displayName = body.displayName || email.split('@')[0] || 'VaultStrategist';

    // Synchronize user into MySQL inside an ACID transaction
    const syncedUser = await withTransaction(async (conn) => {
      // 1. Check or insert user
      const [existingUsers]: any = await conn.execute(
        'SELECT user_id, email, account_status FROM users WHERE firebase_uid = ?',
        [firebaseUid]
      );

      let userId: number;
      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].user_id;
        if (existingUsers[0].account_status !== 'ACTIVE') {
          throw new Error('ACCOUNT_SUSPENDED');
        }
      } else {
        const [insertRes]: any = await conn.execute(
          'INSERT INTO users (firebase_uid, email, account_status) VALUES (?, ?, "ACTIVE")',
          [firebaseUid, email]
        );
        userId = insertRes.insertId;
      }

      // 2. Ensure profile exists
      const [existingProfile]: any = await conn.execute(
        'SELECT profile_id, display_name, avatar_url, bio, phone_number FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      if (!existingProfile || existingProfile.length === 0) {
        await conn.execute(
          'INSERT INTO user_profiles (user_id, display_name, avatar_url, bio) VALUES (?, ?, NULL, "Strategist in the Vault")',
          [userId, displayName]
        );
      }

      // 3. Ensure role assigned (PLAYER)
      const [playerRole]: any = await conn.execute(
        'SELECT role_id FROM roles WHERE role_name = "PLAYER"'
      );
      if (playerRole && playerRole.length > 0) {
        await conn.execute(
          'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, playerRole[0].role_id]
        );
      }

      // If email contains admin or is the first user, optionally grant ADMIN
      const [totalUsers]: any = await conn.execute('SELECT COUNT(*) as cnt FROM users');
      if (totalUsers[0].cnt === 1 || email.toLowerCase().includes('admin')) {
        const [adminRole]: any = await conn.execute(
          'SELECT role_id FROM roles WHERE role_name = "ADMIN"'
        );
        if (adminRole && adminRole.length > 0) {
          await conn.execute(
            'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, adminRole[0].role_id]
          );
        }
      }

      // 4. Return full profile & roles
      const [profiles]: any = await conn.execute(
        'SELECT display_name, avatar_url, bio, phone_number FROM user_profiles WHERE user_id = ?',
        [userId]
      );
      const [roles]: any = await conn.execute(
        'SELECT r.role_name FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE ur.user_id = ?',
        [userId]
      );

      return {
        userId,
        firebaseUid,
        email,
        displayName: profiles[0]?.display_name || displayName,
        avatarUrl: profiles[0]?.avatar_url || null,
        bio: profiles[0]?.bio || null,
        phoneNumber: profiles[0]?.phone_number || null,
        roles: roles.map((r: any) => r.role_name),
        isAdmin: roles.some((r: any) => r.role_name === 'ADMIN')
      };
    });

    return NextResponse.json({ success: true, user: syncedUser });
  } catch (err: any) {
    if (err.message === 'ACCOUNT_SUSPENDED') {
      return NextResponse.json({ error: 'Your MindVault account has been suspended or deactivated.' }, { status: 403 });
    }
    console.error('API sync error:', err);
    return NextResponse.json({ error: 'Database synchronization failed: ' + err.message }, { status: 500 });
  }
}
