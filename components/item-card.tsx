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
      "group relative rounded-3xl lg:rounded-2xl overflow-hidden glass border-2 border-border/20 lg:border-border/30 card-hover transition-all duration-200",
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
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 15vw"
        />
        
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/20 to-transparent opacity-80" />
        
        {/* Blocked Overlay */}
        {isBlocked && (
          <div className="absolute inset-0 glass flex items-center justify-center">
            <div className="glass rounded-full p-4 lg:p-2 border-2 border-destructive/50">
              {isOwned ? (
                <Package className="h-8 w-8 lg:h-5 lg:w-5 text-amber-500" />
              ) : (
                <Ban className="h-8 w-8 lg:h-5 lg:w-5 text-destructive" />
              )}
            </div>
          </div>
        )}
        
        {/* Premium Category Tags */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-1.5 lg:left-1.5 flex flex-col gap-1.5 lg:gap-1 z-10">
          {isNew && !isBlocked && (
            <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-black rounded-xl lg:rounded-lg bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground border border-primary/50 shadow-lg animate-pulse">
              NOVO
            </span>
          )}
          <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-bold rounded-xl lg:rounded-lg glass border border-primary/30 text-primary truncate max-w-[90px] sm:max-w-none">
            {formatCategory(item.categoria)}
          </span>
          {exceedsMaxPrice && (
            <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-bold rounded-xl lg:rounded-lg glass border border-destructive/30 text-destructive truncate">
              Acima do limite
            </span>
          )}
          {isOwned && (
            <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-bold rounded-xl lg:rounded-lg glass border border-amber-500/30 text-amber-500 truncate">
              Ja possui
            </span>
          )}
          {isPurchaseNotAllowed && (
            <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-bold rounded-xl lg:rounded-lg glass border border-destructive/30 text-destructive truncate">
              Nao permitido
            </span>
          )}
          {isCurrencyMismatch && (
            <span className="px-2.5 py-1 lg:px-1.5 lg:py-0.5 text-[9px] sm:text-[11px] lg:text-[8px] font-bold rounded-xl lg:rounded-lg glass border border-destructive/30 text-destructive truncate">
              Moeda diferente
            </span>
          )}
        </div>
        
        {/* Premium Add Button */}
        {!isBlocked && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 lg:bottom-1.5 lg:right-1.5 z-10">
            <Button
              size="icon"
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 lg:h-7 lg:w-7 rounded-2xl lg:rounded-xl transition-all duration-200 border-2 lg:border cursor-pointer",
                isInCart 
                  ? "bg-muted text-foreground border-border" 
                  : "glass border-border/30 text-foreground hover:border-primary/50 lg:hover:bg-primary lg:hover:text-primary-foreground",
                !isInCart && "lg:opacity-0 lg:group-hover:opacity-100"
              )}
              onClick={handleToggleCart}
              disabled={!isInCart && !canAdd}
              title={isInCart ? "Remover do carrinho" : "Adicionar ao carrinho"}
            >
              {isInCart ? (
                <Check className="h-5 w-5 sm:h-6 sm:w-6 lg:h-3.5 lg:w-3.5" />
              ) : cartFull ? (
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-3.5 lg:w-3.5" />
              ) : (
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-3.5 lg:w-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Premium Content Section */}
      <div className="relative p-3 sm:p-4 lg:p-2.5 space-y-2 sm:space-y-3 lg:space-y-1">
        <p className="text-[9px] sm:text-[11px] lg:text-[8px] text-muted-foreground uppercase tracking-[0.2em] lg:tracking-wider font-bold truncate">
          {formatCategory(item.subcategoria)}
        </p>
        <h3 className={cn(
          "font-bold text-xs sm:text-base lg:text-[11px] leading-tight line-clamp-2 lg:line-clamp-1 lg:group-hover:line-clamp-2 transition-all",
          isBlocked ? "text-muted-foreground" : "text-foreground"
        )} title={item.nome}>
          {item.nome}
        </h3>
        <div className="flex items-baseline gap-1 sm:gap-2 lg:gap-1 min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap min-w-0">
            <span className={cn(
              "text-lg sm:text-2xl lg:text-xs font-black truncate",
              isBlocked ? "text-muted-foreground" : "gradient-text"
            )}>
              {formatPrice(item.preco)}
            </span>
            <span className="text-[10px] sm:text-xs lg:text-[8px] text-muted-foreground uppercase font-bold tracking-wider shrink-0">
              {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
