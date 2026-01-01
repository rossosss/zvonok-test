import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface InviteCodePageProps {
  params: Promise<{
    inviteCode: string;
  }>
}

const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const profile = await currentProfile();
  const { inviteCode } = await params;

  if (!profile) {
    return redirect("/sign-in");
  }

  if (!inviteCode) {
    return redirect("/");
  }

  const existingServerResult = await pool.query(
    `
    SELECT s.*
    FROM servers s
    JOIN members m ON m.server_id = s.id
    WHERE s.invite_code = $1
      AND m.profile_id = $2
    LIMIT 1
    `,
    [inviteCode, profile.id],
  );

  const existingServer = existingServerResult.rows[0];

  if (existingServer) {
    redirect(`/servers/${existingServer.id}`);
  }

  const serverResult = await pool.query(
    `SELECT * FROM servers WHERE invite_code = $1 LIMIT 1`,
    [inviteCode],
  );
  const server = serverResult.rows[0];

  if (!server) {
    return redirect("/");
  }

  await pool.query(
    `
    INSERT INTO members (role, profile_id, server_id)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
    `,
    ["GUEST", profile.id, server.id],
  );
  if (server) {
    redirect(`/servers/${server.id}`);
  }

  return null;
};

export default InviteCodePage;
