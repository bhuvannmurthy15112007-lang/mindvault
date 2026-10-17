import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, withTransaction } from '@/lib/mysql/db';
import { hashPassword, createSessionToken } from '@/lib/auth/session';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { email, password, displayName } = body;

    // 1. Validation
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      return NextResponse.json({ error: 'Display name must be at least 2 characters long' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanDisplayName = displayName.trim();

    // 2. Ensure MySQL schema is initialized non-destructively
    await ensureCoreTables();

    // 3. Duplicate email check
    const existingUsers = await query<any[]>(
      'SELECT user_id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // 4. Securely hash password (never plaintext, never logged)
    const passwordHash = hashPassword(password);
    const playerUid = 'usr_' + crypto.randomUUID();

    // 5. Atomic transaction to insert user, profile, and roles
    const createdUser = await withTransaction(async (conn) => {
      const [insertRes]: any = await conn.execute(
        'INSERT INTO users (firebase_uid, email, password_hash, account_status) VALUES (?, ?, ?, "ACTIVE")',
        [playerUid, cleanEmail, passwordHash]
      );

      const userId: number = insertRes.insertId;

      await conn.execute(
        'INSERT INTO user_profiles (user_id, display_name, avatar_url, bio) VALUES (?, ?, NULL, "Strategist in the Vault")',
        [userId, cleanDisplayName]
      );

      // Assign PLAYER role
      const [playerRole]: any = await conn.execute(
        'SELECT role_id FROM roles WHERE role_name = "PLAYER"'
      );
      if (playerRole && playerRole.length > 0) {
        await conn.execute(
          'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, playerRole[0].role_id]
        );
      }

      // Check if first user or email contains admin to grant admin
      const [totalCount]: any = await conn.execute('SELECT COUNT(*) as cnt FROM users');
      const isFirst = totalCount[0]?.cnt === 1;
      const isAdmin = isFirst || cleanEmail.includes('admin');
      if (isAdmin) {
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

      return {
        userId,
        firebaseUid: playerUid,
        email: cleanEmail,
        displayName: cleanDisplayName,
        avatarUrl: null,
        roles: isAdmin ? ['PLAYER', 'ADMIN'] : ['PLAYER'],
        isAdmin
      };
    });

    // 6. Create application session token
    const token = createSessionToken({
      userId: createdUser.userId,
      uid: createdUser.firebaseUid,
      sub: createdUser.firebaseUid,
      email: createdUser.email,
      displayName: createdUser.displayName,
      roles: createdUser.roles,
      isAdmin: createdUser.isAdmin
    });

    // 7. Return success without exposing password or database internals
    return NextResponse.json({
      success: true,
      token,
      user: createdUser
    }, { status: 201 });
  } catch (err: any) {
    console.error('[Registration API Error]:', err.message);
    return NextResponse.json(
      { error: 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
