import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { DBMessage, MemberRole, MessageWithMemberWithProfile } from "@/types";

const MESSAGES_BATCH = 10;

type MessageFromQuery = {
  id: string;
  content: string;
  file_url: string | null;
  member_id: string;
  channel_id: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
  role: string;
  profile_id: string;
  server_id: string;
  profile_name: string;
  profile_image_url: string | null;
  profile_email: string | null;
  profile_user_id: string;
  profile_created_at: Date;
  profile_updated_at: Date;
};

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    let messages: MessageFromQuery[] = [];
    let nextCursor: string | null = null;

    if (cursor) {
      const result = await pool.query(
        `SELECT 
           m.id, m.content, m.file_url, m.member_id, m.channel_id, 
           m.deleted, m.created_at, m.updated_at,
           mem.role, mem.profile_id, mem.server_id,
           p.name as profile_name, p.image_url as profile_image_url, p.email as profile_email,
           p.user_id as profile_user_id, p.created_at as profile_created_at, p.updated_at as profile_updated_at
         FROM messages m
         JOIN members mem ON m.member_id = mem.id
         JOIN profiles p ON mem.profile_id = p.id
         WHERE m.channel_id = $1 
           AND m.id > $2 
         ORDER BY m.created_at DESC
         LIMIT $3`,
        [channelId, cursor, MESSAGES_BATCH + 1]
      );

      messages = result.rows.slice(0, MESSAGES_BATCH);
      
      if (result.rows.length === MESSAGES_BATCH + 1) {
        nextCursor = result.rows[MESSAGES_BATCH].id;
      }
    } else {
      const result = await pool.query(
        `SELECT 
           m.id, m.content, m.file_url, m.member_id, m.channel_id, 
           m.deleted, m.created_at, m.updated_at,
           mem.role, mem.profile_id, mem.server_id,
           p.name as profile_name, p.image_url as profile_image_url, p.email as profile_email,
           p.user_id as profile_user_id, p.created_at as profile_created_at, p.updated_at as profile_updated_at
         FROM messages m
         JOIN members mem ON m.member_id = mem.id
         JOIN profiles p ON mem.profile_id = p.id
         WHERE m.channel_id = $1 
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [channelId, MESSAGES_BATCH + 1]
      );

      messages = result.rows.slice(0, MESSAGES_BATCH);
      
      if (result.rows.length === MESSAGES_BATCH + 1) {
        nextCursor = result.rows[MESSAGES_BATCH].id;
      }
    }

  const formattedMessages = messages.map((msg: MessageFromQuery) => ({
    id: msg.id,
    content: msg.content,
    file_url: msg.file_url,
    member_id: msg.member_id,
    channel_id: msg.channel_id,
    deleted: msg.deleted,
    created_at: msg.created_at,
    updated_at: msg.updated_at,
    member: {
      id: msg.member_id,
      role: msg.role as MemberRole,
      profile_id: msg.profile_id,
      server_id: msg.server_id,
      created_at: msg.created_at, // используем member created_at из JOIN
      updated_at: msg.updated_at, // используем member updated_at из JOIN
      profile: {
        id: msg.profile_id,
        user_id: msg.profile_user_id,
        name: msg.profile_name,
        image_url: msg.profile_image_url,
        email: msg.profile_email,
        created_at: msg.profile_created_at,
        updated_at: msg.profile_updated_at
      }
    }
  })) satisfies MessageWithMemberWithProfile[]; // ✅ Проверяем тип результата

    return NextResponse.json({
      items: formattedMessages,
      nextCursor
    });

  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
