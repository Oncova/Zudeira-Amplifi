CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  website TEXT,
  ig TEXT,
  fb TEXT,
  tt TEXT,
  brand_identity TEXT
);
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  url TEXT,
  tags TEXT,
  type TEXT,
  ranking INTEGER
);
CREATE TABLE IF NOT EXISTS creatives (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  platform TEXT,
  media_url TEXT,
  headline TEXT,
  body TEXT,
  cta TEXT,
  aspect_ratio TEXT,
  hashtags TEXT,
  version INTEGER,
  hook TEXT,
  core_message TEXT,
  visual_direction TEXT,
  emotional_trigger TEXT,
  conversion_mechanism TEXT
);
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  creative_id TEXT,
  scheduled_at TEXT,
  platform TEXT
);
