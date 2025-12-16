import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
 
import { redirect } from "next/navigation";
import { ServerHeader } from "./server-header";
import { ChannelType, DBChannel, DBMember, DBProfile, MemberRole, ServerWithMembersWithProfiles } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerSearch } from "./server-search";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ServerSection } from "./sever-section";
import { ServerChannel } from "./server-channel";
import { ServerMember } from "./server-member";

interface ServerSidebarProps {
  serverId: string;
}

const iconMap: Record<ChannelType, React.ReactNode> = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />
};

const roleIconMap: Record<MemberRole, React.ReactNode> = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 mr-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" />
};

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

  const channelsResult = await pool.query<DBChannel>(
    `
      SELECT *
      FROM channels
      WHERE server_id = $1
      ORDER BY created_at ASC
    `,
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

  const otherMembers = server.members.filter(
  (m) => m.profile_id !== profile.id,
);

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2B31] bg-[#F2F3F5]">
      <ServerHeader 
        server={server}
        role={role}
      />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch data={[
            {
              label: "Текстовые каналы",
              type: "channel",
              data: textChannels?.map((channel) => ({
                id: channel.id,
                name: channel.name,
                icon: iconMap[channel.type],
              }))
            },
            {
              label: "Аудио каналы",
              type: "channel",
              data: audioChannels?.map((channel) => ({
                id: channel.id,
                name: channel.name,
                icon: iconMap[channel.type],
              }))
            },
            {
              label: "Видео каналы",
              type: "channel",
              data: videoChannels?.map((channel) => ({
                id: channel.id,
                name: channel.name,
                icon: iconMap[channel.type],
              }))
            },
            {
              label: "Участники",
              type: "member",
              data: otherMembers.map((member) => ({
              id: member.id,
              name: member.profile.name,
              icon: roleIconMap[member.role],
            }))
            },
          ]}/>
        </div>
        <Separator className="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2" />
        {!!textChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.TEXT}
              role={role}
              label="Текстовые каналы"
            />
            <div className="space-y-[2px]">
              {textChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                />
              ))}
            </div>
          </div>
        )}
        {!!audioChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.AUDIO}
              role={role}
              label="Голосовые каналы"
            />
            <div className="space-y-[2px]">
              {audioChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                />
              ))}
            </div>
          </div>
        )}
        {!!videoChannels?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="channels"
              channelType={ChannelType.VIDEO}
              role={role}
              label="Видео каналы"
            />
            <div className="space-y-[2px]">
              {videoChannels.map((channel) => (
                <ServerChannel
                  key={channel.id}
                  channel={channel}
                  role={role}
                  server={server}
                />
              ))}
            </div>
          </div>
        )}
        {!!otherMembers?.length && (
          <div className="mb-2">
            <ServerSection
              sectionType="members"
              role={role}
              label="Участники"
              server={server}
            />
            <div className="space-y-[2px]">
              {otherMembers.map((member) => (
                <ServerMember
                  key={member.id}
                  member={member}
                  server={server}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
   )
}