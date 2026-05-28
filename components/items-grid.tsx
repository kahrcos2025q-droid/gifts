"use client"

import { useMemo, useState } from "react"
import { ItemCard } from "./item-card"
import { Filters } from "./filters"
import { Pagination } from "./pagination"
import type { Item } from "@/lib/types"
import { Package, Sparkles, ShoppingBag, CheckCheck } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface ItemsGridProps {
  items: Item[]
  onOpenFriendCodeModal?: () => void
}

const ITEMS_PER_PAGE = 27
const QUICK_ADD_COUNT = 30

export function ItemsGrid({ items, onOpenFriendCodeModal }: ItemsGridProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [subcategory, setSubcategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentPage, setCurrentPage] = useState(1)
  const { blockedItemsMap, addToCart, cart, canAddToCart, maxItemPrice, currency } = useAppStore()
  const { toast } = useToast()

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
      now.setHours(0, 0, 0, 0) // Reset to start of day for fair comparison
      return itemDate <= now
    })

    // Filter out blocked items (already sent or owned) - usando Map para O(1)
    filtered = filtered.filter((item) => !blockedItemsMap.has(item.id))

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
  }, [items, search, category, subcategory, sortBy, blockedItemsMap])

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
    setSortBy("name")
    setCurrentPage(1)
  }

  // Add up to QUICK_ADD_COUNT items from the current filtered list to the cart
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

  return (
    <div className="space-y-6">
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
            Pagina <span className="font-semibold text-foreground">{currentPage}</span> de <span className="font-semibold text-foreground">{totalPages || 1}</span>
          </span>
        </div>
        {currency === 'avacoins' && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Limite maximo por item: <span className="font-semibold text-primary">{maxItemPrice.toLocaleString("pt-BR")} Avacoins</span>
            </div>
            <p className="text-xs text-muted-foreground/70 italic">
            </p>
          </div>
        )}
      </div>

      {/* Quick Add Button */}
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

      {/* Items Grid */}
      {paginatedItems.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
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

      {/* Pagination */}
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
    </div>
  )
}
