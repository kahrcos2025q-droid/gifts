import { NextResponse } from 'next/server'

const API_BASE = process.env.EXTERNAL_API_URL || 'https://interfaces-she-analysis-obligation.trycloudflare.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(`${API_BASE}/api/gift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Gift API error:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar presentes' },
      { status: 500 }
    )
  }
}
