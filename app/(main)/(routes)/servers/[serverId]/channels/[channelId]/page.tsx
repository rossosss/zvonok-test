import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";

import { pool } from "@/lib/db"
import { DBChannel, DBMember } from "@/types";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

const ChannelIdPage = async ({
  params
}: ChannelIdPageProps) => {
  const { serverId, channelId } = await params;
  const profile = await currentProfile();

  if(!profile) {
    redirect("/sign-in");
  }

  const channelResult = await pool.query(`
    SELECT id, name, type, profile_id, server_id, created_at, updated_at
    FROM channels 
    WHERE id = $1
  `, [channelId]);

const channel: DBChannel | null = channelResult.rows[0];

const memberResult = await pool.query(`
  SELECT id, role, profile_id, server_id, created_at, updated_at
  FROM members 
  WHERE server_id = $1 AND profile_id = $2
`, [serverId, profile.id]);

const member: DBMember | null = memberResult.rows[0];

if(!channel || !member) {
  redirect("/")
}

  return ( 
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channel.name}
        serverId={channel.server_id}
        type="channel"
        
      />
      <ChatMessages 
        member={member}
        name={channel.name}
        chatId={channel.id}
        type="channel"
        apiUrl="/api/messages"
        socketUrl="/api/socket/messages"
        socketQuery={{
          channelId: channel.id,
          serverId: channel.server_id, 
        }}
        paramKey="channelId"
        paramValue={channel.id}
      />
      <ChatInput
        name={channel.name}
        type="channel"
        apiUrl="/api/socket/messages"
        query={{
          channelId: channel.id,
          serverId: channel.server_id
        }}
      />
    </div>
   );
}
 
export default ChannelIdPage;
