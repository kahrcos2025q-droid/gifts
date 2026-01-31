"use client"

import Image from "next/image"
import { Plus, Check, ShoppingCart, Ban, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Item } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const MAX_ITEM_PRICE = 30000

interface ItemCardProps {
  item: Item
  onOpenFriendCodeModal?: () => void
}

export function ItemCard({ item, onOpenFriendCodeModal }: ItemCardProps) {
  const { cart, addToCart, removeFromCart, canAddToCart, isItemBlocked, friendCode, getRemainingCartValue, currency, keyCurrency, isKeyValid } = useAppStore()
  const isInCart = cart.some((i) => i.id === item.id)
  const cartFull = cart.length >= 20
  const exceedsMaxPrice = item.preco > MAX_ITEM_PRICE
  const exceedsRemainingValue = cart.reduce((total, i) => total + i.preco, 0) + item.preco > MAX_ITEM_PRICE
  const canAdd = canAddToCart(item)
  
  // VALIDAÇÃO DEFINITIVA: A moeda do item SEMPRE é a moeda do toggle atual (currency)
  // Se o usuário está vendo itens de crowns, o item é de crowns
  // Se o usuário está vendo itens de avacoins, o item é de avacoins
  const itemCurrency = item.moeda || currency
  
  // BLOQUEIA se tem chave válida E a moeda da chave é diferente da moeda do item
  const isCurrencyMismatch = isKeyValid && keyCurrency && itemCurrency !== keyCurrency
  
  const blockedItem = isItemBlocked(item.id)
  const isOwned = blockedItem?.status === 'owned'
  const isPurchaseNotAllowed = blockedItem?.status === 'purchase_not_allowed'
  const isBlocked = isOwned || isPurchaseNotAllowed || isCurrencyMismatch

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  const handleToggleCart = () => {
    // PRIMEIRA VALIDAÇÃO: Verifica se tem chave válida
    if (!isKeyValid) {
      toast.error("Chave necessaria", {
        description: "Por favor, adicione uma chave valida antes de adicionar itens ao carrinho.",
      })
      return
    }

    // SEGUNDA VALIDAÇÃO: Verifica moeda ANTES de tudo
    if (isCurrencyMismatch) {
      toast.error("Moeda incompativel", {
        description: `Sua chave e de ${keyCurrency}. Este item e de ${itemCurrency}.`,
      })
      return
    }

    // TERCEIRA VALIDAÇÃO: Código de amigo
    if (!friendCode) {
      if (onOpenFriendCodeModal) {
        onOpenFriendCodeModal()
      } else {
        toast.error("Codigo de amigo necessario", {
          description: "Por favor, defina o codigo de amigo antes de adicionar itens ao carrinho.",
        })
      }
      return
    }
    
    // QUARTA VALIDAÇÃO: Bloqueios
    if (isOwned) {
      toast.error("Item ja possuido", {
        description: "Esta conta ja possui este item.",
      })
      return
    }
    
    if (isPurchaseNotAllowed) {
      toast.error("Compra nao permitida", {
        description: "Este item nao pode ser enviado para esta conta.",
      })
      return
    }
    
    if (isInCart) {
      removeFromCart(item.id)
    } else if (exceedsMaxPrice) {
      toast.error("Item acima do limite", {
        description: `Este item custa mais de 25.000 ${currency} e nao pode ser adicionado ao carrinho.`,
      })
    } else if (cartFull) {
      toast.error("Carrinho cheio", {
        description: "O carrinho so permite ate 20 itens.",
      })
    } else {
      addToCart(item)
    }
  }

  return (
    <div className={cn(
      "group relative rounded-3xl overflow-hidden glass border-2 border-border/20 card-hover",
      isInCart && "border-primary/70 ring-2 ring-primary/40 glow-primary",
      isBlocked && "opacity-60"
    )}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <Image
          src={item.imagem || "/placeholder.svg"}
          alt={item.nome}
          fill
          className={cn(
            "object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2",
            isBlocked && "grayscale"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/20 to-transparent opacity-80" />
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
        
        {/* Blocked Overlay */}
        {isBlocked && (
          <div className="absolute inset-0 glass flex items-center justify-center backdrop-blur-sm">
            <div className="glass rounded-full p-4 border-2 border-destructive/50">
              {isOwned ? (
                <Package className="h-8 w-8 text-amber-500" />
              ) : (
                <Ban className="h-8 w-8 text-destructive" />
              )}
            </div>
          </div>
        )}
        
        {/* Premium Category Tags */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-10">
          <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-primary/30 text-primary backdrop-blur-md">
            {formatCategory(item.categoria)}
          </span>
          {exceedsMaxPrice && (
            <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-destructive/30 text-destructive backdrop-blur-md">
              Acima do limite
            </span>
          )}
          {isOwned && (
            <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-amber-500/30 text-amber-500 backdrop-blur-md">
              Ja possui
            </span>
          )}
          {isPurchaseNotAllowed && (
            <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-destructive/30 text-destructive backdrop-blur-md">
              Nao permitido
            </span>
          )}
          {isCurrencyMismatch && (
            <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-destructive/30 text-destructive backdrop-blur-md">
              Moeda diferente
            </span>
          )}
        </div>
        
        {/* Premium Add Button */}
        {!isBlocked && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10">
            <div className="relative group/btn">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-md transition-opacity duration-300",
                isInCart ? "opacity-100" : "opacity-0 group-hover/btn:opacity-100"
              )} />
              <Button
                size="icon"
                className={cn(
                  "relative h-10 w-10 sm:h-12 sm:w-12 rounded-2xl shadow-2xl transition-all duration-500 border-2",
                  isInCart 
                    ? "bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground border-primary/50 scale-110" 
                    : "glass border-border/30 text-foreground hover:border-primary/50",
                  !isInCart && "md:opacity-0 md:group-hover:opacity-100 md:scale-75 md:group-hover:scale-100"
                )}
                onClick={handleToggleCart}
                disabled={!isInCart && !canAdd}
              >
                {isInCart ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : cartFull ? (
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Floating In Cart Indicator */}
        {isInCart && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg animate-pulse-glow" />
              <span className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-black border-2 border-primary-foreground/20">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Content Section */}
      <div className="relative p-3 sm:p-4 space-y-2 sm:space-y-3">
        <p className="text-[9px] sm:text-[11px] text-muted-foreground uppercase tracking-[0.2em] font-bold truncate">
          {formatCategory(item.subcategoria)}
        </p>
        <h3 className={cn(
          "font-bold text-xs sm:text-base leading-tight line-clamp-2 transition-all duration-300",
          isBlocked ? "text-muted-foreground" : "text-foreground group-hover:gradient-text"
        )}>
          {item.nome}
        </h3>
        <div className="flex items-baseline gap-1 sm:gap-2 min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap min-w-0">
            <span className={cn(
              "text-lg sm:text-2xl font-black transition-all duration-300 truncate",
              isBlocked ? "text-muted-foreground" : "gradient-text group-hover:scale-110"
            )}>
              {formatPrice(item.preco)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider shrink-0">{currency}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
