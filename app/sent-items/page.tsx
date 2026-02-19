"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, CheckCircle2, Lock, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Pagination } from "@/components/pagination"
import { useAppStore } from "@/lib/store"
import { getUserItemsPaginated, getUserItemsCount } from "@/lib/supabase"
import itemsData from "@/lib/items-data.json"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Item } from "@/lib/types"
import type { UserItem } from "@/lib/supabase"

const ITEMS_PER_PAGE = 50

export default function SentItemsPage() {
  const router = useRouter()
  const { friendCode } = useAppStore()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [userItems, setUserItems] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch total count on mount
  useEffect(() => {
    const fetchCount = async () => {
      if (!friendCode) return
      const count = await getUserItemsCount(friendCode)
      setTotalCount(count)
    }
    fetchCount()
  }, [friendCode])

  // Fetch paginated items when page changes
  useEffect(() => {
    const fetchItems = async () => {
      if (!friendCode) return
      setLoading(true)
      const items = await getUserItemsPaginated(friendCode, currentPage, ITEMS_PER_PAGE)
      setUserItems(items)
      setLoading(false)
    }
    fetchItems()
  }, [friendCode, currentPage])

  // Filter and prepare sent items
  const sentItems = useMemo(() => {
    return itemsData
      .filter((item) =>
        userItems.some((blocked) => blocked.item_id === item.id)
      )
      .map((item) => {
        const blockedItem = userItems.find((b) => b.item_id === item.id)
        return {
          ...item,
          status: blockedItem?.status || 'owned',
        }
      })
  }, [userItems])

  // Filter by search (client-side filtering of current page)
  const filteredItems = useMemo(() => {
    if (!search) return sentItems
    
    const searchLower = search.toLowerCase()
    return sentItems.filter((item) =>
      item.nome.toLowerCase().includes(searchLower) ||
      item.categoria.toLowerCase().includes(searchLower) ||
      item.subcategoria?.toLowerCase().includes(searchLower)
    )
  }, [sentItems, search])

  // Pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Redirect to home if no friend code
  useEffect(() => {
    if (!friendCode) {
      router.push('/')
    }
  }, [friendCode, router])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const ownedCount = useMemo(() => 
    userItems.filter((item) => item.status === 'owned').length,
    [userItems]
  )
  const blockedCount = useMemo(() => 
    userItems.filter((item) => item.status === 'purchase_not_allowed').length,
    [userItems]
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background w-full max-w-full overflow-x-hidden">
      <Header onOpenCart={() => setCartOpen(true)} />

      <main className="flex-1 container mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 w-full max-w-[1920px] pt-20 sm:pt-24">
        {/* Page Header */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">
                Itens <span className="gradient-text">Enviados</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Total: {totalCount} {totalCount === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl border-2 border-border/20 glass p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                <span className="text-2xl sm:text-4xl font-black gradient-text">{ownedCount}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Já Possui</p>
            </div>
            <div className="rounded-2xl border-2 border-border/20 glass p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-2xl sm:text-4xl font-black gradient-text">{blockedCount}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Bloqueados</p>
            </div>
          </div>

          {/* Friend Code Info */}
          {friendCode && (
            <div className="rounded-2xl border-2 border-accent/20 glass p-4">
              <p className="text-sm text-muted-foreground text-center">
                Itens para: <span className="font-mono font-bold text-accent">{friendCode}</span>
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar itens enviados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-2 glass"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando itens...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden glass border-2 border-border/20 card-hover"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
                    <Image
                      src={item.imagem || "/placeholder.svg"}
                      alt={item.nome}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/20 to-transparent opacity-80" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                      {item.status === 'owned' ? (
                        <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-green-500/30 text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Possui
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-primary/30 text-primary flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </span>
                      )}
                    </div>

                    {/* Category Tag */}
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
                      <span className="px-2.5 py-1 text-[9px] sm:text-[11px] font-bold rounded-xl glass border border-border/30 text-foreground">
                        {formatCategory(item.categoria)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="relative p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <p className="text-[9px] sm:text-[11px] text-muted-foreground uppercase tracking-[0.2em] font-bold truncate">
                      {formatCategory(item.subcategoria)}
                    </p>
                    <h3 className="font-bold text-xs sm:text-base leading-tight line-clamp-2 text-foreground">
                      {item.nome}
                    </h3>
                    <div className="flex items-baseline gap-1 sm:gap-2 min-w-0">
                      <span className="text-lg sm:text-2xl font-black gradient-text truncate">
                        {formatPrice(item.preco)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider shrink-0">
                        {item.moeda || "avacoins"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl glass flex items-center justify-center mb-6 border-2 border-border/20">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {search ? "Nenhum item encontrado" : "Nenhum item enviado"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search
                ? "Tente ajustar sua busca"
                : "Os itens que você enviar aparecerão aqui"}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
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
    </div>
  )
}
