import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await context.params;
    const profile = await currentProfile();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });
    if (!serverId) return new NextResponse("Server ID Missing", { status: 400 });

    const memberCheck = await pool.query(
      `SELECT 1 FROM members WHERE server_id = $1 AND profile_id = $2`,
      [serverId, profile.id]
    );

    if (memberCheck.rows.length === 0) {
      return new NextResponse("Not a member", { status: 400 });
    }

    const serverCheck = await pool.query(
      `SELECT profile_id FROM servers WHERE id = $1`,
      [serverId]
    );

    if (serverCheck.rows[0]?.profile_id === profile.id) {
      return new NextResponse("Cannot leave as owner", { status: 400 });
    }

    await pool.query(
      `DELETE FROM members WHERE server_id = $1 AND profile_id = $2`,
      [serverId, profile.id]
    );

    const serversResult = await pool.query(
      `SELECT 
         s.id, s.name, s.image_url, s.invite_code, s.profile_id,
         s.created_at, s.updated_at,
         m.role
       FROM servers s
       JOIN members m ON s.id = m.server_id
       WHERE m.profile_id = $1
       ORDER BY s.created_at DESC`,
      [profile.id]
    );

    const servers = serversResult.rows

    return NextResponse.json(servers);
  } catch (error) {
    console.log("[SERVER_ID_LEAVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
