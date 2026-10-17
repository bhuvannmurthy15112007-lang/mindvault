import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql/db';
import { ensureCoreTables } from '@/lib/mysql/ensureTables';

export async function GET(req: NextRequest) {
  try {
    await ensureCoreTables();

    const cases = await query<any[]>(
      `SELECT case_id, title, synopsis, difficulty, investigation_budget, incident_location, incident_time 
       FROM detective_cases 
       WHERE is_active = TRUE 
       ORDER BY 
         CASE difficulty 
           WHEN 'EASY' THEN 1 
           WHEN 'MEDIUM' THEN 2 
           WHEN 'HARD' THEN 3 
           ELSE 4 
         END, 
         case_id ASC`
    );

    return NextResponse.json({ cases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
