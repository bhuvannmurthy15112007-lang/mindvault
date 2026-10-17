const fs = require('fs');
const path = require('path');

// 1. Admin Users
const adminUsersRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const users = await query<any[]>(
    \`SELECT u.user_id, u.firebase_uid, u.email, u.account_status, u.created_at,
            p.display_name, p.avatar_url, p.phone_number,
            GROUP_CONCAT(r.role_name) AS roles
     FROM users u
     LEFT JOIN user_profiles p ON u.user_id = p.user_id
     LEFT JOIN user_roles ur ON u.user_id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.role_id
     GROUP BY u.user_id, p.display_name, p.avatar_url, p.phone_number
     ORDER BY u.created_at DESC\`
  );

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, accountStatus } = body;

  if (!userId || !accountStatus) {
    return NextResponse.json({ error: 'Missing userId or accountStatus' }, { status: 400 });
  }

  await query('UPDATE users SET account_status = ? WHERE user_id = ?', [accountStatus, userId]);
  return NextResponse.json({ success: true, message: 'User status updated.' });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'admin', 'users', 'route.ts'), adminUsersRoute);

// 2. Admin Detective Cases
const adminDetRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const cases = await query<any[]>('SELECT * FROM detective_cases ORDER BY case_id ASC');
  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, synopsis, difficulty, investigationBudget } = body;

  const result: any = await query(
    'INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget) VALUES (?, ?, ?, ?)',
    [title, synopsis, difficulty || 'MEDIUM', investigationBudget || 100]
  );

  return NextResponse.json({ success: true, caseId: result.insertId });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'admin', 'detective', 'cases', 'route.ts'), adminDetRoute);

// 3. Admin Escape Scenarios
const adminEscRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scenarios = await query<any[]>('SELECT * FROM escape_scenarios ORDER BY scenario_id ASC');
  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, themeDescription, timeLimitSeconds, difficulty } = body;

  const result: any = await query(
    'INSERT INTO escape_scenarios (title, theme_description, time_limit_seconds, difficulty) VALUES (?, ?, ?, ?)',
    [title, themeDescription, timeLimitSeconds || 1800, difficulty || 'MEDIUM']
  );

  return NextResponse.json({ success: true, scenarioId: result.insertId });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'admin', 'escape', 'scenarios', 'route.ts'), adminEscRoute);

// 4. Admin Drawice Words
const adminWordsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const words = await query<any[]>('SELECT * FROM drawice_words ORDER BY word_id DESC');
  return NextResponse.json({ words });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { word, category, difficulty } = body;

  if (!word) return NextResponse.json({ error: 'Word is required' }, { status: 400 });

  await query(
    'INSERT INTO drawice_words (word, category, difficulty) VALUES (?, ?, ?)',
    [word.trim(), category || 'General', difficulty || 'MEDIUM']
  );

  return NextResponse.json({ success: true, message: 'Word added.' });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'admin', 'drawice', 'words', 'route.ts'), adminWordsRoute);

// 5. Admin Achievements
const adminAchievementsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const achievements = await query<any[]>('SELECT * FROM achievements ORDER BY achievement_id ASC');
  return NextResponse.json({ achievements });
}

export async function POST(req: NextRequest) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, iconUrl, requirementType, requirementValue, gameId } = body;

  await query(
    'INSERT INTO achievements (name, description, icon_url, requirement_type, requirement_value, game_id) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, iconUrl || '/icons/default.svg', requirementType, requirementValue || 1, gameId || null]
  );

  return NextResponse.json({ success: true, message: 'Achievement created.' });
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'api', 'admin', 'achievements', 'route.ts'), adminAchievementsRoute);

console.log('Admin API endpoints created successfully.');
