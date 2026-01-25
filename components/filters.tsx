"use client"

import { Search, SlidersHorizontal, X, ArrowUpDown, Check } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

const CATEGORY_LABELS: Record<string, string> = {
  animation: "Animações",
  clothing: "Roupas",
  furniture: "Móveis",
  "petkin-clothing": "Roupas de Petkin",
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
    return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ").replace(/-/g, " ")
  }

  const sortOptions = [
    { value: "name", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
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
            className="pl-9 h-11 bg-card border-border/50 text-base"
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
              className="hidden sm:flex h-11 px-4 gap-2 bg-transparent"
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
              className="h-11 px-4 gap-2 bg-transparent"
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
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl px-4">
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="text-xl font-semibold">Filtros</SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(80vh-140px)] pr-2">
              <div className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Categoria</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className={cn(
                        "h-auto py-3 justify-start relative",
                        (!category || category === "all") && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                      )}
                      onClick={() => setCategory("all")}
                    >
                      {(!category || category === "all") && <Check className="h-4 w-4 mr-2" />}
                      Todas
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant="outline"
                        className={cn(
                          "h-auto py-3 justify-start text-sm relative",
                          category === cat && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                        )}
                        onClick={() => setCategory(cat)}
                      >
                        {category === cat && <Check className="h-4 w-4 mr-2" />}
                        {formatCategory(cat)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Subcategory Selection */}
                {category && category !== "all" && subcategories.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Subcategoria</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className={cn(
                          "h-auto py-3 justify-start relative",
                          (!subcategory || subcategory === "all") && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                        )}
                        onClick={() => setSubcategory("all")}
                      >
                        {(!subcategory || subcategory === "all") && <Check className="h-4 w-4 mr-2" />}
                        Todas
                      </Button>
                      {subcategories.map((sub) => (
                        <Button
                          key={sub}
                          variant="outline"
                          className={cn(
                            "h-auto py-3 justify-start text-sm relative",
                            subcategory === sub && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                          )}
                          onClick={() => setSubcategory(sub)}
                        >
                          {subcategory === sub && <Check className="h-4 w-4 mr-2" />}
                          {formatCategory(sub)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className="sm:hidden" />

                {/* Sort - Mobile Only */}
                <div className="space-y-3 sm:hidden">
                  <h3 className="text-sm font-medium text-muted-foreground">Ordenar por</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {sortOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        className={cn(
                          "h-auto py-3 justify-start",
                          sortBy === option.value && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                        )}
                        onClick={() => setSortBy(option.value)}
                      >
                        {sortBy === option.value && <Check className="h-4 w-4 mr-2" />}
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer with Action Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 bg-transparent" 
                    onClick={onClearFilters}
                  >
                    Limpar filtros
                  </Button>
                )}
                <SheetTrigger asChild>
                  <Button className="flex-1 h-12">
                    Aplicar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                </SheetTrigger>
              </div>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-colors"
            >
              {formatCategory(subcategory)}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
