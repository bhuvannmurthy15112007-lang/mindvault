import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const users = await query<any[]>(
    `SELECT u.user_id, u.firebase_uid, u.email, u.account_status, u.created_at,
            p.display_name, p.avatar_url, p.phone_number,
            COALESCE(GROUP_CONCAT(r.role_name ORDER BY r.role_name ASC SEPARATOR ', '), 'PLAYER') AS roles
     FROM users u
     LEFT JOIN user_profiles p ON u.user_id = p.user_id
     LEFT JOIN user_roles ur ON u.user_id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.role_id
     GROUP BY u.user_id, u.firebase_uid, u.email, u.account_status, u.created_at, p.display_name, p.avatar_url, p.phone_number
     ORDER BY u.user_id ASC`
  );

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin authorization required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, action, accountStatus } = body;

  const targetUserId = parseInt(userId, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  // Handle Promote to Admin Action
  if (action === 'PROMOTE_TO_ADMIN') {
    // 1. Verify target user exists
    const targetUser = await query<any[]>('SELECT user_id, email FROM users WHERE user_id = ?', [targetUserId]);
    if (!targetUser || targetUser.length === 0) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // 2. Fetch or ensure ADMIN role_id
    let adminRoles = await query<any[]>('SELECT role_id FROM roles WHERE role_name = "ADMIN"');
    let adminRoleId: number;
    if (!adminRoles || adminRoles.length === 0) {
      const insRes: any = await query('INSERT INTO roles (role_name, description) VALUES ("ADMIN", "Platform game master and administrator")');
      adminRoleId = insRes.insertId;
    } else {
      adminRoleId = adminRoles[0].role_id;
    }

    // 3. Assign ADMIN role in MySQL user_roles table
    await query(
      `INSERT INTO user_roles (user_id, role_id) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE user_id = user_id`,
      [targetUserId, adminRoleId]
    );

    return NextResponse.json({
      success: true,
      message: `User #${targetUserId} (${targetUser[0].email}) successfully promoted to Administrator. Administrative clearance active immediately.`
    });
  }

  // Handle Account Status Update
  if (accountStatus) {
    await query('UPDATE users SET account_status = ? WHERE user_id = ?', [accountStatus, targetUserId]);
    return NextResponse.json({ success: true, message: 'User account status updated successfully.' });
  }

  return NextResponse.json({ error: 'No valid action or accountStatus provided' }, { status: 400 });
}
