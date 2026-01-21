import type { BalanceResponse, GiftRequest, GiftResponse } from './types'

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

export async function sendGifts(request: GiftRequest): Promise<GiftResponse> {
  const response = await fetch('/api/gift', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    
    if (response.status === 401) {
      throw new Error('Chave invalida ou inativa')
    }
    if (response.status === 402) {
      throw new Error(data.detail || 'Saldo insuficiente na chave')
    }
    if (response.status === 400) {
      throw new Error(data.detail || 'Erro na requisicao')
    }
    if (response.status === 404) {
      throw new Error(data.detail || 'Item nao encontrado')
    }
    throw new Error(data.error || 'Erro ao enviar presentes')
  }
  
  return response.json()
}
