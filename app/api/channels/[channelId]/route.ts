import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { ServerWithMembersWithProfiles } from "@/types";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const { channelId } = await context.params;

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    const deleteResult = await pool.query(`
      DELETE FROM channels 
      WHERE id = $1 
      AND name != 'general'
      AND server_id IN (
        SELECT s.id 
        FROM servers s 
        JOIN members m ON s.id = m.server_id 
        WHERE m.profile_id = $2 
        AND m.role IN ('ADMIN', 'MODERATOR')
        AND s.id = $3
      )
      RETURNING id
    `, [channelId, profile.id, serverId]);

    if (deleteResult.rows.length === 0) {
      return new NextResponse("Channel not found or unauthorized", { status: 404 });
    }

    const serverResult = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.image_url,
         s.invite_code,
         s.profile_id,
         s.created_at,
         s.updated_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', m.id,
               'role', m.role,
               'profile_id', m.profile_id,
               'server_id', m.server_id,
               'created_at', m.created_at,
               'updated_at', m.updated_at,
               'profile', json_build_object(
                 'id', p.id,
                 'user_id', p.user_id,
                 'name', p.name,
                 'image_url', p.image_url,
                 'email', p.email,
                 'created_at', p.created_at,
                 'updated_at', p.updated_at
               )
             )
             ORDER BY 
               CASE m.role 
                 WHEN 'ADMIN' THEN 1
                 WHEN 'MODERATOR' THEN 2
                 WHEN 'GUEST' THEN 3
               END
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'::json
         ) AS members
       FROM servers s
       LEFT JOIN members m ON s.id = m.server_id
       LEFT JOIN profiles p ON m.profile_id = p.id
       WHERE s.id = $1
       GROUP BY 
         s.id, s.name, s.image_url, s.invite_code, 
         s.profile_id, s.created_at, s.updated_at`,
      [serverId]
    );

    const server: ServerWithMembersWithProfiles = serverResult.rows[0];

    return NextResponse.json(server);

  } catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ channelId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const { channelId } = await context.params;
    const { name, type } = await req.json();

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 })
    }

    if (!['TEXT', 'AUDIO', 'VIDEO'].includes(type)) {
      return new NextResponse("Invalid channel type", { status: 400 });
    }

    const updateResult = await pool.query(`
      UPDATE channels 
      SET name = $1, type = $2, updated_at = NOW()
      WHERE id = $3 
      AND name != 'general'
      AND server_id IN (
        SELECT s.id 
        FROM servers s 
        JOIN members m ON s.id = m.server_id 
        WHERE m.profile_id = $4 
        AND m.role IN ('ADMIN', 'MODERATOR')
        AND s.id = $5
      )
      RETURNING id
    `, [name, type, channelId, profile.id, serverId]);

    if (updateResult.rows.length === 0) {
      return new NextResponse("Channel not found or unauthorized", { status: 404 });
    }

    const serverResult = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.image_url,
         s.invite_code,
         s.profile_id,
         s.created_at,
         s.updated_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', m.id,
               'role', m.role,
               'profile_id', m.profile_id,
               'server_id', m.server_id,
               'created_at', m.created_at,
               'updated_at', m.updated_at,
               'profile', json_build_object(
                 'id', p.id,
                 'user_id', p.user_id,
                 'name', p.name,
                 'image_url', p.image_url,
                 'email', p.email,
                 'created_at', p.created_at,
                 'updated_at', p.updated_at
               )
             )
             ORDER BY 
               CASE m.role 
                 WHEN 'ADMIN' THEN 1
                 WHEN 'MODERATOR' THEN 2
                 WHEN 'GUEST' THEN 3
               END
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'::json
         ) AS members
       FROM servers s
       LEFT JOIN members m ON s.id = m.server_id
       LEFT JOIN profiles p ON m.profile_id = p.id
       WHERE s.id = $1
       GROUP BY 
         s.id, s.name, s.image_url, s.invite_code, 
         s.profile_id, s.created_at, s.updated_at`,
      [serverId]
    );

    const server: ServerWithMembersWithProfiles = serverResult.rows[0];

    return NextResponse.json(server);

  } catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
