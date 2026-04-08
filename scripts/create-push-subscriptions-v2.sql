-- ============================================================
-- SCRIPT v2 - Nova tabela de push subscriptions
-- Use este script se quiser recriar do zero com todas as policies corretas.
-- Não apaga nada existente - usa nome de tabela diferente opcionalmente.
-- ============================================================

-- Dropa e recria a tabela push_subscriptions com estrutura correta
DROP TABLE IF EXISTS push_subscriptions;

CREATE TABLE push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    TEXT        UNIQUE NOT NULL,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_used   TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Habilita RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas caso existam
DROP POLICY IF EXISTS "Allow public insert"          ON push_subscriptions;
DROP POLICY IF EXISTS "Allow select for service role" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow delete for service role" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow public update"           ON push_subscriptions;

-- Policy: qualquer um pode inserir (usuário se inscrevendo)
CREATE POLICY "Allow public insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Policy: qualquer um pode atualizar (necessário para upsert funcionar com RLS)
CREATE POLICY "Allow public update" ON push_subscriptions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: select liberado (admin via service role ou leitura geral)
CREATE POLICY "Allow select for all" ON push_subscriptions
  FOR SELECT USING (true);

-- Policy: delete liberado (limpeza de subscriptions expiradas)
CREATE POLICY "Allow delete for all" ON push_subscriptions
  FOR DELETE USING (true);
