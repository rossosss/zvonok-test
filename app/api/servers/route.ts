import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const imageFile = formData.get("imageFile") as File | null;

    if (!name || !imageFile) {
      return new NextResponse("Missing name or imageFile", { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = imageFile.name.split(".").pop() || "png";
    const filename = `server-${profile.id}-${Date.now()}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;
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
