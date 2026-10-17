import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { query } from '@/lib/mysql/db';
import { AuthenticatedUser } from '@/types';
import { verifySessionToken } from '@/lib/auth/session';

export async function verifyAuth(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  let firebaseUid = '';
  let email = '';

  // 1. First check our authoritative application session token
  const session = verifySessionToken(token);
  if (session) {
    firebaseUid = session.uid;
    email = session.email;
  } else {
    // 2. Firebase ID token or external fallback
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      firebaseUid = decoded.uid;
      email = decoded.email || '';
    } catch (err) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.user_id || payload.sub) {
            firebaseUid = payload.user_id || payload.sub;
            email = payload.email || '';
          }
        }
      } catch (fallbackErr) {
        console.error('[verifyAuth] Invalid token:', err);
        return null;
      }
    }
  }

  if (!firebaseUid) return null;

  // Retrieve user from MySQL
  const users = await query<any[]>(
    `SELECT u.user_id, u.firebase_uid, u.email, u.account_status,
            p.display_name, p.avatar_url
     FROM users u
     LEFT JOIN user_profiles p ON u.user_id = p.user_id
     WHERE u.firebase_uid = ? AND u.account_status = 'ACTIVE'`,
    [firebaseUid]
  );

  if (!users || users.length === 0) {
    return null;
  }

  const u = users[0];

  // Retrieve roles
  const roles = await query<any[]>(
    `SELECT r.role_name
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.role_id
     WHERE ur.user_id = ?`,
    [u.user_id]
  );

  const roleNames = roles.map(r => r.role_name);

  return {
    userId: u.user_id,
    firebaseUid: u.firebase_uid,
    email: u.email,
    displayName: u.display_name || u.email.split('@')[0],
    avatarUrl: u.avatar_url,
    roles: roleNames,
    isAdmin: roleNames.includes('ADMIN')
  };
}
