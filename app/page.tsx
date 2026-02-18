"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { ItemsGrid } from "@/components/items-grid"
import { CartSheet } from "@/components/cart-sheet"
import { FriendCodeModal, type FriendCodeModalRef } from "@/components/friend-code-modal"
import { LimitsInfoModal, type LimitsInfoModalRef } from "@/components/limits-info-modal"
import { InfoMenuModal, type InfoMenuModalRef } from "@/components/info-menu-modal"
import { KeyInfoModal, type KeyInfoModalRef } from "@/components/key-info-modal"

import { MenuTab } from "@/components/menu-tab"
import { CurrencyToggle } from "@/components/currency-toggle"
import { useAppStore } from "@/lib/store"
import itemsDataAvacoins from "@/lib/items-data.json"
import itemsDataCrowns from "@/lib/crowns-data.json"
import type { Item } from "@/lib/types"
import { Package, AlertTriangle } from "lucide-react"

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false)
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const friendCodeModalRef = useRef<FriendCodeModalRef>(null)
  const limitsInfoModalRef = useRef<LimitsInfoModalRef>(null)
  const infoMenuModalRef = useRef<InfoMenuModalRef>(null)
  const keyInfoModalRef = useRef<KeyInfoModalRef>(null)
  const { currency } = useAppStore()
  
  // Check if any info modal is open
  const isAnyInfoModalOpen = isInfoMenuOpen || isLimitsModalOpen || isKeyModalOpen
  
  // Select items based on currency and add moeda property
  const items = (currency === 'crowns' 
    ? itemsDataCrowns.map(item => ({ ...item as Item, moeda: 'crowns' as const }))
    : itemsDataAvacoins.map(item => ({ ...item as Item, moeda: 'avacoins' as const }))
  )

  return (
    <div className="min-h-screen flex flex-col bg-background w-full max-w-full overflow-x-hidden">
      {/* Info Menu Modal - Main menu with options */}
      <InfoMenuModal 
        ref={infoMenuModalRef}
        onSelectLimits={() => limitsInfoModalRef.current?.open()}
        onSelectKey={() => keyInfoModalRef.current?.open()}
        onOpenChange={setIsInfoMenuOpen}
      />
      
      {/* Limits Info Modal */}
      <LimitsInfoModal 
        ref={limitsInfoModalRef}
        onOpenChange={setIsLimitsModalOpen}
      />
      
      {/* Key Info Modal */}
      <KeyInfoModal 
        ref={keyInfoModalRef}
        onOpenChange={setIsKeyModalOpen}
      />
      
      {/* Info Tab - Below Header */}
      <MenuTab 
        onOpenInfo={() => infoMenuModalRef.current?.open()} 
        isHidden={isAnyInfoModalOpen}
      />
      
      <Header 
        onOpenCart={() => setCartOpen(true)} 
      />
      
      <main className="flex-1 container mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 w-full max-w-[1920px] pt-20 sm:pt-24">
        {/* Premium Hero Header */}
        <div className="mb-8 sm:mb-12 text-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="h-64 w-64 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-3xl animate-pulse-glow" />
          </div>
          <div className="relative space-y-3 sm:space-y-4 animate-float">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-60 animate-pulse-glow" />
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center border-4 border-background">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter">
              Catálogo de <span className="gradient-text">Presentes</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              <span className="text-2xl sm:text-3xl font-black gradient-text">
                {items.filter(i => !i.nao_lancado).length.toLocaleString("pt-BR")}
              </span>
              {" "}itens disponíveis
            </p>
          </div>
        </div>

        {/* Friend Code Modal - Below Title */}
        <div className="mb-6 sm:hidden">
          <FriendCodeModal 
            ref={friendCodeModalRef}
          />
        </div>

        <ItemsGrid 
          items={items} 
          onOpenFriendCodeModal={() => friendCodeModalRef.current?.open()}
        />
      </main>

      <footer className="relative border-t border-border/20 py-12 mt-16 glass">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-xl opacity-60" />
                <img 
                  src="/logo.png" 
                  alt="AVKNGIFTS Logo" 
                  className="relative h-12 w-12 rounded-2xl object-cover ring-2 ring-primary/50"
                />
              </div>
              <div>
                <span className="font-black text-2xl gradient-text block">AVKNGIFTS</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Gifts Platform</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Envie presentes para seus amigos no Avakin Life com segurança e praticidade
            </p>
          </div>
        </div>
      </footer>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
