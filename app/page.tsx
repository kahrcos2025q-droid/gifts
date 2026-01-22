"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ItemsGrid } from "@/components/items-grid"
import { CartSheet } from "@/components/cart-sheet"
import itemsData from "@/lib/items-data.json"
import type { Item } from "@/lib/types"
import { Gift, AlertTriangle } from "lucide-react"

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false)
  const items = itemsData as Item[]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Beta Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-center text-amber-600 flex items-center justify-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Sistema em fase beta. Alguns erros podem ocorrer durante o uso.
          </p>
        </div>
      </div>
      
      <Header onOpenCart={() => setCartOpen(true)} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Gift className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Catalogo de <span className="gradient-text">Presentes</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.filter(i => !i.nao_lancado).length.toLocaleString("pt-BR")} itens disponiveis
            </p>
          </div>
        </div>

        <ItemsGrid items={items} />
      </main>

      <footer className="border-t border-border/30 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gift className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold gradient-text">AVKNGIFTS</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Envie presentes para seus amigos no Avakin Life
            </p>
          </div>
        </div>
      </footer>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
