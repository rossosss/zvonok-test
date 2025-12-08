import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";
import { InitialModal } from "@/components/modals/initial-modal";

const SetupPage = async () => {
  const profile = await initialProfile();

  const serverResult = await pool.query(
    `SELECT DISTINCT s.* 
     FROM servers s
     INNER JOIN members m ON s.id = m.server_id
     WHERE m.profile_id = $1`,
    [profile.id]
  );

  const server = serverResult.rows[0];

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return <InitialModal />;
};

export default SetupPage;
