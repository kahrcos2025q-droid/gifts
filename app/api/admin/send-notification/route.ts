import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import webpush from "web-push"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// VAPID keys - you should generate your own and store in env vars
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UUxI4O8-FbRouAf7-fGP7nKrR2xLhFA5Q2O6-7jH3WA"

webpush.setVapidDetails(
  "mailto:admin@avakingifts.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export async function POST(request: Request) {
  try {
    const { adminKey, title, body } = await request.json()

    if (adminKey !== "i20v20a20d20@2026avkn") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const payload = JSON.stringify({ title, body })
    let successCount = 0
    let failedEndpoints: string[] = []

    // Send to all subscriptions
    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        )
        successCount++
      } catch (err: any) {
        console.error("Push error:", err)
        // If subscription is invalid, mark for deletion
        if (err.statusCode === 410 || err.statusCode === 404) {
          failedEndpoints.push(sub.endpoint)
        }
      }
    }

    // Remove invalid subscriptions
    if (failedEndpoints.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints)
    }

    // Log notification in history
    await supabaseAdmin
      .from("notification_history")
      .insert({
        title,
        body,
        sent_to_count: successCount,
        sent_by: "admin"
      })

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failedEndpoints.length,
      total: subscriptions?.length || 0
    })
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
