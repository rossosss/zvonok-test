// pages/api/socket/messages.ts
import { currentProfilePages } from "@/lib/current-profile-pages";
import { DBMember, NextApiResponseServerIo } from "@/types";
import { NextApiRequest } from "next";
import { pool } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { content, fileUrl } = body;

    const serverId = Array.isArray(req.query.serverId) ? req.query.serverId[0] : req.query.serverId;
    const channelId = Array.isArray(req.query.channelId) ? req.query.channelId[0] : req.query.channelId;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });
    if (!serverId) return res.status(400).json({ error: "Server ID missing" });
    if (!channelId) return res.status(400).json({ error: "Channel ID missing" });
    if (!content) return res.status(400).json({ error: "Content missing" });

    const serverResult = await pool.query(`
      SELECT 
        s.*,
        json_agg(
          json_build_object(
          'id', m.id,
          'role', m.role,
          'profile_id', m.profile_id,
          'server_id', m.server_id,
          'created_at', m.created_at,
          'updated_at', m.updated_at
        )
        ) FILTER (WHERE m.id IS NOT NULL) AS members
      FROM servers s
      LEFT JOIN members m ON m.server_id = s.id 
      WHERE s.id = $1
      GROUP BY s.id
      LIMIT 1
    `, [serverId]);

    const serverRow = serverResult.rows[0];
    if (!serverRow) {
      return res.status(404).json({ message: "Server not found" });
    }

    const server = {
      ...serverRow,
      members: serverRow.members || []
    };

    const channelResult = await pool.query(`
      SELECT * FROM channels 
      WHERE id = $1 AND server_id = $2 
      LIMIT 1
    `, [channelId, serverId]);

    const channel = channelResult.rows[0];
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const member = server.members.find((m: DBMember) => m.profile_id === profile.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const messageResult = await pool.query(`
      INSERT INTO messages (content, file_url, member_id, channel_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, file_url, member_id, channel_id, deleted, created_at, updated_at
    `, [content, fileUrl || null, member.id, channelId]);

    const message = messageResult.rows[0];

    const channelKey = `chat:${channelId}:messages`;
    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);

  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return res.status(500).json({ message: "Internal error" });
  }
}
