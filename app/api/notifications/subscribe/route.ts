import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usa service role key para bypassar RLS completamente
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      `Supabase not configured. URL: ${url ? 'OK' : 'MISSING'}, SERVICE_ROLE_KEY: ${key ? 'OK' : 'MISSING'}`
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || 'unknown'
    const now = new Date().toISOString()

    // Tenta inserir primeiro
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        endpoint:   subscription.endpoint,
        p256dh:     subscription.keys.p256dh,
        auth:       subscription.keys.auth,
        user_agent: userAgent,
        last_used:  now,
        created_at: now,
      })

    if (insertError) {
      // Se já existe (unique violation code 23505), faz update
      if (insertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('push_subscriptions')
          .update({
            p256dh:     subscription.keys.p256dh,
            auth:       subscription.keys.auth,
            user_agent: userAgent,
            last_used:  now,
          })
          .eq('endpoint', subscription.endpoint)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to update subscription', detail: updateError.message },
            { status: 500 }
          )
        }
      } else {
        console.error('Error inserting subscription:', insertError)
        return NextResponse.json(
          { error: 'Failed to save subscription', detail: insertError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Subscribe route error:', err)
    return NextResponse.json(
      { error: 'Internal error', detail: err?.message || 'unknown' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Error deleting subscription:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Unsubscribe error:', err)
    return NextResponse.json(
      { error: 'Internal error', detail: err?.message || 'unknown' },
      { status: 500 }
    )
  }
}
