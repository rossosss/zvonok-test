// ========================================
// ZVONOK DATABASE TYPES
// ========================================
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io"

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export type MemberRole = "ADMIN" | "MODERATOR" | "GUEST";

export enum ChannelType {
  TEXT = "TEXT",
  AUDIO = "AUDIO", 
  VIDEO = "VIDEO"
}

export interface DBServer {
  id: string;
  name: string;
  image_url: string | null;
  invite_code: string | null;
  profile_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBMember {
  id: string;
  role: MemberRole;
  profile_id: string;
  server_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBProfile {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DBChannel {
  id: string;
  name: string;
  type: ChannelType;
  profile_id: string;
  server_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBMessage {
  id: string;
  content: string;
  file_url: string | null;
  member_id: string;
  channel_id: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DBConversation {
  id: string;
  member_one_id: string;
  member_two_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBDirectMessage {
  id: string;
  content: string;
  file_url: string | null;
  member_id: string;
  conversation_id: string;
  deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ServerWithMembersWithProfiles = DBServer & {
  members: (DBMember & { profile: DBProfile })[];
};

export type ChannelWithServerAndMembers = DBChannel & {
  server: DBServer;
  members: DBMember[];
};

export type MessageWithMemberAndChannel = DBMessage & {
  member: DBMember & { profile: DBProfile };
  channel: DBChannel;
};

export type FullServer = ServerWithMembersWithProfiles & {
  channels: (DBChannel & {
    messages: MessageWithMemberAndChannel[];
  })[];
};

