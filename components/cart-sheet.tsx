"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Send, Loader2, AlertCircle, CheckCircle2, ShoppingCart, Gift, Sparkles, Clock, Package, Info, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useAppStore } from "@/lib/store"
import { sendGifts } from "@/lib/api"
import type { GiftResponse } from "@/lib/types"
import { markItemStatus } from "@/lib/supabase"

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { cart, removeFromCart, clearCart, userKey, isKeyValid, setBalance, friendCode, addBlockedItem } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GiftResponse | null>(null)
  const [error, setError] = useState("")

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const cartTotal = cart.reduce((total, item) => total + item.preco, 0)

  const handleSendGifts = async () => {
    if (!isKeyValid || !userKey) {
      setError("Insira uma chave valida primeiro")
      return
    }

    if (!friendCode) {
      setError("Defina o codigo de amigo na pagina principal")
      return
    }

    if (cart.length === 0) {
      setError("Adicione itens ao carrinho")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await sendGifts(
        friendCode,
        cart.map((item) => item.id),
        userKey,
      )

      setResult(response)

      if (response.detalhes?.saldo_chave_restante !== undefined) {
        setBalance(response.detalhes.saldo_chave_restante)
      }

      // Save items to Supabase and local store based on result
      if (response.detalhes?.resultados) {
        for (const resultado of response.detalhes.resultados) {
          // Skip rate limit errors - they are temporary (24h)
          const isRateLimit = resultado.erro?.includes('RateLimit') || resultado.mensagem?.includes('RateLimit')
          
          if (isRateLimit) {
            // Don't mark anything for rate limit errors
            continue
          }
          
          // Mark successful items as owned
          if (resultado.sucesso) {
            await markItemStatus(friendCode, resultado.item_id, resultado.item_nome, 'owned')
            addBlockedItem(resultado.item_id, 'owned')
          }
          // Mark items already owned
          else if (resultado.erro === "item is owned") {
            await markItemStatus(friendCode, resultado.item_id, resultado.item_nome, 'owned')
            addBlockedItem(resultado.item_id, 'owned')
          }
          // Mark items with purchase not allowed
          else if (resultado.status_code === 403 || resultado.mensagem?.toLowerCase().includes('not allowed')) {
            await markItemStatus(friendCode, resultado.item_id, resultado.item_nome, 'purchase_not_allowed')
            addBlockedItem(resultado.item_id, 'purchase_not_allowed')
          }
        }
      }

      if (response.sucesso) {
        clearCart()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar presentes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border/50 flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              Carrinho
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                {cart.length}/20 - {formatPrice(cartTotal)}
              </span>
            </SheetTitle>
            <SheetDescription>
              Adicione ate 20 itens e envie como presente
            </SheetDescription>
          </SheetHeader>

          {/* Friend Code Display */}
          {friendCode && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">Enviando para:</span>
              <span className="font-mono font-bold text-foreground">{friendCode}</span>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result && cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
                <Gift className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-foreground">Carrinho vazio</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Clique no + nos itens para adicionar ao carrinho
              </p>
            </div>
          ) : !result && cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-secondary/20 border border-border/30 group hover:border-primary/20 transition-all"
                >
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary/50">
                    <Image
                      src={item.imagem || "/placeholder.svg"}
                      alt={item.nome}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1 left-1 h-5 w-5 rounded-md bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">{item.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.categoria}</p>
                    <p className="text-primary font-bold mt-1">
                      {formatPrice(item.preco)} <span className="text-xs font-normal text-muted-foreground">coins</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Results */}
          {result && (
            <>
              {/* Rate Limit Sender Error */}
              {result.error === "GiftResponseError_RateLimitSender" ? (
                <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="font-semibold text-amber-500">Limite diario atingido (Remetente)</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>A conta remetente atingiu o limite diario de envio de presentes.</p>
                    <p className="text-muted-foreground">Voce pode enviar novamente apos <strong className="text-foreground">24 horas</strong>.</p>
                    <p className="text-sm text-muted-foreground mt-3 p-2 rounded-lg bg-background/50 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Enquanto isso, voce pode enviar presentes para outra conta.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : result.error === "GiftResponseError_RateLimitRecipient" || 
                   result.detalhes?.resultados?.some(r => r.erro?.includes("RateLimitRecipient")) ? (
                <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="font-semibold text-amber-500">Limite diario atingido (Destinatario)</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>A conta de destino ja recebeu o maximo de presentes permitidos hoje.</p>
                    <p className="text-muted-foreground">Aguarde <strong className="text-foreground">24 horas</strong> para que ela possa receber mais presentes.</p>
                    <p className="text-sm text-muted-foreground mt-3 p-2 rounded-lg bg-background/50 flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Voce pode enviar presentes para outras contas enquanto isso.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert
                  variant={result.sucesso ? "default" : "destructive"}
                  className={result.sucesso ? "border-primary/50 bg-primary/10" : ""}
                >
                  {result.sucesso ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle className="font-semibold">{result.sucesso ? "Presentes enviados!" : "Erro no envio"}</AlertTitle>
                  <AlertDescription className="mt-2">
                    {result.mensagem}
                    {result.detalhes?.resultados && (
                      <div className="mt-3 space-y-1.5">
                        {result.detalhes.resultados.map((r, i) => (
                          <div key={i} className="text-xs flex items-center gap-2 p-2 rounded-lg bg-background/50">
                            {r.sucesso ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            ) : r.erro === "item is owned" ? (
                              <Package className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            )}
                            <span className="font-medium">{r.item_nome}</span>
                            {r.erro === "item is owned" ? (
                              <span className="text-amber-500">- O usuario ja possui este item</span>
                            ) : r.mensagem ? (
                              <span className="text-muted-foreground">- {r.mensagem}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-border/50 p-6 space-y-4 bg-background/50">
            {/* Info about limit */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                O carrinho permite ate <strong className="text-foreground">20 itens</strong>. Cada item pode custar no maximo <strong className="text-foreground">25.000 coins</strong>.
              </p>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <span className="text-muted-foreground font-medium">Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{formatPrice(cartTotal)}</span>
                <span className="text-sm text-muted-foreground">coins</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearCart}
                disabled={isLoading}
                className="flex-1 h-12 bg-transparent border-border/50 hover:border-destructive/50 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button
                onClick={handleSendGifts}
                disabled={isLoading || !isKeyValid || cart.length === 0 || !friendCode}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Presentes
              </Button>
            </div>

            {!isKeyValid && (
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" />
                Insira uma chave valida para enviar presentes
              </p>
            )}

            {!friendCode && isKeyValid && (
              <p className="text-xs text-center text-amber-500 flex items-center justify-center gap-1">
                <User className="h-3 w-3" />
                Defina o codigo de amigo na pagina principal
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
