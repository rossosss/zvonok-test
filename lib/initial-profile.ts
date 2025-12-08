import { currentUser } from "@clerk/nextjs/server";
import { RedirectToSignIn } from "@clerk/nextjs";
import { pool } from "@/lib/db";

export const initialProfile = async () => {
  const user = await currentUser();
  
  if (!user) {
    return RedirectToSignIn;
  }

  const userId = user.id;
  const username = user.username ?? user.firstName ?? 'User';
  const email = user.emailAddresses[0]?.emailAddress;
  const imageUrl = user.imageUrl;

  let profile = await pool.query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [userId]
  ).then(r => r.rows[0]);

  if (!profile) {
    const result = await pool.query(
      `INSERT INTO profiles (user_id, name, email, image_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, username, email, imageUrl]
    );
    profile = result.rows[0];
  }

  return profile;
};
