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

    // Get online visitors
    const { count: onlineCount } = await supabaseAdmin
      .from("site_visitors")
      .select("*", { count: "exact", head: true })
      .eq("is_online", true)

    // Get total visitors
    const { count: totalVisitors } = await supabaseAdmin
      .from("site_visitors")
      .select("*", { count: "exact", head: true })

    // Get today's visitors
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayVisitors } = await supabaseAdmin
      .from("site_visitors")
      .select("*", { count: "exact", head: true })
      .gte("last_visit", today.toISOString())

    // Get push subscribers count
    const { count: subscribersCount } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })

    // Get all subscribers
    const { data: subscribers } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_agent, created_at, last_active")
      .order("created_at", { ascending: false })

    // Get notification history
    const { data: notificationHistory } = await supabaseAdmin
      .from("notification_history")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(20)

    // Get recent visitors
    const { data: recentVisitors } = await supabaseAdmin
      .from("site_visitors")
      .select("*")
      .order("last_visit", { ascending: false })
      .limit(50)

    return NextResponse.json({
      metrics: {
        online: onlineCount || 0,
        totalVisitors: totalVisitors || 0,
        todayVisitors: todayVisitors || 0,
        subscribers: subscribersCount || 0
      },
      subscribers: subscribers || [],
      notificationHistory: notificationHistory || [],
      recentVisitors: recentVisitors || []
    })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json({ 
      metrics: { online: 0, totalVisitors: 0, todayVisitors: 0, subscribers: 0 },
      subscribers: [],
      notificationHistory: [],
      recentVisitors: []
    })
  }
}
