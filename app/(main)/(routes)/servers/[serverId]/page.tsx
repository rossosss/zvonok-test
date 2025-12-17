import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
  params: Promise<{
    serverId: string;
  }>;
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
  const profile = await currentProfile();
  const { serverId } = await params;

  if (!profile) {
    return redirect("/sign-in");
  }

  const result = await pool.query(`
    SELECT c.id, c.name
    FROM servers s
    INNER JOIN members m ON s.id = m.server_id 
    INNER JOIN channels c ON s.id = c.server_id 
    WHERE s.id = $1 
    AND m.profile_id = $2
    AND c.name = 'general'
    LIMIT 1
  `, [serverId, profile.id]);

  const channel = result.rows[0];
  console.log(channel);

  if (!channel) {
    return redirect("/sign-in");
  }

  if (channel.name !== "general") {
    return null;
  }

  return redirect(`/servers/${serverId}/channels/${channel.id}`);
}

export default ServerIdPage;
