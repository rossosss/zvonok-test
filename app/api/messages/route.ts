import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { DBMessage } from "@/types";

const MESSAGES_BATCH = 10;

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

    let messages: DBMessage[] = [];
    let nextCursor: string | null = null;

    if (cursor) {
      // Запрос с курсором (следующая страница)
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
           AND m.deleted = false
         ORDER BY m.created_at DESC
         LIMIT $3`,
        [channelId, cursor, MESSAGES_BATCH + 1]
      );

      messages = result.rows.slice(0, MESSAGES_BATCH);
      
      // Проверяем наличие следующей страницы
      if (result.rows.length === MESSAGES_BATCH + 1) {
        nextCursor = result.rows[MESSAGES_BATCH].id;
      }
    } else {
      // Первый запрос без курсора
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
           AND m.deleted = false
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [channelId, MESSAGES_BATCH + 1]
      );

      messages = result.rows.slice(0, MESSAGES_BATCH);
      
      if (result.rows.length === MESSAGES_BATCH + 1) {
        nextCursor = result.rows[MESSAGES_BATCH].id;
      }
    }

    // Трансформируем данные под тип DBMessage с вложенными объектами
    const formattedMessages = messages.map((msg: any) => ({
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
        role: msg.role,
        profile_id: msg.profile_id,
        server_id: msg.server_id,
        created_at: msg.created_at, // member created_at
        updated_at: msg.updated_at, // member updated_at
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
    }));

    return NextResponse.json({
      items: formattedMessages,
      nextCursor
    });

  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
