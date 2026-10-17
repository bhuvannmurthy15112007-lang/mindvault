import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import crypto from 'crypto';

export async function POST(
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
  const { componentType, data } = body;

  if (!componentType || !data) {
    return NextResponse.json({ error: 'Missing componentType or data' }, { status: 400 });
  }

  try {
    if (componentType === 'room') {
      const res: any = await query(
        `INSERT INTO escape_rooms (scenario_id, room_name, description, sequence_order, ambient_theme)
         VALUES (?, ?, ?, ?, ?)`,
        [
          scenarioId,
          data.room_name || 'New Sector',
          data.description || '',
          data.sequence_order || 1,
          data.ambient_theme || 'VAULT_AMBER'
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'object') {
      const res: any = await query(
        `INSERT INTO escape_objects (escape_room_id, name, description, is_inspectable, is_locked, icon_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.escape_room_id,
          data.name || 'New Object',
          data.description || '',
          data.is_inspectable !== false ? 1 : 0,
          data.is_locked ? 1 : 0,
          data.icon_name || 'dial'
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'clue') {
      const res: any = await query(
        `INSERT INTO escape_clues (object_id, clue_text, image_url)
         VALUES (?, ?, ?)`,
        [
          data.object_id,
          data.clue_text || 'Tactical clue text',
          data.image_url || '/escape-room/clues/hazard_placard.svg'
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'puzzle') {
      const res: any = await query(
        `INSERT INTO escape_puzzles (object_id, puzzle_prompt, puzzle_type, hint_text, difficulty_points)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.object_id,
          data.puzzle_prompt || 'Enter combination',
          data.puzzle_type || 'KEYPAD',
          data.hint_text || '',
          data.difficulty_points || 100
        ]
      );
      const puzzleId = res.insertId;

      if (data.accepted_plaintext) {
        const clean = data.accepted_plaintext.trim().toUpperCase();
        const hash = crypto.createHash('sha256').update(clean).digest('hex');
        await query(
          `INSERT INTO escape_puzzle_answers (puzzle_id, answer_hash, accepted_plaintext)
           VALUES (?, ?, ?)`,
          [puzzleId, hash, clean]
        );
      }

      return NextResponse.json({ success: true, id: puzzleId });
    }

    if (componentType === 'lock') {
      const res: any = await query(
        `INSERT INTO escape_locks (escape_room_id, lock_name, lock_type, target_room_id, is_exit_door)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.escape_room_id,
          data.lock_name || 'Security Hatch',
          data.lock_type || 'DOOR',
          data.target_room_id || null,
          data.is_exit_door ? 1 : 0
        ]
      );
      const lockId = res.insertId;

      if (data.required_puzzle_id) {
        await query(
          `INSERT INTO escape_unlock_conditions (lock_id, required_puzzle_id, required_object_id)
           VALUES (?, ?, ?)`,
          [lockId, data.required_puzzle_id, data.required_object_id || null]
        );
      }

      return NextResponse.json({ success: true, id: lockId });
    }

    if (componentType === 'hint') {
      const res: any = await query(
        `INSERT INTO escape_hints (scenario_id, room_id, hint_number, hint_text)
         VALUES (?, ?, ?, ?)`,
        [scenarioId, data.room_id, data.hint_number || 1, data.hint_text || '']
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    return NextResponse.json({ error: 'Unknown componentType' }, { status: 400 });
  } catch (err: any) {
    console.error('Error adding scenario component:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { scenarioId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const componentType = searchParams.get('type');
  const id = parseInt(searchParams.get('id') || '', 10);

  if (!componentType || isNaN(id)) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  const tableMap: Record<string, { table: string; col: string }> = {
    room: { table: 'escape_rooms', col: 'escape_room_id' },
    object: { table: 'escape_objects', col: 'object_id' },
    clue: { table: 'escape_clues', col: 'clue_id' },
    puzzle: { table: 'escape_puzzles', col: 'puzzle_id' },
    lock: { table: 'escape_locks', col: 'lock_id' },
    hint: { table: 'escape_hints', col: 'hint_id' }
  };

  const target = tableMap[componentType];
  if (!target) {
    return NextResponse.json({ error: 'Invalid component type' }, { status: 400 });
  }

  await query(`DELETE FROM ${target.table} WHERE ${target.col} = ?`, [id]);
  return NextResponse.json({ success: true, message: 'Component removed' });
}
