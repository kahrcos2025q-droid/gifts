"use client"

import { forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { Key, X } from "lucide-react"

interface KeyInfoModalProps {
  onOpenChange?: (isOpen: boolean) => void
}

export interface KeyInfoModalRef {
  open: () => void
  close: () => void
}

export const KeyInfoModal = forwardRef<KeyInfoModalRef, KeyInfoModalProps>(
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
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-foreground mb-1">Como obter sua chave?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              As chaves de acesso são comercializadas exclusivamente por revendedores autorizados no Instagram e outras plataformas especializadas em itens do Avakin Life.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para adquirir sua chave, entre em contato com sua loja de confiança e consulte sobre a disponibilidade das chaves desta plataforma.
            </p>
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

KeyInfoModal.displayName = "KeyInfoModal"
