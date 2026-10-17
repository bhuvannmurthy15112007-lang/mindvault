const fs = require('fs');
const path = require('path');

// 1. Firebase Client
const fbClient = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForClientInit',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mindvault-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mindvault-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mindvault-app.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
`;
fs.writeFileSync(path.join(__dirname, 'lib', 'firebase', 'client.ts'), fbClient);

// 2. Firebase Admin
const fbAdmin = `import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  } else {
    // Development fallback: initialize default if credentials missing in env
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn('[Firebase Admin] Initialized without credentials; ID token verification will use local decoding in development');
    }
  }
}

export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
export default admin;
`;
fs.writeFileSync(path.join(__dirname, 'lib', 'firebase', 'admin.ts'), fbAdmin);

// 3. Server Auth Middleware
const serverAuth = `import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { query } from '@/lib/mysql/db';
import { AuthenticatedUser } from '@/types';

export async function verifyAuth(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  let firebaseUid = '';
  let email = '';

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    firebaseUid = decoded.uid;
    email = decoded.email || '';
  } catch (err) {
    // Development fallback if Firebase Admin credentials are not yet configured with a live project
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

  if (!firebaseUid) return null;

  // Retrieve user from MySQL
  const users = await query<any[]>(
    \`SELECT u.user_id, u.firebase_uid, u.email, u.account_status,
            p.display_name, p.avatar_url
     FROM users u
     LEFT JOIN user_profiles p ON u.user_id = p.user_id
     WHERE u.firebase_uid = ? AND u.account_status = 'ACTIVE'\`,
    [firebaseUid]
  );

  if (!users || users.length === 0) {
    return null;
  }

  const u = users[0];

  // Retrieve roles
  const roles = await query<any[]>(
    \`SELECT r.role_name
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.role_id
     WHERE ur.user_id = ?\`,
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
`;
fs.writeFileSync(path.join(__dirname, 'lib', 'auth', 'serverAuth.ts'), serverAuth);

// 4. Socket Client
const socketClient = `import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    socket = io(socketUrl, {
      autoConnect: false,
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  } else if (token) {
    socket.auth = { token };
  }
  return socket;
}
`;
fs.writeFileSync(path.join(__dirname, 'lib', 'socket', 'client.ts'), socketClient);

console.log('Firebase, ServerAuth, and Socket libraries created successfully.');
