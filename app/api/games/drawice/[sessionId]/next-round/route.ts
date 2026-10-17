import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { DrawiceEngine } from '@/server/games/drawice/DrawiceEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = parseInt(params.sessionId, 10);

  try {
    const result = await DrawiceEngine.nextRoundOrComplete(sessionId);

    const io = (global as any).io;
    if (io) {
      // Clear socket canvas stroke history for the session
      if ((global as any).drawiceCanvases && (global as any).drawiceCanvases[sessionId]) {
        (global as any).drawiceCanvases[sessionId] = [];
      }

      if (result.isComplete) {
        io.to('session:' + sessionId).emit('drawice:game_completed', {
          isComplete: true,
          rankings: result.rankings
        });
      } else {
        io.to('session:' + sessionId).emit('drawice:next_round', {
          nextRoundNumber: result.nextRoundNumber,
          artistUserId: result.artistUserId,
          artistName: result.artistName
        });
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
