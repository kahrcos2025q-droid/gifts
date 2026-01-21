"use client"

import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FiltersProps {
  search: string
  setSearch: (value: string) => void
  category: string
  setCategory: (value: string) => void
  subcategory: string
  setSubcategory: (value: string) => void
  categories: string[]
  subcategories: string[]
  sortBy: string
  setSortBy: (value: string) => void
  onClearFilters: () => void
}

export function Filters({
  search,
  setSearch,
  category,
  setCategory,
  subcategory,
  setSubcategory,
  categories,
  subcategories,
  sortBy,
  setSortBy,
  onClearFilters,
}: FiltersProps) {
  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  const sortOptions = [
    { value: "name", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
    { value: "price-asc", label: "Menor preco" },
    { value: "price-desc", label: "Maior preco" },
    { value: "date", label: "Mais recentes" },
  ]

  const currentSort = sortOptions.find(opt => opt.value === sortBy)?.label || "Ordenar"

  const activeFiltersCount = [
    category && category !== "all",
    subcategory && subcategory !== "all",
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search and Actions Row */}
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar itens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-secondary/40 border-border/40 text-base placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="hidden sm:flex h-11 px-4 bg-transparent border-border/40 hover:bg-secondary/40 gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden md:inline">{currentSort}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={sortBy === option.value ? "bg-primary/10 text-primary" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filters Sheet Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="h-11 px-4 bg-transparent border-border/40 hover:bg-secondary/40 gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-sm">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6">
              {/* Category Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <Select value={category || "all"} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 bg-secondary/40 border-border/40">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {formatCategory(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Subcategoria</label>
                <Select value={subcategory || "all"} onValueChange={setSubcategory}>
                  <SelectTrigger className="h-11 bg-secondary/40 border-border/40">
                    <SelectValue placeholder="Todas as subcategorias" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Todas as subcategorias</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {formatCategory(sub)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort - Mobile Only */}
              <div className="space-y-2 sm:hidden">
                <label className="text-sm font-medium text-muted-foreground">Ordenar por</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 bg-secondary/40 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={onClearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {category && category !== "all" && (
            <button
              onClick={() => setCategory("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              {formatCategory(category)}
              <X className="h-3 w-3" />
            </button>
          )}
          {subcategory && subcategory !== "all" && (
            <button
              onClick={() => setSubcategory("all")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm text-accent hover:bg-accent/20 transition-colors"
            >
              {formatCategory(subcategory)}
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}
