import { pool } from "@/lib/db";

export const getOrCreateConversation = async (memberOneId: string, memberTwoId: string) => {
  let conversation = await findConversation(memberOneId, memberTwoId) || 
                    await findConversation(memberTwoId, memberOneId);
  
  if (!conversation) {
    conversation = await createNewConversation(memberOneId, memberTwoId);
  }

  return conversation;
}

const findConversation = async (memberOneId: string, memberTwoId: string) => {
  const result = await pool.query(`
    SELECT 
      c.*,
      m1.id as member_one_id, m1.role as member_one_role,
      m2.id as member_two_id, m2.role as member_two_role,
      p1.id as profile_one_id, p1.name as profile_one_name, p1.image_url as profile_one_image_url,
      p2.id as profile_two_id, p2.name as profile_two_name, p2.image_url as profile_two_image_url
    FROM conversations c
    JOIN members m1 ON c.member_one_id = m1.id
    JOIN members m2 ON c.member_two_id = m2.id
    JOIN profiles p1 ON m1.profile_id = p1.id
    JOIN profiles p2 ON m2.profile_id = p2.id
    WHERE (c.member_one_id = $1 AND c.member_two_id = $2)
  `, [memberOneId, memberTwoId]);
  
  return result.rows[0] || null;
}

const createNewConversation = async (memberOneId: string, memberTwoId: string) => {
  try {
    const result = await pool.query(`
      INSERT INTO conversations (member_one_id, member_two_id)
      VALUES ($1, $2)
      RETURNING id, member_one_id, member_two_id, created_at, updated_at
    `, [memberOneId, memberTwoId]);
    
    const conversation = result.rows[0];
    if (!conversation) return null;

    // Получаем полную информацию с профилями
    const fullConversation = await findConversation(memberOneId, memberTwoId);
    return fullConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}
