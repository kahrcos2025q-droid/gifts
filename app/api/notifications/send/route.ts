import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_KEY = 'i20v20a20d20@avkngifts'

// Configure web-push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@avkngifts.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminKey, title, message, url } = body

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    // Get all subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' })
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/'
    })

    let sent = 0
    let failed = 0
    const failedEndpoints: string[] = []

    // Send to all subscribers
    const sendPromises = subscriptions.map(async (sub) => {
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
        sent++
      } catch (err: any) {
        failed++
        // If subscription expired or invalid, mark for deletion
        if (err.statusCode === 404 || err.statusCode === 410) {
          failedEndpoints.push(sub.endpoint)
        }
        console.error('Push failed for endpoint:', sub.endpoint, err.message)
      }
    })

    await Promise.all(sendPromises)

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints)
    }

    return NextResponse.json({ 
      sent, 
      failed, 
      total: subscriptions.length,
      cleaned: failedEndpoints.length 
    })
  } catch (err) {
    console.error('Send notification error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Get subscriber count
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.nextUrl.searchParams.get('key')

    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting subscriptions:', error)
      return NextResponse.json({ error: 'Failed to count' }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (err) {
    console.error('Count error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
