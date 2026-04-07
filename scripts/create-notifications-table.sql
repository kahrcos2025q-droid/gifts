-- Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rastrear visitantes online
CREATE TABLE IF NOT EXISTS site_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipients_count INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON site_visitors(last_seen);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON push_subscriptions(created_at);
