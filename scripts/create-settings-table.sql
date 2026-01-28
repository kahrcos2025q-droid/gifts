-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT settings_key_check CHECK (key IN ('max_item_price', 'max_cart_items'))
);

-- Insert default values
INSERT INTO settings (key, value, description)
VALUES 
  ('max_item_price', '30000', 'Preço máximo permitido por item'),
  ('max_cart_items', '20', 'Quantidade máxima de itens no carrinho')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read settings (but not modify)
CREATE POLICY "Allow public read on settings" ON settings
  FOR SELECT USING (true);
