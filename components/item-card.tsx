"use client"

import Image from "next/image"
import { Plus, Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Item } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const { cart, addToCart, removeFromCart } = useAppStore()
  const isInCart = cart.some((i) => i.id === item.id)
  const cartFull = cart.length >= 5

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  const handleToggleCart = () => {
    if (isInCart) {
      removeFromCart(item.id)
    } else {
      addToCart(item)
    }
  }

  return (
    <div className={cn(
      "group relative rounded-2xl overflow-hidden bg-card border border-border/30 card-hover",
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
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
            {formatCategory(item.categoria)}
          </span>
        </div>
        
        {/* Add Button - Always visible on mobile */}
        <div className="absolute bottom-2 right-2">
          <Button
            size="icon"
            className={cn(
              "h-9 w-9 rounded-xl shadow-lg transition-all duration-300",
              isInCart 
                ? "bg-primary text-primary-foreground" 
                : "bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground",
              !isInCart && "md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0"
            )}
            onClick={handleToggleCart}
            disabled={!isInCart && cartFull}
          >
            {isInCart ? (
              <Check className="h-4 w-4" />
            ) : cartFull ? (
              <ShoppingCart className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* In Cart Indicator */}
        {isInCart && (
          <div className="absolute top-2 right-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              <Check className="h-3 w-3" />
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {formatCategory(item.subcategoria)}
        </p>
        <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {item.nome}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary">
            {formatPrice(item.preco)}
          </span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>
      </div>
    </div>
  )
}
