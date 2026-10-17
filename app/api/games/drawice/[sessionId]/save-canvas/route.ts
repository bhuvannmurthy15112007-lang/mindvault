import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);
  const body = await req.json().catch(() => ({}));
  const { drawingData } = body;

  try {
    const rounds = await query<any[]>(
      'SELECT round_id, artist_user_id FROM drawice_rounds WHERE session_id = ? ORDER BY round_number DESC LIMIT 1',
      [sessionId]
    );
    if (!rounds || rounds.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    const round = rounds[0];

    if (round.artist_user_id === authUser.userId && drawingData) {
      await query(
        'UPDATE drawice_rounds SET drawing_data = ? WHERE round_id = ?',
        [drawingData, round.round_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
