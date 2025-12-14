import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await context.params;
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID Missing", { status: 400 });
    }

    const inviteCode = uuidv4();

    const result = await pool.query(
      `
      UPDATE servers
      SET invite_code = $1
      WHERE id = $2
        AND profile_id = $3
      RETURNING *
      `,
      [inviteCode, serverId, profile.id],
    );

    const server = result.rows[0];
    if (!server) {
      return new NextResponse("Server not found", { status: 404 });
    }

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
