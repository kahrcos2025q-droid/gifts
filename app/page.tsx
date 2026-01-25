"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { ItemsGrid } from "@/components/items-grid"
import { CartSheet } from "@/components/cart-sheet"
import { FriendCodeModal, type FriendCodeModalRef } from "@/components/friend-code-modal"
import itemsData from "@/lib/items-data.json"
import type { Item } from "@/lib/types"
import { Gift, AlertTriangle } from "lucide-react"

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false)
  const friendCodeModalRef = useRef<FriendCodeModalRef>(null)
  const items = itemsData as Item[]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Beta Banner */}
      
      
      <Header onOpenCart={() => setCartOpen(true)} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-3 flex items-center gap-3">
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

        {/* Friend Code Modal - Below Title */}
        <div className="mb-6 sm:hidden">
          <FriendCodeModal ref={friendCodeModalRef} />
        </div>

        <ItemsGrid 
          items={items} 
          onOpenFriendCodeModal={() => friendCodeModalRef.current?.open()}
        />
      </main>

      <footer className="border-t border-border/30 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.jpeg" 
                alt="AVKNGIFTS Logo" 
                className="h-8 w-8 rounded-lg object-cover"
              />
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
