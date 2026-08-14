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
import { MaintenanceScreen } from "@/components/maintenance-screen"
import { Package, AlertTriangle } from "lucide-react"

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false)
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false)
  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false)
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [apiOffline, setApiOffline] = useState(false)
  const [checkingApi, setCheckingApi] = useState(true)
  const friendCodeModalRef = useRef<FriendCodeModalRef>(null)
  const limitsInfoModalRef = useRef<LimitsInfoModalRef>(null)
  const infoMenuModalRef = useRef<InfoMenuModalRef>(null)
  const keyInfoModalRef = useRef<KeyInfoModalRef>(null)
  const { currency, setMaxItemPrice } = useAppStore()

  // Fetch price limit from external API via proxy
  const fetchPriceLimit = async () => {
    try {
      const res = await fetch('/api/limit', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        // Parse limit removing dots (e.g., "10.000" -> 10000)
        const limitValue = parseInt(data.limit?.replace(/\./g, '') || '25000', 10)
        if (!isNaN(limitValue) && limitValue > 0) {
          setMaxItemPrice(limitValue)
          console.log("[v0] Price limit updated to:", limitValue)
        }
      }
    } catch (error) {
      console.error('Failed to fetch price limit:', error)
    }
  }

  // Check API health on mount
  const checkApiHealth = async () => {
    try {
      setCheckingApi(true)
      const res = await fetch('/api/health', { cache: 'no-store' })
      setApiOffline(!res.ok)
    } catch (error) {
      setApiOffline(true)
    } finally {
      setCheckingApi(false)
    }
  }

  useEffect(() => {
    checkApiHealth()
    fetchPriceLimit()
  }, [])

  // Show maintenance screen if API is offline
  if (!checkingApi && apiOffline) {
    return <MaintenanceScreen onRetry={checkApiHealth} />
  }
  
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
      
      {/* Info Tab - Below Header (Only on Mobile) */}
      <div className="lg:hidden">
        <MenuTab 
          onOpenInfo={() => infoMenuModalRef.current?.open()} 
          isHidden={isAnyInfoModalOpen}
        />
      </div>
      
      <Header 
        onOpenCart={() => setCartOpen(true)} 
      />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 w-full max-w-[1920px] pt-20 md:pt-28">
        {/* Mobile Hero Header (lg:hidden) */}
        <div className="lg:hidden mb-8 sm:mb-12 text-center relative">
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
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter">
              Catálogo de <span className="gradient-text">Presentes</span>
            </h1>
            <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
              <span className="text-2xl font-black gradient-text">
                {items.filter(i => !i.nao_lancado).length.toLocaleString("pt-BR")}
              </span>
              {" "}itens disponíveis
            </p>
          </div>
        </div>

        {/* Desktop Header Banner (hidden lg:flex) */}
        <div className="hidden lg:flex items-center justify-between gap-6 mb-8 pb-6 border-b border-border/30">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Catálogo de Presentes
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30">
                {items.filter(i => !i.nao_lancado).length.toLocaleString("pt-BR")} itens ativos
              </span>
            </div>
          </div>

          {/* Desktop Banner Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => limitsInfoModalRef.current?.open()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass border border-border/40 hover:border-primary/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Package className="h-4 w-4 text-primary" />
              <span>Regras de Envio</span>
            </button>
            <button
              onClick={() => keyInfoModalRef.current?.open()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass border border-border/40 hover:border-accent/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <Package className="h-4 w-4 text-accent" />
              <span>Como Obter Chave</span>
            </button>
          </div>
        </div>

        {/* Friend Code Modal - Below Title on Mobile */}
        <div className="mb-6 sm:hidden">
          <FriendCodeModal 
            ref={friendCodeModalRef}
          />
        </div>

        <ItemsGrid 
          items={items} 
          onOpenFriendCodeModal={() => friendCodeModalRef.current?.open()}
          onOpenLimits={() => limitsInfoModalRef.current?.open()}
          onOpenKeyInfo={() => keyInfoModalRef.current?.open()}
        />
      </main>

      <footer className="relative border-t border-border/20 py-8 mt-16 glass">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="AVKNGIFTS Logo" 
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-primary/40"
              />
              <div>
                <span className="font-black text-lg gradient-text block leading-none">AVKNGIFTS</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Plataforma de Presentes</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              Envie presentes para seus amigos no Avakin Life com rapidez e segurança.
            </p>
          </div>
        </div>
      </footer>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
