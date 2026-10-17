import { NextRequest, NextResponse } from 'next/server';
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
  const { title, synopsis, difficulty, investigationBudget, incidentLocation, incidentTime } = body;

  const result: any = await query(
    'INSERT INTO detective_cases (title, synopsis, difficulty, investigation_budget, incident_location, incident_time, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
    [
      title,
      synopsis,
      difficulty || 'MEDIUM',
      investigationBudget || 100,
      incidentLocation || null,
      incidentTime || null
    ]
  );

  return NextResponse.json({ success: true, caseId: result.insertId });
}
