import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { currentProfile } from "@/lib/current-profile";
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

    const serverRes = await pool.query(
      `SELECT * FROM servers WHERE id = $1 AND profile_id = $2`,
      [serverId, profile.id],
    );
    const server = serverRes.rows[0];
    if (!server) return new NextResponse("Server not found", { status: 404 });

    const contentType = req.headers.get("content-type") || "";

    // JSON: только имя / url
    if (contentType.includes("application/json")) {
      const { name, imageUrl } = await req.json();

      if (!name) {
        return new NextResponse("Server name required", { status: 400 });
      }

      const updated = await pool.query(
        `UPDATE servers
         SET name = $1, image_url = $2, updated_at = NOW()
         WHERE id = $3 AND profile_id = $4
         RETURNING *`,
        [name, imageUrl ?? server.image_url, serverId, profile.id],
      );

      return NextResponse.json(updated.rows[0]);
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const name = formData.get("name") as string | null;
      const imageFile = formData.get("imageFile");

      if (!name) {
        return new NextResponse("Server name required", { status: 400 });
      }

      let imageUrl = server.image_url as string | null;

      if (imageFile && imageFile instanceof File) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = imageFile.name.split(".").pop() || "png";
        const filename = `server-${profile.id}-${Date.now()}.${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);

        imageUrl = `/uploads/${filename}`;
      }

      const updated = await pool.query(
        `UPDATE servers
         SET name = $1, image_url = $2, updated_at = NOW()
         WHERE id = $3 AND profile_id = $4
         RETURNING *`,
        [name, imageUrl, serverId, profile.id],
      );

      return NextResponse.json(updated.rows[0]);
    }

    return new NextResponse("Unsupported content type", { status: 415 });
  } catch (error) {
    console.error("[SERVER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
