"use client"

import { forwardRef, useImperativeHandle, useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { Package, CheckCircle2, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SentItemsModalProps {
  items: Item[]
}

export interface SentItemsModalRef {
  open: () => void
  close: () => void
}

export const SentItemsModal = forwardRef<SentItemsModalRef, SentItemsModalProps>(
  ({ items }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const { blockedItems } = useAppStore()

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }))

    // Get sent items by matching blocked items with items list
    const sentItems = useMemo(() => {
      return blockedItems
        .map((blocked) => {
          const item = items.find((i) => i.id === blocked.item_id)
          if (item) {
            return { ...item, status: blocked.status }
          }
          return null
        })
        .filter((item): item is Item & { status: 'owned' | 'purchase_not_allowed' } => item !== null)
    }, [blockedItems, items])

    const ownedCount = sentItems.filter(i => i.status === 'owned').length
    const notAllowedCount = sentItems.filter(i => i.status === 'purchase_not_allowed').length

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <span className="gradient-text font-black">Itens Enviados</span>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Historico de presentes ja enviados ou que o usuario ja possui
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-3 bg-muted/30 border-b">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <span className="font-bold">{ownedCount}</span> ja possui
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  <span className="font-bold">{notAllowedCount}</span> nao permitido
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{sentItems.length} total</span>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 max-h-[calc(85vh-200px)]">
            <div className="p-6">
              {sentItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sentItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-border/40 p-3 bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-muted/50">
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1.5 right-1.5">
                          {item.status === 'owned' ? (
                            <Badge variant="default" className="bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                              Possui
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-orange-600 text-white text-[10px] px-1.5 py-0.5">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-xs line-clamp-2 mb-1">{item.nome}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR").format(item.preco)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Nenhum item enviado ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Os itens enviados para este codigo de amigo aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }
)

SentItemsModal.displayName = "SentItemsModal"
