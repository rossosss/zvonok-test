import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
 
import { redirect } from "next/navigation";
import { ServerHeader } from "./server-header";
import { DBMember, DBProfile, MemberRole, ServerWithMembersWithProfiles } from "@/types";

interface ServerSidebarProps {
  serverId: string;
}

export const ServerSidebar = async ({
  serverId
}: ServerSidebarProps) => {
  const profile = await currentProfile();

  if (!profile) {
    return redirect("/");
  }

  const serverResult = await pool.query<ServerWithMembersWithProfiles>(
    `SELECT *
     FROM servers
     WHERE id = $1
     LIMIT 1`,
    [serverId],
  );
  const serverRow = serverResult.rows[0];
  if (!serverRow) return redirect("/");

  const channelsResult = await pool.query(
    `SELECT *
     FROM channels
     WHERE server_id = $1
     ORDER BY created_at ASC`,
    [serverRow.id],
  );
  const channels = channelsResult.rows;

  const membersResult = await pool.query(
    `
    SELECT
      m.id         AS m_id,
      m.role       AS m_role,
      m.profile_id AS m_profile_id,
      m.server_id  AS m_server_id,
      m.created_at AS m_created_at,
      m.updated_at AS m_updated_at,
      p.id         AS p_id,
      p.user_id    AS p_user_id,
      p.name       AS p_name,
      p.image_url  AS p_image_url,
      p.email      AS p_email,
      p.created_at AS p_created_at,
      p.updated_at AS p_updated_at
    FROM members m
    JOIN profiles p ON p.id = m.profile_id
    WHERE m.server_id = $1
    ORDER BY m.role ASC
    `,
    [serverRow.id],
  );

  const membersWithProfiles: ServerWithMembersWithProfiles["members"] =
  membersResult.rows.map((row) => ({
    id: row.m_id,
    role: row.m_role as MemberRole,
    profile_id: row.m_profile_id,
    server_id: row.m_server_id,
    created_at: row.m_created_at,
    updated_at: row.m_updated_at,
    profile: {
      id: row.p_id,
      user_id: row.p_user_id,
      name: row.p_name,
      image_url: row.p_image_url,
      email: row.p_email,
      created_at: row.p_created_at,
      updated_at: row.p_updated_at,
    },
  }));

  const server: ServerWithMembersWithProfiles = {
    ...serverRow,
    members: membersWithProfiles,
  };

  const textChannels  = channels.filter(c => c.type === "TEXT");
  const audioChannels = channels.filter(c => c.type === "AUDIO");
  const videoChannels = channels.filter(c => c.type === "VIDEO");

  const selfMember = server.members.find(
    (m) => m.profile_id === profile.id,
  );
  const role = selfMember?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2B31] bg-[#F2F3F5]">
      <ServerHeader 
        server={server}
        role={role}
      />
    </div>
   )
}