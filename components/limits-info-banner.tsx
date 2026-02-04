"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LimitsInfoBannerProps {
  onOpenModal: () => void
}

export function LimitsInfoBanner({ onOpenModal }: LimitsInfoBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl glass border border-secondary/20 bg-secondary/5">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-secondary shrink-0" />
        <span className="text-xs sm:text-sm text-muted-foreground">Limites de envio</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenModal}
        className="h-7 px-3 text-xs shrink-0 glass border border-secondary/30 hover:border-secondary/50 bg-transparent"
      >
        Ver
      </Button>
    </div>
  )
}
