import { NextResponse } from 'next/server'

const API_BASE = 'https://interfaces-she-analysis-obligation.trycloudflare.com'

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Balance API error:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar saldo' },
      { status: 500 }
    )
  }
}
