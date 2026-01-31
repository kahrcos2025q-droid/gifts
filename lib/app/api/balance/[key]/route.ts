import { NextResponse } from 'next/server'

const API_BASE = process.env.EXTERNAL_API_URL || 'https://interfaces-she-analysis-obligation.trycloudflare.com'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params

  try {
    const response = await fetch(`${API_BASE}/api/balance/${key}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Detect currency type based on response (the external API should return this)
    // Or detect from key prefix if the API doesn't provide it
    const currency = data.tipo || (key.startsWith('CROWN') ? 'crowns' : 'avacoins')

    return NextResponse.json({
      ...data,
      currency,
    })
  } catch (error) {
    console.error('Balance API error:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar saldo' },
      { status: 500 }
    )
  }
}
