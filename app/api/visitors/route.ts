import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { visitorId, action } = await request.json()
    const userAgent = request.headers.get("user-agent") || "unknown"

    if (action === "enter") {
      // Check if visitor exists
      const { data: existing } = await supabaseAdmin
        .from("site_visitors")
        .select("id, visit_count")
        .eq("visitor_id", visitorId)
        .single()

      if (existing) {
        // Update existing visitor
        await supabaseAdmin
          .from("site_visitors")
          .update({
            last_visit: new Date().toISOString(),
            visit_count: existing.visit_count + 1,
            is_online: true,
            user_agent: userAgent
          })
          .eq("visitor_id", visitorId)
      } else {
        // Create new visitor
        await supabaseAdmin
          .from("site_visitors")
          .insert({
            visitor_id: visitorId,
            user_agent: userAgent,
            is_online: true
          })
      }
    } else if (action === "leave") {
      await supabaseAdmin
        .from("site_visitors")
        .update({ is_online: false })
        .eq("visitor_id", visitorId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Visitor tracking error:", error)
    return NextResponse.json({ error: "Failed to track visitor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get online count
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

    return NextResponse.json({
      online: onlineCount || 0,
      total: totalVisitors || 0,
      today: todayVisitors || 0
    })
  } catch (error) {
    console.error("Get visitors error:", error)
    return NextResponse.json({ online: 0, total: 0, today: 0 })
  }
}
