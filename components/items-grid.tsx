"use client"

import { useMemo, useState, useEffect } from "react"
import { ItemCard } from "./item-card"
import { Filters } from "./filters"
import { Pagination } from "./pagination"
import type { Item } from "@/lib/types"
import { Package, Sparkles } from "lucide-react"

interface ItemsGridProps {
  items: Item[]
}

const ITEMS_PER_PAGE = 25

export function ItemsGrid({ items }: ItemsGridProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [subcategory, setSubcategory] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [sortBy, setSortBy] = useState("name")
  const [currentPage, setCurrentPage] = useState(1)
  const [isInitialized, setIsInitialized] = useState(false)

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

  // Calculate max price
  const maxPrice = useMemo(() => {
    const max = Math.max(...items.map((item) => item.preco))
    return Math.ceil(max / 1000) * 1000 // Round up to nearest 1000
  }, [items])

  // Initialize price range only once
  useEffect(() => {
    if (!isInitialized && maxPrice > 0) {
      setPriceRange([0, maxPrice])
      setIsInitialized(true)
    }
  }, [maxPrice, isInitialized])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => !item.nao_lancado)

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

    // Price range filter
    if (isInitialized && priceRange[1] > 0) {
      filtered = filtered.filter(
        (item) => item.preco >= priceRange[0] && item.preco <= priceRange[1]
      )
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
  }, [items, search, category, subcategory, priceRange, sortBy, isInitialized])

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
    setPriceRange([0, maxPrice])
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
        priceRange={priceRange}
        setPriceRange={(value) => {
          setPriceRange(value)
          handleFilterChange()
        }}
        categories={categories}
        subcategories={subcategories}
        maxPrice={maxPrice}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {paginatedItems.map((item) => (
            <ItemCard key={item.id} item={item} />
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
