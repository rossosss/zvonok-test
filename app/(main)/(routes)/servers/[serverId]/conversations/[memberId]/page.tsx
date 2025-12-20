import { ChatHeader } from "@/components/chat/chat-header";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { pool } from "@/lib/db";
import { redirect } from "next/navigation";

interface MemberIdPageProps {
  params: Promise<{ memberId: string; serverId: string }>;
}

const MemberIdPage = async ({ params }: MemberIdPageProps) => {
  const { memberId, serverId } = await params;
  const profile = await currentProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  const currentMemberResult = await pool.query(`
    SELECT 
      m.*,
      p.id as profile_id, p.name as profile_name, p.image_url as profile_image_url,
      p.user_id, p.email, p.created_at as profile_created_at, p.updated_at as profile_updated_at
    FROM members m
    JOIN profiles p ON m.profile_id = p.id
    WHERE m.server_id = $1 AND p.id = $2
  `, [serverId, profile.id]);

  const currentMember = currentMemberResult.rows[0];
  if (!currentMember) {
    redirect("/");
  }

  const conversation = await getOrCreateConversation(
    currentMember.id, 
    memberId
  );

  if (!conversation) {
    redirect(`/servers/${serverId}`);
  }

  const profileOneId = conversation.profile_one_id;
  const profileTwoId = conversation.profile_two_id;
  
  const otherMember = profileOneId === profile.id 
    ? { 
        id: conversation.member_two_id, 
        profile: {
          id: conversation.profile_two_id,
          name: conversation.profile_two_name,
          image_url: conversation.profile_two_image_url
        }
      }
    : { 
        id: conversation.member_one_id, 
        profile: {
          id: conversation.profile_one_id,
          name: conversation.profile_one_name,
          image_url: conversation.profile_one_image_url
        }
      };

  return ( 
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        imageUrl={otherMember.profile.image_url}
        name={otherMember.profile.name}
        serverId={serverId}
        type="conversation"
      />
    </div>
  );
}

export default MemberIdPage;
