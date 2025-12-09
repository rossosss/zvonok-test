import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = await req.json();

    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!name || !imageUrl) {
      return new NextResponse("Missing name or imageUrl", { status: 400 });
    }

    const inviteCode = uuidv4();

    const serverResult = await pool.query(
      `INSERT INTO servers (name, image_url, invite_code, profile_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, imageUrl, inviteCode, profile.id],
    );
    const server = serverResult.rows[0];

    const channelResult = await pool.query(
      `INSERT INTO channels (name, type, profile_id, server_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      ["general", "TEXT", profile.id, server.id],
    );
    const channel = channelResult.rows[0];

    const memberResult = await pool.query(
      `INSERT INTO members (role, profile_id, server_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      ["ADMIN", profile.id, server.id],
    );
    const member = memberResult.rows[0];

    return NextResponse.json({
      server,
      defaultChannel: channel,
      member,
    });
  } catch (error) {
    console.error("[SERVER_POST]", error);
    return new NextResponse("InternalError", { status: 500 });
  }
}
