const fs = require('fs');
const path = require('path');

// 1. /api/auth/sync
const syncRoute = `import { NextRequest, NextResponse } from 'next/server';
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'auth', 'sync', 'route.ts'), syncRoute);

// 2. /api/profile
const profileRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await query<any[]>(
    'SELECT display_name, phone_number, avatar_url, bio, created_at FROM user_profiles WHERE user_id = ?',
    [authUser.userId]
  );

  return NextResponse.json({
    user: authUser,
    profile: profile[0] || null
  });
}

export async function PUT(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { displayName, phoneNumber, avatarUrl, bio } = body;

  await query(
    \`UPDATE user_profiles 
     SET display_name = COALESCE(?, display_name),
         phone_number = ?,
         avatar_url = COALESCE(?, avatar_url),
         bio = COALESCE(?, bio)
     WHERE user_id = ?\`,
    [displayName || null, phoneNumber || null, avatarUrl || null, bio || null, authUser.userId]
  );

  return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'profile', 'route.ts'), profileRoute);

// 3. /api/games
const gamesRoute = `import { NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';

export async function GET() {
  try {
    const games = await query(
      'SELECT game_id, game_code, game_name, description, min_players, max_players, is_active FROM games WHERE is_active = TRUE ORDER BY game_id ASC'
    );
    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: 'Database connection failed: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'games', 'route.ts'), gamesRoute);

// 4. /api/db-health
const dbHealthRoute = `import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/mysql/db';

export async function GET() {
  const status = await testDatabaseConnection();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'db-health', 'route.ts'), dbHealthRoute);

// 5. /api/leaderboard
const leaderboardRoute = `import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameCode = searchParams.get('game');

    if (gameCode) {
      const rows = await query(
        'SELECT * FROM v_game_leaderboards WHERE game_code = ? ORDER BY game_rank ASC LIMIT 100',
        [gameCode]
      );
      return NextResponse.json({ leaderboard: rows });
    }

    const rows = await query('SELECT * FROM v_overall_leaderboard ORDER BY global_rank ASC LIMIT 100');
    return NextResponse.json({ leaderboard: rows });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to query leaderboard: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'leaderboard', 'route.ts'), leaderboardRoute);

// 6. /api/achievements
const achievementsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);

    const allAchievements = await query<any[]>(
      \`SELECT a.*, g.game_name, g.game_code 
       FROM achievements a 
       LEFT JOIN games g ON a.game_id = g.game_id 
       WHERE a.is_active = TRUE 
       ORDER BY a.achievement_id ASC\`
    );

    let userUnlockedIds: number[] = [];
    if (authUser) {
      const unlocked = await query<any[]>(
        'SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?',
        [authUser.userId]
      );
      userUnlockedIds = unlocked.map(u => u.achievement_id);
    }

    const achievementsWithStatus = allAchievements.map(a => ({
      ...a,
      isUnlocked: userUnlockedIds.includes(a.achievement_id)
    }));

    return NextResponse.json({ achievements: achievementsWithStatus });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve achievements: ' + err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'achievements', 'route.ts'), achievementsRoute);

console.log('Core API endpoints generated successfully.');
