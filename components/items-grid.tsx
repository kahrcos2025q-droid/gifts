"use client"

import { useMemo, useState } from "react"
import { ItemCard } from "./item-card"
import { Filters } from "./filters"
import { Pagination } from "./pagination"
import type { Item } from "@/lib/types"
import { 
  Package, 
  Sparkles, 
  ShoppingBag, 
  CheckCheck, 
  Crown, 
  Search, 
  ArrowUpDown, 
  X, 
  Shirt, 
  Play, 
  Armchair, 
  PawPrint, 
  LayoutGrid, 
  Key, 
  Coins, 
  ChevronRight, 
  History, 
  ShieldCheck 
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CurrencyToggle } from "@/components/currency-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ItemsGridProps {
  items: Item[]
  onOpenFriendCodeModal?: () => void
  onOpenLimits?: () => void
  onOpenKeyInfo?: () => void
}

const ITEMS_PER_PAGE = 42
const QUICK_ADD_COUNT = 30

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  all: { label: "Todas as Categorias", icon: LayoutGrid },
  clothing: { label: "Roupas & Moda", icon: Shirt },
  animation: { label: "Animações & Poses", icon: Play },
  furniture: { label: "Móveis & Casa", icon: Armchair },
  "petkin-clothing": { label: "Petkins & Acessórios", icon: PawPrint },
  petkin: { label: "Petkins", icon: PawPrint },
}

