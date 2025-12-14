import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { ServerWithMembersWithProfiles } from "@/types";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Channel name required", { status: 400 });
    }

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    const permissionsResult = await pool.query(
      `SELECT m.role 
       FROM members m 
       WHERE m.profile_id = $1 AND m.server_id = $2 
       AND m.role IN ($3, $4)`,
      [profile.id, serverId, "ADMIN", "MODERATOR"]
    );

    if (permissionsResult.rows.length === 0) {
      return new NextResponse("Insufficient permissions", { status: 403 });
    }

    const channelResult = await pool.query(
      `INSERT INTO channels (name, type, profile_id, server_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, type, profile_id, server_id, created_at, updated_at`,
      [name, type, profile.id, serverId]
    );
    const serverResult = await pool.query(
      `SELECT 
         s.id, s.name, s.image_url, s.invite_code, s.profile_id, s.created_at, s.updated_at,
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
         ) as members
       FROM servers s
       LEFT JOIN members m ON s.id = m.server_id
       LEFT JOIN profiles p ON m.profile_id = p.id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.image_url, s.invite_code, s.profile_id, s.created_at, s.updated_at`,
      [serverId]
    );

    const server: ServerWithMembersWithProfiles = serverResult.rows[0];
    
    return NextResponse.json(server);

  } catch (error) {
    console.log("[CHANNELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
