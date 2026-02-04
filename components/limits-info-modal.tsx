"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { Info, X } from "lucide-react"

interface LimitsInfoModalProps {
  onOpenChange?: (isOpen: boolean) => void
}

export interface LimitsInfoModalRef {
  open: () => void
  close: () => void
}

export const LimitsInfoModal = forwardRef<LimitsInfoModalRef, LimitsInfoModalProps>(
  ({ onOpenChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
      onOpenChange?.(isOpen)
    }, [isOpen, onOpenChange])

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }))

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60]" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal - Same style as key tooltip in header */}
      <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-80 z-[70] p-4 glass rounded-2xl border-2 border-primary/30 shadow-2xl bg-card/95 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-foreground mb-1">Limites de Envio</h4>
            
            <div className="space-y-3 mt-2">
              <div>
                <p className="text-xs font-bold text-primary mb-0.5">Itens de Avacoins:</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  É permitido o envio de itens no valor máximo de até <strong className="text-foreground">25.000 Avacoins cada</strong>.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-accent mb-0.5">Itens de Crowns:</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Não há limite de valor para envio de itens, desde que haja saldo disponível na <strong className="text-foreground">sua chave</strong>.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-secondary mb-0.5">Limite Diário:</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O limite diário se aplica apenas a contas que nunca realizaram uma recarga no jogo. Caso a conta já tenha realizado pelo menos uma recarga, o limite diário é <strong className="text-foreground">removido permanentemente</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </>
  )
})

LimitsInfoModal.displayName = "LimitsInfoModal"
