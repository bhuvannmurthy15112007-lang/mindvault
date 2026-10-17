import { NextRequest, NextResponse } from 'next/server';
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
    `UPDATE user_profiles 
     SET display_name = COALESCE(?, display_name),
         phone_number = ?,
         avatar_url = COALESCE(?, avatar_url),
         bio = COALESCE(?, bio)
     WHERE user_id = ?`,
    [displayName || null, phoneNumber || null, avatarUrl || null, bio || null, authUser.userId]
  );

  return NextResponse.json({ success: true, message: 'Profile updated successfully.' });
}
