import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scenarioId = parseInt(params.scenarioId, 10);
  if (isNaN(scenarioId)) {
    return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
  }

  const scenarios = await query<any[]>('SELECT * FROM escape_scenarios WHERE scenario_id = ?', [scenarioId]);
  if (!scenarios || scenarios.length === 0) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
  }

  const [rooms, objects, clues, puzzles, locks, conditions, hints] = await Promise.all([
    query<any[]>('SELECT * FROM escape_rooms WHERE scenario_id = ? ORDER BY sequence_order ASC', [scenarioId]),
    query<any[]>(
      `SELECT eo.*, er.room_name 
       FROM escape_objects eo 
       JOIN escape_rooms er ON eo.escape_room_id = er.escape_room_id 
       WHERE er.scenario_id = ? ORDER BY eo.object_id ASC`,
      [scenarioId]
    ),
    query<any[]>(
      `SELECT ec.*, eo.name as object_name 
       FROM escape_clues ec 
       JOIN escape_objects eo ON ec.object_id = eo.object_id 
       JOIN escape_rooms er ON eo.escape_room_id = er.escape_room_id 
       WHERE er.scenario_id = ? ORDER BY ec.clue_id ASC`,
      [scenarioId]
    ),
    query<any[]>(
      `SELECT ep.*, eo.name as object_name, pa.accepted_plaintext 
       FROM escape_puzzles ep 
       JOIN escape_objects eo ON ep.object_id = eo.object_id 
       JOIN escape_rooms er ON eo.escape_room_id = er.escape_room_id 
       LEFT JOIN escape_puzzle_answers pa ON ep.puzzle_id = pa.puzzle_id 
       WHERE er.scenario_id = ? ORDER BY ep.puzzle_id ASC`,
      [scenarioId]
    ),
    query<any[]>(
      `SELECT el.*, er.room_name 
       FROM escape_locks el 
       JOIN escape_rooms er ON el.escape_room_id = er.escape_room_id 
       WHERE er.scenario_id = ? ORDER BY el.lock_id ASC`,
      [scenarioId]
    ),
    query<any[]>(
      `SELECT euc.*, el.lock_name 
       FROM escape_unlock_conditions euc 
       JOIN escape_locks el ON euc.lock_id = el.lock_id 
       JOIN escape_rooms er ON el.escape_room_id = er.escape_room_id 
       WHERE er.scenario_id = ?`,
      [scenarioId]
    ),
    query<any[]>('SELECT * FROM escape_hints WHERE scenario_id = ? ORDER BY room_id, hint_number ASC', [scenarioId])
  ]);

  return NextResponse.json({
    scenario: scenarios[0],
    rooms: rooms || [],
    objects: objects || [],
    clues: clues || [],
    puzzles: puzzles || [],
    locks: locks || [],
    conditions: conditions || [],
    hints: hints || []
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scenarioId = parseInt(params.scenarioId, 10);
  if (isNaN(scenarioId)) {
    return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    fields.push('title = ?');
    values.push(body.title);
  }
  if (body.theme_description !== undefined) {
    fields.push('theme_description = ?');
    values.push(body.theme_description);
  }
  if (body.time_limit_seconds !== undefined) {
    fields.push('time_limit_seconds = ?');
    values.push(body.time_limit_seconds);
  }
  if (body.difficulty !== undefined) {
    fields.push('difficulty = ?');
    values.push(body.difficulty);
  }
  if (body.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(scenarioId);
  await query(`UPDATE escape_scenarios SET ${fields.join(', ')} WHERE scenario_id = ?`, values);

  return NextResponse.json({ success: true, message: 'Scenario updated successfully' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const scenarioId = parseInt(params.scenarioId, 10);
  if (isNaN(scenarioId)) {
    return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
  }

  await query('DELETE FROM escape_scenarios WHERE scenario_id = ?', [scenarioId]);
  return NextResponse.json({ success: true, message: 'Scenario deleted successfully' });
}
