import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import { EscapeRoomEngine } from '@/server/games/escape-room/EscapeRoomEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const escSess = await query<any[]>(
      'SELECT escape_session_id, current_room_id FROM escape_sessions WHERE session_id = ?',
      [sessionId]
    );
    if (!escSess || escSess.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const result = await EscapeRoomEngine.requestHint(
      escSess[0].escape_session_id,
      authUser.userId,
      escSess[0].current_room_id
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
