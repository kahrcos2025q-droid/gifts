import type { BalanceResponse, GiftResponse } from "./types"

export async function getBalance(key: string): Promise<BalanceResponse> {
  const response = await fetch(`/api/balance/${key}`)
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    if (response.status === 401) {
      throw new Error('Chave invalida ou inativa')
    }
    throw new Error(data.error || 'Erro ao consultar saldo')
  }
  
  return response.json()
}

export async function sendGifts(
  friendCode: string,
  items: string[],
  key: string
): Promise<GiftResponse> {
  const response = await fetch("/api/gift", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      friend_code: friendCode,
      items,
      key,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    if (response.status === 401) {
      throw new Error("Chave invalida ou inativa")
    }
    if (response.status === 402) {
      throw new Error("Saldo insuficiente")
    }
    throw new Error(data.error || "Erro ao enviar presente")
  }

  return response.json()
}
