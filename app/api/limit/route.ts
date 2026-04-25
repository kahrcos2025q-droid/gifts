export async function GET() {
  try {
    const res = await fetch('https://xgifts.avakinworld.com.br/limit', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch limit' }, { status: 500 })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error fetching limit:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
