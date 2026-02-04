"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface MobileSidebarProps {
  onOpenLimitsInfo: () => void
}

export interface MobileSidebarRef {
  open: () => void
  close: () => void
}

export const MobileSidebar = forwardRef<MobileSidebarRef, MobileSidebarProps>(
  ({ onOpenLimitsInfo }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }))

    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Opções e informações</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            {/* Limits Info Option */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-secondary/10"
              onClick={() => {
                onOpenLimitsInfo()
                setIsOpen(false)
              }}
            >
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">Limites de Envio</p>
                <p className="text-xs text-muted-foreground">
                  Ver informações sobre limites
                </p>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }
)

MobileSidebar.displayName = "MobileSidebar"
