"use client"

import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface FiltersProps {
  search: string
  setSearch: (value: string) => void
  category: string
  setCategory: (value: string) => void
  subcategory: string
  setSubcategory: (value: string) => void
  priceRange: [number, number]
  setPriceRange: (value: [number, number]) => void
  categories: string[]
  subcategories: string[]
  maxPrice: number
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
  priceRange,
  setPriceRange,
  categories,
  subcategories,
  maxPrice,
  sortBy,
  setSortBy,
  onClearFilters,
}: FiltersProps) {
  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR").format(price)
  }

  const activeFiltersCount = [
    category && category !== "all",
    subcategory && subcategory !== "all",
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Categoria</Label>
        <Select value={category || "all"} onValueChange={setCategory}>
          <SelectTrigger className="h-11 bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {formatCategory(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Subcategoria</Label>
        <Select value={subcategory || "all"} onValueChange={setSubcategory}>
          <SelectTrigger className="h-11 bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Todas as subcategorias" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50 max-h-60">
            <SelectItem value="all">Todas as subcategorias</SelectItem>
            {subcategories.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {formatCategory(sub)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Faixa de Preco</Label>
          <span className="text-xs text-muted-foreground">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </span>
        </div>
        <Slider
          value={[priceRange[0], priceRange[1]]}
          min={0}
          max={maxPrice}
          step={100}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          className="py-2"
        />
        <div className="flex justify-between">
          <div className="px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-sm font-medium">{formatPrice(priceRange[0])}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/50">
            <span className="text-sm font-medium">{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11 bg-secondary/30 border-border/50 hover:border-primary/30 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="price-asc">Menor preco</SelectItem>
            <SelectItem value="price-desc">Maior preco</SelectItem>
            <SelectItem value="date">Mais recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full h-11 bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50" 
          onClick={onClearFilters}
        >
          <X className="w-4 h-4 mr-2" />
          Limpar todos os filtros
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens por nome, categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 bg-secondary/30 border-border/50 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Sort - Desktop */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-12 bg-secondary/30 border-border/50 rounded-xl hidden sm:flex hover:border-primary/30 transition-colors">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="price-asc">Menor preco</SelectItem>
              <SelectItem value="price-desc">Maior preco</SelectItem>
              <SelectItem value="date">Mais recentes</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="h-12 px-4 rounded-xl bg-transparent border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card border-border/50 w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="text-xl">Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Inline Filters */}
      <div className="hidden lg:flex gap-3 flex-wrap items-center">
        <Select value={category || "all"} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] h-10 bg-secondary/30 border-border/50 rounded-xl hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50">
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {formatCategory(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subcategory || "all"} onValueChange={setSubcategory}>
          <SelectTrigger className="w-[180px] h-10 bg-secondary/30 border-border/50 rounded-xl hover:border-primary/30 transition-colors">
            <SelectValue placeholder="Subcategoria" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border/50 max-h-60">
            <SelectItem value="all">Todas subcategorias</SelectItem>
            {subcategories.map((sub) => (
              <SelectItem key={sub} value={sub}>
                {formatCategory(sub)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Filters Tags */}
        {(category && category !== "all") && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
            {formatCategory(category)}
            <button 
              onClick={() => setCategory("all")}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        
        {(subcategory && subcategory !== "all") && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm">
            {formatCategory(subcategory)}
            <button 
              onClick={() => setSubcategory("all")}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
