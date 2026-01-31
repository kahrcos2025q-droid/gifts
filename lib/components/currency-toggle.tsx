"use client"

import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Coins, Crown, ArrowLeftRight, Lock } from "lucide-react"
import { toast } from "sonner"

export function CurrencyToggle() {
  const { currency, setCurrency, clearCart, isKeyValid, keyCurrency } = useAppStore()
  
  const handleSwap = () => {
    // Bloqueia se tiver chave válida
    if (isKeyValid) {
      toast.error("Nao e possivel trocar de moeda", {
        description: `Sua chave e de ${keyCurrency}. Remova a chave para trocar de moeda.`,
      })
      return
    }
    
    // Limpa o carrinho ao trocar de moeda
    clearCart()
    const newCurrency = currency === 'avacoins' ? 'crowns' : 'avacoins'
    setCurrency(newCurrency)
  }
  
  const CurrencyIcon = currency === 'avacoins' ? Coins : Crown
  const currencyLabel = currency === 'avacoins' ? 'Avacoins' : 'Crowns'
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwap}
      disabled={isKeyValid}
      className="gap-2 bg-transparent border-border/50 hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <CurrencyIcon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{currencyLabel}</span>
      {isKeyValid ? (
        <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
      ) : (
        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
      )}
    </Button>
  )
}
