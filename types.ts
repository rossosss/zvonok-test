export type MemberRole = "ADMIN" | "MODERATOR" | "GUEST";

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
  role: "ADMIN" | "MODERATOR" | "GUEST";
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

// Аналог Prisma-типа
export type ServerWithMembersWithProfiles = DBServer & {
  members: (DBMember & { profile: DBProfile })[];
};
