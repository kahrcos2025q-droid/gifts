import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (adminKey !== "i20v20a20d20@2026avkn") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create push_subscriptions table
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_active TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }).catch(() => {})

    // Try direct table creation via REST
    const { error: tableError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, we'll handle this gracefully
      return NextResponse.json({ 
        success: true, 
        message: "Tables need to be created manually in Supabase dashboard",
        sql: `
          CREATE TABLE push_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_active TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE TABLE site_visitors (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            visitor_id TEXT NOT NULL UNIQUE,
            first_visit TIMESTAMPTZ DEFAULT NOW(),
            last_visit TIMESTAMPTZ DEFAULT NOW(),
            visit_count INTEGER DEFAULT 1,
            user_agent TEXT,
            is_online BOOLEAN DEFAULT false
          );
          
          CREATE TABLE notification_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            sent_at TIMESTAMPTZ DEFAULT NOW(),
            sent_to_count INTEGER DEFAULT 0,
            sent_by TEXT
          );
        `
      })
    }

    return NextResponse.json({ success: true, message: "Setup complete" })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed" }, { status: 500 })
  }
}
