"use client"

import Image from "next/image"
import { Plus, Check, ShoppingCart, Ban, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Item } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ItemCardProps {
  item: Item
  onOpenFriendCodeModal?: () => void
}

// Helper function to check if item was released less than 7 days ago
const isItemNew = (dateString: string): boolean => {
  const [datePart] = dateString.split(" ")
  const [day, month, year] = datePart.split("/")
  const itemDate = new Date(`${year}-${month}-${day}`)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - itemDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

export function ItemCard({ item, onOpenFriendCodeModal }: ItemCardProps) {
  const { cart, addToCart, removeFromCart, canAddToCart, isItemBlocked, friendCode, getRemainingCartValue, currency, keyCurrency, isKeyValid, maxItemPrice } = useAppStore()
  const isInCart = cart.some((i) => i.id === item.id)
  const cartFull = cart.length >= 30
  const exceedsMaxPrice = item.preco > maxItemPrice
  const exceedsRemainingValue = cart.reduce((total, i) => total + i.preco, 0) + item.preco > maxItemPrice
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
  const isNew = isItemNew(item.data_lancamento)

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
        description: `Este item custa mais de ${maxItemPrice.toLocaleString("pt-BR")} ${currency} e nao pode ser adicionado ao carrinho.`,
      })
    } else if (cartFull) {
      toast.error("Carrinho cheio", {
        description: "O carrinho so permite ate 30 itens.",
      })
    } else {
      addToCart(item)
    }
  }

  return (
    <div className={cn(
      "group relative rounded-2xl sm:rounded-3xl overflow-hidden glass border border-border/20 md:border-border/30 card-hover transition-all duration-200",
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
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isBlocked && "grayscale"
          )}
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
        />
        
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/10 to-transparent opacity-80" />
        
        {/* Blocked Overlay */}
        {isBlocked && (
          <div className="absolute inset-0 glass flex items-center justify-center">
            <div className="glass rounded-full p-2 sm:p-3 border-2 border-destructive/50">
              {isOwned ? (
                <Package className="h-5 w-5 sm:h-7 sm:w-7 text-amber-500" />
              ) : (
                <Ban className="h-5 w-5 sm:h-7 sm:w-7 text-destructive" />
              )}
            </div>
          </div>
        )}
        
        {/* Premium Category Tags */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 z-10">
          {isNew && !isBlocked && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-black rounded-lg bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground border border-primary/50 shadow-sm animate-pulse">
              NOVO
            </span>
          )}
          <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-lg glass border border-primary/30 text-primary truncate max-w-[80px] sm:max-w-none">
            {formatCategory(item.categoria)}
          </span>
          {exceedsMaxPrice && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-lg glass border border-destructive/30 text-destructive truncate">
              +Limite
            </span>
          )}
          {isOwned && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-lg glass border border-amber-500/30 text-amber-500 truncate">
              Possui
            </span>
          )}
          {isPurchaseNotAllowed && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-lg glass border border-destructive/30 text-destructive truncate">
              Bloqueado
            </span>
          )}
          {isCurrencyMismatch && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold rounded-lg glass border border-destructive/30 text-destructive truncate">
              Outra Moeda
            </span>
          )}
        </div>
        
        {/* Premium Add Button */}
        {!isBlocked && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
            <Button
              size="icon"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 rounded-xl transition-all duration-200 border cursor-pointer",
                isInCart 
                  ? "bg-muted text-foreground border-border" 
                  : "glass border-border/40 text-foreground hover:border-primary/50 hover:bg-primary hover:text-primary-foreground",
                !isInCart && "md:opacity-0 md:group-hover:opacity-100"
              )}
              onClick={handleToggleCart}
              disabled={!isInCart && !canAdd}
              title={isInCart ? "Remover do carrinho" : "Adicionar ao carrinho"}
            >
              {isInCart ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : cartFull ? (
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Premium Content Section */}
      <div className="relative p-2 sm:p-2.5 lg:p-3 space-y-1 sm:space-y-1.5">
        <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-bold truncate">
          {formatCategory(item.subcategoria)}
        </p>
        <h3 className={cn(
          "font-bold text-[11px] sm:text-xs leading-tight line-clamp-1 group-hover:line-clamp-2 transition-all",
          isBlocked ? "text-muted-foreground" : "text-foreground"
        )} title={item.nome}>
          {item.nome}
        </h3>
        <div className="flex items-baseline gap-1 min-w-0 pt-0.5">
          <span className={cn(
            "text-xs sm:text-sm font-black truncate",
            isBlocked ? "text-muted-foreground" : "gradient-text"
          )}>
            {formatPrice(item.preco)}
          </span>
          <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-bold tracking-wider shrink-0">
            {currency}
          </span>
        </div>
      </div>
    </div>
  )
}
