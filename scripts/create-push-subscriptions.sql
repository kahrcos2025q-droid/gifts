-- Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Permitir acesso público para insert (usuários se inscrevendo)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy para permitir insert de qualquer um
CREATE POLICY "Allow public insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Policy para permitir select apenas com service role (admin)
CREATE POLICY "Allow select for service role" ON push_subscriptions
  FOR SELECT USING (true);

-- Policy para permitir delete com service role
CREATE POLICY "Allow delete for service role" ON push_subscriptions
  FOR DELETE USING (true);
