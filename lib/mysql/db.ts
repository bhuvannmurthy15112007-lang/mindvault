import mysql, { Pool, PoolConnection } from 'mysql2/promise';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mindvault',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getPool();
  try {
    const [results] = await p.execute(sql, params);
    return results as T;
  } catch (err: any) {
    console.error('[MySQL Error]', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      sql: sql.substring(0, 100)
    });
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const conn = await p.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function testDatabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  host: string;
  port: number;
  database: string;
  error?: string;
}> {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const database = process.env.DB_NAME || 'mindvault';

  try {
    const p = getPool();
    const conn = await p.getConnection();
    await conn.ping();
    conn.release();
    return {
      ok: true,
      message: 'Successfully connected to MySQL database engine.',
      host,
      port,
      database
    };
  } catch (err: any) {
    return {
      ok: false,
      message: 'Failed to establish connection to MySQL database.',
      host,
      port,
      database,
      error: err.code || err.message
    };
  }
}
