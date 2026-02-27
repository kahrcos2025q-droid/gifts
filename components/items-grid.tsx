"use client"

import { useMemo, useState } from "react"
import { ItemCard } from "./item-card"
import { Filters } from "./filters"
import { Pagination } from "./pagination"
import type { Item } from "@/lib/types"
import { Package, Sparkles, Lock } from "lucide-react"
import { useAppStore } from "@/lib/store"

interface ItemsGridProps {
  items: Item[]
  onOpenFriendCodeModal?: () => void
}

const ITEMS_PER_PAGE = 27

// Helper to check if an item's launch date has already passed
const isReleased = (item: Item): boolean => {
  const [datePart, timePart] = item.data_lancamento.split(" ")
  const [day, month, year] = datePart.split("/")
  const [hours, minutes, seconds] = (timePart || "00:00:00").split(":")
  const itemDate = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hours), Number(minutes), Number(seconds)
  )
  return itemDate <= new Date()
}

// Format release date for display
const formatReleaseDate = (dateString: string): string => {
  const [datePart, timePart] = dateString.split(" ")
  const [day, month, year] = datePart.split("/")
  return `${day}/${month}/${year}`
}

export function ItemsGrid({ items, onOpenFriendCodeModal }: ItemsGridProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [subcategory, setSubcategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentPage, setCurrentPage] = useState(1)
  const { blockedItemsMap } = useAppStore()

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
    // Include ALL items (launched and not yet launched)
    // Items marked nao_lancado but whose date has passed are treated as released
    let filtered = items.map(item => ({
      ...item,
      // Auto-release: if nao_lancado but date has passed, treat as released
      nao_lancado: item.nao_lancado ? !isReleased(item) : false,
    }))

    // Filter out blocked items (already sent or owned) - only for released items
    filtered = filtered.filter((item) => {
      if (item.nao_lancado) return true // always show unreleased
      return !blockedItemsMap.has(item.id)
    })

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

    // Always put unreleased items at the end
    filtered.sort((a, b) => {
      if (a.nao_lancado && !b.nao_lancado) return 1
      if (!a.nao_lancado && b.nao_lancado) return -1
      return 0
    })

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

      {/* Results Info */}
      <div className="flex items-center justify-between py-2 px-1">
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
