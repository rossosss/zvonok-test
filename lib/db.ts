import { Pool, QueryResult, QueryResultRow } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Server = {
  id: string;
  name: string;
  image_url: string | null;
  invite_code: string | null;
  profile_id: string;
  created_at: Date;
  updated_at: Date;
};

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}
