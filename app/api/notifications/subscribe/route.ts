import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const subscription = await request.json()
    const userAgent = request.headers.get("user-agent") || "unknown"

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })

    if (error) {
      console.error("Subscription error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json()

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