export function ItemsGrid({ 
  items, 
  onOpenFriendCodeModal,
  onOpenLimits,
  onOpenKeyInfo,
}: ItemsGridProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [subcategory, setSubcategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentPage, setCurrentPage] = useState(1)
  const { blockedItemsMap, addToCart, cart, canAddToCart, maxItemPrice, currency } = useAppStore()
  const { toast } = useToast()

  const sortOptions = [
    { value: "date", label: "Mais recentes" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
    { value: "name", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
  ]

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Ordenar"

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(items.map((item) => item.categoria))].sort()
  }, [items])

  // Get subcategories based on selected category
  const subcategories = useMemo(() => {
    const filtered = category === "all" 
      ? items 
      : items.filter((item) => item.categoria === category)
    return [...new Set(filtered.map((item) => item.subcategoria))].sort()
  }, [items, category])

  // Category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    
    // Base eligible items (launched & under max price)
    const eligible = items.filter(item => {
      if (item.nao_lancado) return false
      if (item.preco > maxItemPrice) return false
      if (blockedItemsMap.has(item.id)) return false
      return true
    })

    counts.all = eligible.length

    for (const item of eligible) {
      counts[item.categoria] = (counts[item.categoria] || 0) + 1
    }

    return counts
  }, [items, maxItemPrice, blockedItemsMap])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    // Filter out items not yet launched (nao_lancado: true)
    let filtered = items.filter((item) => !item.nao_lancado)
    
    // Filter by date: only show items with current or past dates
    filtered = filtered.filter((item) => {
      const [datePart] = item.data_lancamento.split(" ")
      const [day, month, year] = datePart.split("/")
      const itemDate = new Date(`${year}-${month}-${day}`)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return itemDate <= now
    })

    // Filter out blocked items (already sent or owned)
    filtered = filtered.filter((item) => !blockedItemsMap.has(item.id))

    // Filter out items above the max price limit
    filtered = filtered.filter((item) => item.preco <= maxItemPrice)

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.nome.toLowerCase().includes(searchLower) ||
          item.categoria.toLowerCase().includes(searchLower) ||
          item.subcategoria.toLowerCase().includes(searchLower) ||
          item.marca.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (category && category !== "all") {
      filtered = filtered.filter((item) => item.categoria === category)
    }

    // Subcategory filter
    if (subcategory && subcategory !== "all") {
      filtered = filtered.filter((item) => item.subcategoria === subcategory)
    }

    // Sort
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.nome.localeCompare(b.nome))
        break
      case "name-desc":
        filtered.sort((a, b) => b.nome.localeCompare(a.nome))
        break
      case "price-asc":
        filtered.sort((a, b) => a.preco - b.preco)
        break
      case "price-desc":
        filtered.sort((a, b) => b.preco - a.preco)
        break
      case "date":
        filtered.sort((a, b) => {
          const dateA = new Date(a.data_lancamento.split(" ")[0].split("/").reverse().join("-"))
          const dateB = new Date(b.data_lancamento.split(" ")[0].split("/").reverse().join("-"))
          return dateB.getTime() - dateA.getTime()
        })
        break
    }

    return filtered
  }, [items, search, category, subcategory, sortBy, blockedItemsMap, maxItemPrice])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, currentPage])

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearch("")
    setCategory("all")
    setSubcategory("all")
    setSortBy("date")
    setCurrentPage(1)
  }

  // Quick Add handler
  const handleQuickAdd = () => {
    const cartIds = new Set(cart.map((i) => i.id))
    const candidates = filteredItems.filter((item) => !cartIds.has(item.id) && canAddToCart(item))
    const toAdd = candidates.slice(0, QUICK_ADD_COUNT)
    let added = 0
    for (const item of toAdd) {
      const ok = addToCart(item)
      if (ok) added++
    }
    if (added === 0) {
      toast({ title: "Carrinho cheio", description: "Não foi possível adicionar novos itens.", variant: "destructive" })
    } else {
      toast({ title: `${added} ${added === 1 ? "item adicionado" : "itens adicionados"}`, description: "Itens adicionados ao carrinho com sucesso." })
    }
  }

  const quickAddAvailable = useMemo(() => {
    const cartIds = new Set(cart.map((i) => i.id))
    return filteredItems.filter((item) => !cartIds.has(item.id) && canAddToCart(item)).length
  }, [filteredItems, cart, canAddToCart])

  const crownsUnavailable = currency === 'crowns'

  const formatCategoryName = (cat: string) => {
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat].label
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ").replace(/-/g, " ")
  }

  const formatSubcategoryName = (sub: string) => {
    return sub.charAt(0).toUpperCase() + sub.slice(1).replace(/_/g, " ").replace(/-/g, " ")
  }

  const getCategoryIcon = (cat: string) => {
    if (CATEGORY_MAP[cat]?.icon) {
      const Icon = CATEGORY_MAP[cat].icon
      return <Icon className="h-4 w-4 shrink-0" />
    }
    return <Package className="h-4 w-4 shrink-0" />
  }

  const hasActiveFilters = Boolean(search || (category && category !== "all") || (subcategory && subcategory !== "all"))

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* MOBILE FILTERS & MOBILE CONTROLS (lg:hidden)                                */}
      {/* ========================================================================= */}
      <div className="lg:hidden space-y-6">
        <Filters
          search={search}
          setSearch={(value) => {
            setSearch(value)
            handleFilterChange()
          }}
          category={category}
          setCategory={(value) => {
            setCategory(value)
            setSubcategory("all")
            handleFilterChange()
          }}
          subcategory={subcategory}
          setSubcategory={(value) => {
            setSubcategory(value)
            handleFilterChange()
          }}
          categories={categories}
          subcategories={subcategories}
          sortBy={sortBy}
          setSortBy={(value) => {
            setSortBy(value)
            handleFilterChange()
          }}
          onClearFilters={handleClearFilters}
        />

        {crownsUnavailable ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <Crown className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Itens de Crowns indisponíveis</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Os itens de Crowns estão indisponíveis no momento. Volte para Avacoins para ver os itens disponíveis.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 py-2 px-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredItems.length}</span>
                    {" "}{filteredItems.length === 1 ? "item encontrado" : "itens encontrados"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{currentPage}</span> de <span className="font-semibold text-foreground">{totalPages || 1}</span>
                </span>
              </div>
              {currency === 'avacoins' && (
                <div className="text-xs text-muted-foreground">
                  Limite máximo por item: <span className="font-semibold text-primary">{maxItemPrice.toLocaleString("pt-BR")} Avacoins</span>
                </div>
              )}
            </div>

            {quickAddAvailable > 0 && (
              <button
                onClick={handleQuickAdd}
                className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-border bg-card/60 text-card-foreground transition-all duration-200 hover:border-primary/40 hover:bg-card active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-none">Adicionar {Math.min(QUICK_ADD_COUNT, quickAddAvailable)} itens</p>
                    <p className="mt-1 text-xs text-muted-foreground">Preencher carrinho automaticamente</p>
                  </div>
                </div>
                <CheckCheck className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </button>
            )}

            {paginatedItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {paginatedItems.map((item) => (
                  <ItemCard key={item.id} item={item} onOpenFriendCodeModal={onOpenFriendCodeModal} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nenhum item encontrado</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  Tente ajustar os filtros ou buscar por outro termo
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              />
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP COMPACT PROFESSIONAL E-COMMERCE LAYOUT (hidden lg:block)          */}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        {crownsUnavailable ? (
          <div className="glass rounded-3xl p-16 text-center border-2 border-border/40 max-w-2xl mx-auto my-12 shadow-2xl">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black gradient-text">Itens de Crowns Indisponíveis</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed text-sm max-w-md mx-auto">
              O catálogo de Crowns está em manutenção no momento. Alterne para a moeda Avacoins para navegar e enviar presentes normalmente.
            </p>
            <div className="mt-8 flex justify-center">
              <CurrencyToggle />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] gap-6 items-start">
            {/* ==================== DESKTOP STICKY SIDEBAR ==================== */}
            <aside className="sticky top-24 space-y-4">
              {/* Currency & Quick Stats Card */}
              <div className="glass rounded-2xl p-4 border border-border/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    Moeda Ativa
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] font-bold border-primary/30 text-primary bg-primary/5">
                    {currency.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <CurrencyToggle />
                </div>
                <div className="pt-2 border-t border-border/20 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Limite p/ item:</span>
                  <span className="font-bold text-foreground">{maxItemPrice.toLocaleString("pt-BR")}</span>
                </div>
              </div>

              {/* Category Navigation Menu */}
              <div className="glass rounded-2xl p-3 border border-border/40 shadow-sm space-y-1.5">
                <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Categorias
                </div>

                {/* 'All' category button */}
                <button
                  onClick={() => {
                    setCategory("all")
                    setSubcategory("all")
                    handleFilterChange()
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-left group cursor-pointer",
                    category === "all"
                      ? "bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10 text-primary border border-primary/30 shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center transition-colors",
                      category === "all" ? "bg-primary text-primary-foreground" : "bg-secondary/30 group-hover:bg-secondary/50 text-foreground"
                    )}>
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </div>
                    <span>Todas as Categorias</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono font-bold px-1.5 py-0 rounded-md">
                    {categoryCounts.all || 0}
                  </Badge>
                </button>

                {/* Dynamic categories list */}
                {categories.map((cat) => {
                  const isActive = category === cat
                  const count = categoryCounts[cat] || 0
                  return (
                    <div key={cat} className="space-y-1">
                      <button
                        onClick={() => {
                          setCategory(cat)
                          setSubcategory("all")
                          handleFilterChange()
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-left group cursor-pointer",
                          isActive
                            ? "bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10 text-primary border border-primary/30 shadow-sm font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-1.5">
                          <div className={cn(
                            "h-6 w-6 rounded-lg flex items-center justify-center transition-colors shrink-0",
                            isActive ? "bg-primary text-primary-foreground" : "bg-secondary/30 group-hover:bg-secondary/50 text-foreground"
                          )}>
                            {getCategoryIcon(cat)}
                          </div>
                          <span className="truncate">{formatCategoryName(cat)}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-mono font-bold px-1.5 py-0 rounded-md shrink-0">
                          {count}
                        </Badge>
                      </button>

                      {/* Subcategories accordion if this category is selected */}
                      {isActive && subcategories.length > 0 && (
                        <div className="pl-5 pr-1 py-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <button
                            onClick={() => {
                              setSubcategory("all")
                              handleFilterChange()
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors text-left cursor-pointer",
                              subcategory === "all"
                                ? "text-primary font-bold bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/15"
                            )}
                          >
                            <span>Todos os subitens</span>
                            {subcategory === "all" && <ChevronRight className="h-3 w-3 text-primary" />}
                          </button>
                          {subcategories.map((sub) => {
                            const isSubActive = subcategory === sub
                            return (
                              <button
                                key={sub}
                                onClick={() => {
                                  setSubcategory(sub)
                                  handleFilterChange()
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors text-left cursor-pointer",
                                  isSubActive
                                    ? "text-primary font-bold bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/15"
                                )}
                              >
                                <span className="truncate pr-1">{formatSubcategoryName(sub)}</span>
                                {isSubActive && <ChevronRight className="h-3 w-3 text-primary shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Informative & Quick Links Box */}
              <div className="glass rounded-2xl p-3 border border-border/40 shadow-sm space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ajuda & Informações
                </div>
                {onOpenLimits && (
                  <button
                    onClick={onOpenLimits}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors text-left cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Regras & Limites</span>
                  </button>
                )}
                {onOpenKeyInfo && (
                  <button
                    onClick={onOpenKeyInfo}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors text-left cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Como Obter Chave</span>
                  </button>
                )}
                <button
                  onClick={() => router.push('/sent-items')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors text-left cursor-pointer"
                >
                  <History className="h-3.5 w-3.5 text-secondary shrink-0" />
                  <span>Histórico de Presentes</span>
                </button>
              </div>
            </aside>

            {/* ==================== DESKTOP MAIN CATALOG ==================== */}
            <main className="min-w-0 space-y-4">
              {/* Desktop Top Control Bar */}
              <div className="glass rounded-2xl p-3 lg:p-4 border border-border/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    placeholder="Pesquise por nome, marca ou categoria..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      handleFilterChange()
                    }}
                    className="pl-10 pr-9 h-10 bg-secondary/15 border-border/30 rounded-xl text-xs font-medium focus-visible:ring-1 focus-visible:ring-primary/40 transition-all w-full"
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch("")
                        handleFilterChange()
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-secondary/30 transition-colors cursor-pointer"
                      title="Limpar pesquisa"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Actions: Sort & Quick Add */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                  {/* Sort Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 px-3.5 rounded-xl glass border-border/40 hover:border-primary/40 gap-2 font-bold text-xs shrink-0 cursor-pointer"
                      >
                        <ArrowUpDown className="h-3 w-3 text-primary" />
                        <span>{currentSortLabel}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 glass border border-border/40 rounded-xl p-1.5 shadow-xl">
                      {sortOptions.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => {
                            setSortBy(opt.value)
                            handleFilterChange()
                          }}
                          className={cn(
                            "rounded-lg font-semibold text-xs py-2 cursor-pointer",
                            sortBy === opt.value ? "bg-primary/15 text-primary font-bold" : "hover:bg-secondary/20"
                          )}
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Desktop Quick Add 30 items */}
                  {quickAddAvailable > 0 && (
                    <Button
                      onClick={handleQuickAdd}
                      variant="outline"
                      className="h-10 px-3.5 rounded-xl border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary font-bold text-xs gap-2 shrink-0 shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Adicionar {Math.min(QUICK_ADD_COUNT, quickAddAvailable)} Itens</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Pills & Items Count Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Exibindo <span className="text-foreground font-black">{filteredItems.length}</span> {filteredItems.length === 1 ? "item" : "itens"}
                  </span>

                  {/* Active Filter Badges */}
                  {category !== "all" && (
                    <Badge variant="outline" className="gap-1 pl-2 pr-1 py-0.5 rounded-lg glass border-primary/30 text-primary text-[11px] font-semibold">
                      <span>Categoria: {formatCategoryName(category)}</span>
                      <button 
                        onClick={() => {
                          setCategory("all")
                          setSubcategory("all")
                          handleFilterChange()
                        }}
                        className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  )}

                  {subcategory !== "all" && (
                    <Badge variant="outline" className="gap-1 pl-2 pr-1 py-0.5 rounded-lg glass border-accent/30 text-accent text-[11px] font-semibold">
                      <span>Subcategoria: {formatSubcategoryName(subcategory)}</span>
                      <button 
                        onClick={() => {
                          setSubcategory("all")
                          handleFilterChange()
                        }}
                        className="hover:bg-accent/20 rounded-full p-0.5 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  )}

                  {search && (
                    <Badge variant="outline" className="gap-1 pl-2 pr-1 py-0.5 rounded-lg glass border-secondary/30 text-foreground text-[11px] font-semibold">
                      <span>Busca: "{search}"</span>
                      <button 
                        onClick={() => {
                          setSearch("")
                          handleFilterChange()
                        }}
                        className="hover:bg-secondary/30 rounded-full p-0.5 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="text-[11px] text-muted-foreground hover:text-destructive underline font-semibold ml-1 transition-colors cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground font-semibold">
                  Página {currentPage} de {totalPages || 1}
                </div>
              </div>

              {/* Product Grid (Desktop Compact 5 to 7 Columns) */}
              {paginatedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-3 lg:gap-3.5">
                  {paginatedItems.map((item) => (
                    <ItemCard key={item.id} item={item} onOpenFriendCodeModal={onOpenFriendCodeModal} />
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl p-12 text-center border border-border/40 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-secondary/30 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Nenhum item encontrado</h3>
                  <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
                    Não encontramos itens que correspondam aos filtros selecionados. Tente ajustar os termos de pesquisa ou categoria.
                  </p>
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    className="mt-4 rounded-xl font-bold text-xs h-9 px-4 cursor-pointer"
                  >
                    Restaurar Catálogo
                  </Button>
                </div>
              )}

              {/* Desktop Pagination */}
              {totalPages > 1 && (
                <div className="pt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      window.scrollTo({ top: 120, behavior: "smooth" })
                    }}
                  />
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
