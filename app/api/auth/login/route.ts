import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';
import { verifyPassword, createSessionToken } from '@/lib/auth/session';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await ensureCoreTables();

    const cleanEmail = email.toLowerCase().trim();

    const users = await query<any[]>(
      `SELECT u.user_id, u.firebase_uid, u.email, u.password_hash, u.account_status,
              p.display_name, p.avatar_url
       FROM users u
       LEFT JOIN user_profiles p ON u.user_id = p.user_id
       WHERE u.email = ?`,
      [cleanEmail]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userRecord = users[0];

    if (userRecord.account_status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is currently suspended or deactivated' }, { status: 403 });
    }

    if (!userRecord.password_hash) {
      return NextResponse.json({ error: 'Invalid authentication credentials' }, { status: 401 });
    }

    const isMatch = verifyPassword(password, userRecord.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Retrieve roles
    const roles = await query<any[]>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ?`,
      [userRecord.user_id]
    );

    const roleNames = roles.map(r => r.role_name);
    const isAdmin = roleNames.includes('ADMIN');

    const authUser = {
      userId: userRecord.user_id,
      firebaseUid: userRecord.firebase_uid,
      email: userRecord.email,
      displayName: userRecord.display_name || userRecord.email.split('@')[0],
      avatarUrl: userRecord.avatar_url || null,
      roles: roleNames,
      isAdmin
    };

    const token = createSessionToken({
      userId: authUser.userId,
      uid: authUser.firebaseUid,
      sub: authUser.firebaseUid,
      email: authUser.email,
      displayName: authUser.displayName,
      roles: authUser.roles,
      isAdmin: authUser.isAdmin
    });

    return NextResponse.json({
      success: true,
      token,
      user: authUser
    });
  } catch (err: any) {
    console.error('[Login API Error]:', err.message);
    return NextResponse.json(
      { error: 'Authentication failed due to a server error' },
      { status: 500 }
    );
  }
}
