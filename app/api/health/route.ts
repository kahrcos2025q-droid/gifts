import { NextResponse } from 'next/server'

const API_BASE = process.env.EXTERNAL_API_URL || 'https://interfaces-she-analysis-obligation.trycloudflare.com'

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

    const response = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (response.ok && data.status === 'ok') {
      return NextResponse.json({ status: 'online' }, { status: 200 })
    }

    return NextResponse.json({ status: 'offline' }, { status: 503 })
  } catch (error) {
    console.error('[v0] API health check failed:', error)
    return NextResponse.json({ status: 'offline' }, { status: 503 })
  }
}
