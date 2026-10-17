import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const caseId = parseInt(params.caseId, 10);
  if (isNaN(caseId)) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  const cases = await query<any[]>('SELECT * FROM detective_cases WHERE case_id = ?', [caseId]);
  if (!cases || cases.length === 0) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const [suspects, locations, evidence, clues, timeline, puzzles, solutions] = await Promise.all([
    query<any[]>('SELECT * FROM detective_suspects WHERE case_id = ? ORDER BY suspect_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_locations WHERE case_id = ? ORDER BY location_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_evidence WHERE case_id = ? ORDER BY evidence_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_clues WHERE case_id = ? ORDER BY clue_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_timeline_events WHERE case_id = ? ORDER BY event_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_puzzles WHERE case_id = ? ORDER BY puzzle_id ASC', [caseId]),
    query<any[]>('SELECT * FROM detective_case_solutions WHERE case_id = ?', [caseId])
  ]);

  return NextResponse.json({
    caseData: cases[0],
    suspects: suspects || [],
    locations: locations || [],
    evidence: evidence || [],
    clues: clues || [],
    timeline: timeline || [],
    puzzles: puzzles || [],
    solution: solutions && solutions.length > 0 ? solutions[0] : null
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const caseId = parseInt(params.caseId, 10);
  if (isNaN(caseId)) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    fields.push('title = ?');
    values.push(body.title);
  }
  if (body.synopsis !== undefined) {
    fields.push('synopsis = ?');
    values.push(body.synopsis);
  }
  if (body.difficulty !== undefined) {
    fields.push('difficulty = ?');
    values.push(body.difficulty);
  }
  if (body.investigation_budget !== undefined) {
    fields.push('investigation_budget = ?');
    values.push(body.investigation_budget);
  }
  if (body.incident_location !== undefined) {
    fields.push('incident_location = ?');
    values.push(body.incident_location);
  }
  if (body.incident_time !== undefined) {
    fields.push('incident_time = ?');
    values.push(body.incident_time);
  }
  if (body.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(caseId);
  await query(`UPDATE detective_cases SET ${fields.join(', ')} WHERE case_id = ?`, values);

  return NextResponse.json({ success: true, message: 'Case updated successfully' });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const caseId = parseInt(params.caseId, 10);
  if (isNaN(caseId)) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  await query('DELETE FROM detective_cases WHERE case_id = ?', [caseId]);
  return NextResponse.json({ success: true, message: 'Case deleted' });
}
