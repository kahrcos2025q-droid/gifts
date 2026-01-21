export interface Item {
  id: string
  nome: string
  categoria: string
  subcategoria: string
  marca: string
  preco: number
  data_lancamento: string
  nao_lancado: boolean
  imagem: string
}

export interface BalanceResponse {
  key: string
  saldo: number
  ativa: boolean
}

export interface GiftRequest {
  friend_code: string
  items: string[]
  key: string
}

export interface GiftResultItem {
  item_id: string
  item_nome: string
  preco: number
  status_code: number
  erro?: string
  sucesso: boolean
  mensagem?: string
  ignorado?: boolean
  conta_bloqueada?: boolean
  novo_saldo?: number
}

export interface GiftResponse {
  sucesso: boolean
  mensagem: string
  error?: string
  detalhes?: {
    email_conta?: string
    saldo_inicial?: number
    saldo_final?: number
    preco_total: number
    sucessos?: number
    total_itens?: number
    resultados?: GiftResultItem[]
    saldo_chave_restante?: number
    itens_solicitados?: number
  }
}

export interface CartItem extends Item {
  quantity: number
}
