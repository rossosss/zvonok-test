import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { ServerWithMembersWithProfiles } from "@/types";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { memberId } = await context.params;
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID Missing", { status: 400 });
    }

    await pool.query(
      `DELETE FROM members
       WHERE id = $1 
         AND server_id = $2
         AND profile_id != $3`,
      [memberId, serverId, profile.id]
    );

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
    console.log("[MEMBER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const profile = await currentProfile();
    const { memberId } = await context.params;
    const { searchParams } = new URL(req.url);
    const { role } = await req.json();

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    if (!memberId) {
      return new NextResponse("Member ID Missing", { status: 400 });
    }

    const updateResult = await pool.query(
      `UPDATE members 
       SET role = $1, updated_at = NOW()
       WHERE id = $2 
         AND server_id = $3 
         AND profile_id != $4 
       RETURNING *`,
      [role, memberId, serverId, profile.id]
    );

    if (updateResult.rows.length === 0) {
      return new NextResponse("Member not found or unauthorized", { status: 404 });
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
    server.members = server.members || [];

    return NextResponse.json(server);
  } catch (error) {
    console.log("[MEMBER_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
