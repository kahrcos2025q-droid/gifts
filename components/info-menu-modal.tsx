"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { Info, ChevronRight, Key, AlertCircle } from "lucide-react"

interface InfoMenuModalProps {
  onSelectLimits: () => void
  onSelectKey: () => void
  onOpenChange?: (isOpen: boolean) => void
}

export interface InfoMenuModalRef {
  open: () => void
  close: () => void
}

export const InfoMenuModal = forwardRef<InfoMenuModalRef, InfoMenuModalProps>(
  ({ onSelectLimits, onSelectKey, onOpenChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    }

    useImperativeHandle(ref, () => ({
      open: () => handleOpenChange(true),
      close: () => handleOpenChange(false),
    }))

    // Close modal on scroll
    useEffect(() => {
      if (!isOpen) return

      const handleScroll = () => {
        handleOpenChange(false)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }, [isOpen])

    if (!isOpen) return null

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-[60]" 
          onClick={() => handleOpenChange(false)}
        />
        
        {/* Modal with same style as key tooltip */}
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-80 z-[70] glass rounded-2xl border-2 border-secondary/30 shadow-2xl bg-card/95 backdrop-blur-sm overflow-hidden">
          {/* Options */}
          <div className="p-3">
            {/* Limits Option */}
            <button
              onClick={() => {
                onSelectLimits()
                handleOpenChange(false)
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/10 transition-colors group"
            >
              <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-foreground">Limites de Envio</p>
                <p className="text-xs text-muted-foreground">Ver informações sobre limites</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Key Info Option */}
            <button
              onClick={() => {
                onSelectKey()
                handleOpenChange(false)
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/10 transition-colors group"
            >
              <div className="shrink-0 h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-foreground">Como Obter sua Chave</p>
                <p className="text-xs text-muted-foreground">Informações sobre aquisição</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </>
    )
  }
)

InfoMenuModal.displayName = "InfoMenuModal"
