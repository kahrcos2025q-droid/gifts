"use client"

import { Search, SlidersHorizontal, X, ArrowUpDown, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyToggle } from "@/components/currency-toggle"
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
    <div className="space-y-6">
      {/* Premium Search and Actions Row */}
      <div className="flex gap-3">
        {/* Premium Search Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative glass rounded-3xl border-2 border-border/30 group-hover:border-primary/50 transition-colors">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
            <Input
              placeholder="Buscar itens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-12 h-11 bg-transparent border-0 text-base font-medium focus-visible:ring-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Premium Sort Dropdown - Desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="hidden sm:flex h-11 px-4 gap-2 rounded-3xl glass border-2 border-border/30 hover:border-primary/50 group bg-transparent"
            >
              <ArrowUpDown className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-bold">{currentSort}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass border-2 border-border/30 rounded-2xl p-2">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={cn(
                  "rounded-xl font-medium transition-all",
                  sortBy === option.value ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary" : "hover:bg-primary/10"
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Premium Filters Sheet Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="relative h-11 px-4 gap-2 rounded-3xl glass border-2 border-border/30 hover:border-primary/50 group overflow-hidden bg-transparent"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <SlidersHorizontal className="relative h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="relative hidden sm:inline font-bold">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="relative h-6 w-6 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs flex items-center justify-center font-black animate-pulse-glow">
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

      {/* Premium Currency Selection */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-3xl blur-xl opacity-50" />
        <div className="relative flex items-center justify-center gap-3 py-2.5 glass rounded-3xl border-2 border-border/20">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo de moeda:</span>
          <CurrencyToggle />
        </div>
      </div>

      {/* Premium Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-3">
          {category && category !== "all" && (
            <button
              onClick={() => setCategory("all")}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl glass border-2 border-primary/30 text-sm font-bold text-primary hover:border-primary/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">{formatCategory(category)}</span>
              <X className="relative h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
          {subcategory && subcategory !== "all" && (
            <button
              onClick={() => setSubcategory("all")}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-2xl glass border-2 border-primary/30 text-sm font-bold text-primary hover:border-primary/50 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">{formatCategory(subcategory)}</span>
              <X className="relative h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
