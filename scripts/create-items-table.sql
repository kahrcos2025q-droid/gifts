-- Create table to store items that users already own or cannot purchase
CREATE TABLE IF NOT EXISTS user_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  friend_code TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('owned', 'purchase_not_allowed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(friend_code, item_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_items_friend_code ON user_items(friend_code);
CREATE INDEX IF NOT EXISTS idx_user_items_status ON user_items(status);

-- Enable Row Level Security
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a gift system)
CREATE POLICY "Allow all operations" ON user_items FOR ALL USING (true);
