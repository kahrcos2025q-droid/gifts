"use client"

import Image from "next/image"
import { Plus, Check, ShoppingCart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Item } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const MAX_ITEM_PRICE = 25000

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const { cart, addToCart, removeFromCart, canAddToCart, getRemainingCartValue } = useAppStore()
  const isInCart = cart.some((i) => i.id === item.id)
  const cartFull = cart.length >= 5
  const exceedsMaxPrice = item.preco > MAX_ITEM_PRICE
  const exceedsRemainingValue = !isInCart && item.preco > getRemainingCartValue()
  const canAdd = canAddToCart(item)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  const handleToggleCart = () => {
    if (isInCart) {
      removeFromCart(item.id)
    } else if (exceedsMaxPrice) {
      toast.error("Item acima do limite", {
        description: "Este item custa mais de 25.000 coins e nao pode ser adicionado ao carrinho.",
      })
    } else if (exceedsRemainingValue) {
      const remaining = getRemainingCartValue()
      toast.error("Limite do carrinho atingido", {
        description: `O carrinho so pode ter ate 25.000 coins no total. Espaco restante: ${new Intl.NumberFormat("pt-BR").format(remaining)} coins.`,
      })
    } else if (cartFull) {
      toast.error("Carrinho cheio", {
        description: "O carrinho so permite ate 5 itens.",
      })
    } else {
      addToCart(item)
    }
  }

  return (
    <div className={cn(
      "group relative rounded-xl sm:rounded-2xl overflow-hidden bg-card border border-border/30 card-hover",
      isInCart && "border-primary/50 ring-1 ring-primary/30"
    )}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/20">
        <Image
          src={item.imagem || "/placeholder.svg"}
          alt={item.nome}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        
        {/* Category Tags */}
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col gap-1">
          <span className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
            {formatCategory(item.categoria)}
          </span>
          {exceedsMaxPrice && (
            <span className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-medium rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur-sm">
              Acima do limite
            </span>
          )}
        </div>
        
        {/* Add Button - Always visible on mobile */}
        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
          <Button
            size="icon"
            className={cn(
              "h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl shadow-lg transition-all duration-300",
              isInCart 
                ? "bg-primary text-primary-foreground" 
                : "bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground",
              !isInCart && "md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0"
            )}
            onClick={handleToggleCart}
            disabled={!isInCart && !canAdd}
          >
            {isInCart ? (
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : cartFull ? (
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>

        {/* In Cart Indicator */}
        {isInCart && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
        <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider truncate">
          {formatCategory(item.subcategoria)}
        </p>
        <h3 className="font-medium text-[11px] sm:text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {item.nome}
        </h3>
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className="text-sm sm:text-lg font-bold text-primary">
            {formatPrice(item.preco)}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">coins</span>
        </div>
      </div>
    </div>
  )
}
