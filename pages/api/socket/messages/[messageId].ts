import { currentProfilePages } from "@/lib/current-profile-pages";
import { NextApiResponseServerIo } from "@/types";
import { NextApiRequest } from "next";
import { pool } from "@/lib/db";
import { MemberRole } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "DELETE" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { messageId, serverId, channelId } = req.query as {
      messageId: string;
      serverId: string;
      channelId: string;
    };
    const { content } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!serverId) {
      return res.status(400).json({ error: "Server ID missing" });
    }

    if (!channelId) {
      return res.status(400).json({ error: "Channel ID missing" });
    }

    const serverResult = await pool.query(
      `SELECT 
         s.id, s.name, s.image_url, s.invite_code, s.profile_id,
         s.created_at, s.updated_at,
         json_agg(
           json_build_object(
             'id', m.id,
             'role', m.role,
             'profile_id', m.profile_id,
             'server_id', m.server_id,
             'created_at', m.created_at,
             'updated_at', m.updated_at
           )
         ) as members
       FROM servers s
       LEFT JOIN members m ON s.id = m.server_id
       WHERE s.id = $1 
         AND EXISTS (
           SELECT 1 FROM members WHERE server_id = $1 AND profile_id = $2
         )
       GROUP BY s.id, s.name, s.image_url, s.invite_code, s.profile_id, s.created_at, s.updated_at`,
      [serverId, profile.id]
    );

    const server = serverResult.rows[0];
    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channelResult = await pool.query(
      `SELECT id, name, type, profile_id, server_id, created_at, updated_at 
       FROM channels 
       WHERE id = $1 AND server_id = $2`,
      [channelId, serverId]
    );

    const channel = channelResult.rows[0];
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const memberResult = await pool.query(
      `SELECT id, role, profile_id, server_id, created_at, updated_at 
       FROM members 
       WHERE server_id = $1 AND profile_id = $2`,
      [serverId, profile.id]
    );

    const member = memberResult.rows[0];
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const messageResult = await pool.query(
      `SELECT 
         m.id, m.content, m.file_url, m.member_id, m.channel_id, 
         m.deleted, m.created_at, m.updated_at,
         mem.role, mem.profile_id, mem.server_id,
         p.name as profile_name, p.image_url as profile_image_url, 
         p.email as profile_email, p.user_id as profile_user_id
       FROM messages m
       JOIN members mem ON m.member_id = mem.id
       JOIN profiles p ON mem.profile_id = p.id
       WHERE m.id = $1 AND m.channel_id = $2 AND m.deleted = false`,
      [messageId, channelId]
    );

    const messageRaw = messageResult.rows[0];
    if (!messageRaw) {
      return res.status(404).json({ error: "Message not found" });
    }

    const message = {
      id: messageRaw.id,
      content: messageRaw.content,
      file_url: messageRaw.file_url,
      member_id: messageRaw.member_id,
      channel_id: messageRaw.channel_id,
      deleted: messageRaw.deleted,
      created_at: messageRaw.created_at,
      updated_at: messageRaw.updated_at,
      member: {
        id: messageRaw.member_id,
        role: messageRaw.role as MemberRole,
        profile_id: messageRaw.profile_id,
        server_id: messageRaw.server_id,
        created_at: messageRaw.created_at,
        updated_at: messageRaw.updated_at,
        profile: {
          id: messageRaw.profile_id,
          user_id: messageRaw.profile_user_id,
          name: messageRaw.profile_name,
          image_url: messageRaw.profile_image_url,
          email: messageRaw.profile_email,
        }
      }
    };

    const isMessageOwner = message.member_id === member.id;
    const isAdmin = member.role === "ADMIN";
    const isModerator = member.role === "MODERATOR";
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let updatedMessage = message;

    if (req.method === "DELETE") {
      const updateResult = await pool.query(
        `UPDATE messages 
         SET content = $1, file_url = $2, deleted = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING id, content, file_url, member_id, channel_id, deleted, created_at, updated_at`,
        ["Это сообщение удалено.", null, true, messageId]
      );

      const refreshedResult = await pool.query(
        `SELECT 
           m.id, m.content, m.file_url, m.member_id, m.channel_id, 
           m.deleted, m.created_at, m.updated_at,
           mem.role, mem.profile_id, mem.server_id,
           p.name as profile_name, p.image_url as profile_image_url, 
           p.email as profile_email, p.user_id as profile_user_id
         FROM messages m
         JOIN members mem ON m.member_id = mem.id
         JOIN profiles p ON mem.profile_id = p.id
         WHERE m.id = $1`,
        [messageId]
      );

      updatedMessage = {
        id: refreshedResult.rows[0].id,
        content: refreshedResult.rows[0].content,
        file_url: refreshedResult.rows[0].file_url,
        member_id: refreshedResult.rows[0].member_id,
        channel_id: refreshedResult.rows[0].channel_id,
        deleted: refreshedResult.rows[0].deleted,
        created_at: refreshedResult.rows[0].created_at,
        updated_at: refreshedResult.rows[0].updated_at,
        member: {
          id: refreshedResult.rows[0].member_id,
          role: refreshedResult.rows[0].role as MemberRole,
          profile_id: refreshedResult.rows[0].profile_id,
          server_id: refreshedResult.rows[0].server_id,
          created_at: refreshedResult.rows[0].created_at,
          updated_at: refreshedResult.rows[0].updated_at,
          profile: {
            id: refreshedResult.rows[0].profile_id,
            user_id: refreshedResult.rows[0].profile_user_id,
            name: refreshedResult.rows[0].profile_name,
            image_url: refreshedResult.rows[0].profile_image_url,
            email: refreshedResult.rows[0].profile_email,
          }
        }
      };
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updateResult = await pool.query(
        `UPDATE messages 
         SET content = $1, updated_at = NOW()
         WHERE id = $2 AND member_id = $3
         RETURNING id, content, file_url, member_id, channel_id, deleted, created_at, updated_at`,
        [content, messageId, member.id]
      );

      const refreshedResult = await pool.query(
        `SELECT 
           m.id, m.content, m.file_url, m.member_id, m.channel_id, 
           m.deleted, m.created_at, m.updated_at,
           mem.role, mem.profile_id, mem.server_id,
           p.name as profile_name, p.image_url as profile_image_url, 
           p.email as profile_email, p.user_id as profile_user_id
         FROM messages m
         JOIN members mem ON m.member_id = mem.id
         JOIN profiles p ON mem.profile_id = p.id
         WHERE m.id = $1`,
        [messageId]
      );

      updatedMessage = {
        id: refreshedResult.rows[0].id,
        content: refreshedResult.rows[0].content,
        file_url: refreshedResult.rows[0].file_url,
        member_id: refreshedResult.rows[0].member_id,
        channel_id: refreshedResult.rows[0].channel_id,
        deleted: refreshedResult.rows[0].deleted,
        created_at: refreshedResult.rows[0].created_at,
        updated_at: refreshedResult.rows[0].updated_at,
        member: {
          id: refreshedResult.rows[0].member_id,
          role: refreshedResult.rows[0].role as MemberRole,
          profile_id: refreshedResult.rows[0].profile_id,
          server_id: refreshedResult.rows[0].server_id,
          created_at: refreshedResult.rows[0].created_at,
          updated_at: refreshedResult.rows[0].updated_at,
          profile: {
            id: refreshedResult.rows[0].profile_id,
            user_id: refreshedResult.rows[0].profile_user_id,
            name: refreshedResult.rows[0].profile_name,
            image_url: refreshedResult.rows[0].profile_image_url,
            email: refreshedResult.rows[0].profile_email,
          }
        }
      };
    }

    const updateKey = `chat:${channelId}:messages:update`;
    res?.socket?.server?.io?.emit(updateKey, updatedMessage);

    return res.status(200).json(updatedMessage);

  } catch (error) {
    console.log("[MESSAGE_ID]", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
