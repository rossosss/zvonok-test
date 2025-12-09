import { auth } from "@clerk/nextjs/server";
import { pool } from "@/lib/db";

export const currentProfile = async () => {
  const { userId } = await auth();

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
