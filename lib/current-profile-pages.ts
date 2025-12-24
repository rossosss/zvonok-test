import { getAuth } from "@clerk/nextjs/server";
import { pool } from "@/lib/db";
import { NextApiRequest } from "next";

export const currentProfilePages = async (req: NextApiRequest) => {
  const { userId } = await getAuth(req);

  if (!userId) {
    return null;
  }

  const result = await pool.query(
    "SELECT * FROM profiles WHERE user_id = $1 LIMIT 1",
    [userId],
  );

  const profile = result.rows[0] || null;

  return profile;
};
