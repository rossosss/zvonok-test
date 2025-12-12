-- ========================================
-- ZVONOK DATABASE MIGRATION (COMPLETE)
-- ========================================

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Servers  
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  invite_code TEXT UNIQUE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_servers_profile_id ON servers(profile_id);

-- 3. Members (с ENUM)
CREATE TYPE member_role AS ENUM ('ADMIN', 'MODERATOR', 'GUEST');

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role member_role DEFAULT 'GUEST',
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_members_profile_id ON members(profile_id);
CREATE INDEX idx_members_server_id ON members(server_id);

-- 4. Channels (с ENUM)
CREATE TYPE channel_type AS ENUM ('TEXT', 'AUDIO', 'VIDEO');

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type channel_type DEFAULT 'TEXT',
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_channels_profile_id ON channels(profile_id);
CREATE INDEX idx_channels_server_id ON channels(server_id);

-- Проверка ✅
SELECT 'Zvonok DB created successfully!' AS status;
