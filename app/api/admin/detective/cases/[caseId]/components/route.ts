import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/serverAuth';
import { query } from '@/lib/mysql/db';
import crypto from 'crypto';

export async function POST(
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
  const { componentType, data } = body;

  if (!componentType || !data) {
    return NextResponse.json({ error: 'Missing componentType or data' }, { status: 400 });
  }

  try {
    if (componentType === 'suspect') {
      const res: any = await query(
        `INSERT INTO detective_suspects (case_id, name, occupation, background, alibi, is_culprit, interrogation_cost, interrogation_transcript, motive_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          data.name || 'Unknown Suspect',
          data.occupation || 'Unknown',
          data.background || '',
          data.alibi || '',
          data.is_culprit ? 1 : 0,
          data.interrogation_cost || 10,
          data.interrogation_transcript || '',
          data.motive_description || ''
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'location') {
      const res: any = await query(
        `INSERT INTO detective_locations (case_id, name, description, action_cost, search_findings)
         VALUES (?, ?, ?, ?, ?)`,
        [
          caseId,
          data.name || 'New Location',
          data.description || '',
          data.action_cost || 10,
          data.search_findings || ''
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'evidence') {
      const res: any = await query(
        `INSERT INTO detective_evidence (case_id, location_id, suspect_id, title, description, analysis_cost, forensic_details, is_critical, is_red_herring)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          data.location_id || null,
          data.suspect_id || null,
          data.title || 'New Evidence',
          data.description || '',
          data.analysis_cost || 15,
          data.forensic_details || '',
          data.is_critical ? 1 : 0,
          data.is_red_herring ? 1 : 0
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'clue') {
      const res: any = await query(
        `INSERT INTO detective_clues (case_id, evidence_id, clue_text, action_cost, deduction_notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          caseId,
          data.evidence_id || null,
          data.clue_text || 'New Clue',
          data.action_cost || 10,
          data.deduction_notes || ''
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'timeline') {
      const res: any = await query(
        `INSERT INTO detective_timeline_events (case_id, timestamp_label, event_description, suspect_id, is_verified)
         VALUES (?, ?, ?, ?, ?)`,
        [
          caseId,
          data.timestamp_label || '12:00 PM',
          data.event_description || '',
          data.suspect_id || null,
          data.is_verified !== false ? 1 : 0
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'puzzle') {
      const acceptedPlaintext = (data.accepted_plaintext || 'OVERRIDE').trim().toUpperCase();
      const solutionHash = crypto.createHash('sha256').update(acceptedPlaintext).digest('hex');

      const res: any = await query(
        `INSERT INTO detective_puzzles (case_id, prompt, puzzle_type, solution_hash, accepted_plaintext, hint, unlocked_clue_text, action_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          caseId,
          data.prompt || 'Forensic Cipher',
          data.puzzle_type || 'CIPHER',
          solutionHash,
          acceptedPlaintext,
          data.hint || '',
          data.unlocked_clue_text || '',
          data.action_cost || 20
        ]
      );
      return NextResponse.json({ success: true, id: res.insertId });
    }

    if (componentType === 'solution') {
      await query(
        `INSERT INTO detective_case_solutions (case_id, culprit_suspect_id, motive, murder_weapon_or_method, critical_evidence_summary, explanation)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           culprit_suspect_id = VALUES(culprit_suspect_id),
           motive = VALUES(motive),
           murder_weapon_or_method = VALUES(murder_weapon_or_method),
           critical_evidence_summary = VALUES(critical_evidence_summary),
           explanation = VALUES(explanation)`,
        [
          caseId,
          data.culprit_suspect_id,
          data.motive || '',
          data.murder_weapon_or_method || '',
          data.critical_evidence_summary || '',
          data.explanation || ''
        ]
      );
      return NextResponse.json({ success: true, message: 'Case solution configured' });
    }

    return NextResponse.json({ error: 'Unknown componentType' }, { status: 400 });
  } catch (err: any) {
    console.error('Error adding case component:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
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

  const { searchParams } = new URL(req.url);
  const componentType = searchParams.get('type');
  const id = parseInt(searchParams.get('id') || '', 10);

  if (!componentType || isNaN(id)) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  const tableMap: Record<string, { table: string; col: string }> = {
    suspect: { table: 'detective_suspects', col: 'suspect_id' },
    location: { table: 'detective_locations', col: 'location_id' },
    evidence: { table: 'detective_evidence', col: 'evidence_id' },
    clue: { table: 'detective_clues', col: 'clue_id' },
    timeline: { table: 'detective_timeline_events', col: 'event_id' },
    puzzle: { table: 'detective_puzzles', col: 'puzzle_id' }
  };

  const target = tableMap[componentType];
  if (!target) {
    return NextResponse.json({ error: 'Invalid component type' }, { status: 400 });
  }

  await query(`DELETE FROM ${target.table} WHERE ${target.col} = ? AND case_id = ?`, [id, caseId]);
  return NextResponse.json({ success: true, message: 'Component removed' });
}
