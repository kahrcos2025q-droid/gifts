"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { User, X, Loader2, Check, History, ChevronDown, ChevronUp, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import { getUserItems, type UserItem } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface FriendCodeModalRef {
  open: () => void
}

export const FriendCodeModal = forwardRef<FriendCodeModalRef>((props, ref) => {
  const { friendCode, setFriendCode, setBlockedItems } = useAppStore()
  const [open, setOpen] = useState(false)
  const [friendCodeInput, setFriendCodeInput] = useState(friendCode)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sentItems, setSentItems] = useState<UserItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  useImperativeHandle(ref, () => ({
    open: () => {
      setFriendCodeInput(friendCode)
      setOpen(true)
    }
  }))

  const formatFriendCode = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/g, "")
    const limited = cleaned.slice(0, 6)
    if (limited.length > 3) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`
    }
    return limited
  }

  const handleFriendCodeChange = (value: string) => {
    const formatted = formatFriendCode(value.toUpperCase())
    setFriendCodeInput(formatted)
  }

  const handleSetFriendCode = async () => {
    const code = friendCodeInput.trim().toUpperCase()

    if (!code) {
      toast.error("Codigo invalido", {
        description: "Por favor, insira um codigo de amigo valido",
      })
      return
    }

    setIsLoading(true)

    try {
      const items = await getUserItems(code)
      setBlockedItems(items.map((i) => ({ item_id: i.item_id, status: i.status })))
      setFriendCode(code)
      toast.success("Codigo de amigo definido!", {
        description:
          items.length > 0
            ? `${items.length} item(ns) ja marcado(s) para esta conta`
            : "Pronto para enviar presentes",
      })
      setOpen(false)
    } catch (err) {
      console.error("[v0] Error in handleSetFriendCode:", err)
      toast.error("Erro ao verificar codigo", {
        description: "Tente novamente",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFriendCode = () => {
    setFriendCode("")
    setFriendCodeInput("")
    setBlockedItems([])
    setSentItems([])
    setShowHistory(false)
    setOpen(false)
  }

  const loadSentItemsHistory = async () => {
    if (!friendCode) return
    
    setLoadingHistory(true)
    try {
      const items = await getUserItems(friendCode)
      setSentItems(items)
      setShowHistory(true)
    } catch (err) {
      console.error("[v0] Error loading sent items:", err)
      toast.error("Erro ao carregar histórico")
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setFriendCodeInput(friendCode)
          setOpen(true)
        }}
        className="gap-2 sm:hidden bg-transparent border-border/50 hover:border-accent/50 hover:bg-accent/5"
      >
        <User className="h-4 w-4" />
        {friendCode ? (
          <span className="font-mono font-semibold text-accent">{friendCode}</span>
        ) : (
          "Código de Amigo"
        )}
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <User className="h-4 w-4 text-accent" />
              </div>
              Codigo de Amigo
            </DialogTitle>
            <DialogDescription>
              Insira o código de amigo da conta que irá receber os presentes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {friendCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
                  <span className="text-sm text-muted-foreground">Codigo atual:</span>
                  <span className="font-mono font-bold text-accent flex-1">{friendCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearFriendCode}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* View sent items button */}
                <Button
                  variant="outline"
                  className="w-full gap-2 glass border-2 border-border/30 hover:border-primary/50 bg-transparent"
                  onClick={() => {
                    if (!showHistory) {
                      loadSentItemsHistory()
                    } else {
                      setShowHistory(false)
                    }
                  }}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <History className="h-4 w-4" />
                      Ver itens já enviados
                      {showHistory ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </>
                  )}
                </Button>

                {/* History list */}
                {showHistory && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                      Histórico de envios ({sentItems.length})
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {sentItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum item enviado ainda</p>
                        </div>
                      ) : (
                        sentItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl glass border border-border/30"
                          >
                            <div className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              item.status === 'owned' ? "bg-amber-500" : "bg-destructive"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.item_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.status === 'owned' ? 'Já possui' : 'Compra não permitida'}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Ex: ABC-DEF"
                    value={friendCodeInput}
                    onChange={(e) => handleFriendCodeChange(e.target.value)}
                    className="pl-10 pr-4 h-11 font-mono text-base"
                    maxLength={7}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSetFriendCode()
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSetFriendCode}
                    disabled={isLoading || !friendCodeInput.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Definir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

FriendCodeModal.displayName = "FriendCodeModal"
