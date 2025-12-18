-- ========================================
-- ZVONOK DATABASE MIGRATION (COMPLETE)
-- ========================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Servers
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  invite_code TEXT UNIQUE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_servers_profile_id ON servers(profile_id);

-- 3. Members (✅ уже есть) 
CREATE TYPE member_role AS ENUM ('ADMIN', 'MODERATOR', 'GUEST');
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role member_role DEFAULT 'GUEST',
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_profile_id ON members(profile_id);
CREATE INDEX IF NOT EXISTS idx_members_server_id ON members(server_id);

-- 4. Channels
CREATE TYPE channel_type AS ENUM ('TEXT', 'AUDIO', 'VIDEO');
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type channel_type DEFAULT 'TEXT',
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_channels_profile_id ON channels(profile_id);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);

-- 5. Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  file_url TEXT,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_member_id ON messages(member_id);

-- 6. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_one_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_two_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_one_id, member_two_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_member_two_id ON conversations(member_two_id);

-- 7. Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  file_url TEXT,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_member_id ON direct_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id);

-- ✅ Проверка всех таблиц
SELECT 
  '✅ Profiles: ' || COUNT(*) AS profiles,
  '✅ Servers: ' || (SELECT COUNT(*) FROM servers) AS servers,
  '✅ Members: ' || (SELECT COUNT(*) FROM members) AS members,
  '✅ Channels: ' || (SELECT COUNT(*) FROM channels) AS channels,
  '✅ Messages: ' || (SELECT COUNT(*) FROM messages) AS messages,
  '✅ Conversations: ' || (SELECT COUNT(*) FROM conversations) AS conversations,
  '✅ Direct Messages: ' || (SELECT COUNT(*) FROM direct_messages) AS direct_messages;
