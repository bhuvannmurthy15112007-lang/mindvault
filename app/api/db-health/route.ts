import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/mysql/db';

export async function GET() {
  const status = await testDatabaseConnection();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
