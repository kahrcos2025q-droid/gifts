"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { User, X, Loader2, Check } from "lucide-react"
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
import { getUserItems } from "@/lib/supabase"
import { toast } from "sonner"

export interface FriendCodeModalRef {
  open: () => void
}

export const FriendCodeModal = forwardRef<FriendCodeModalRef>((props, ref) => {
  const { friendCode, setFriendCode, setBlockedItems } = useAppStore()
  const [open, setOpen] = useState(false)
  const [friendCodeInput, setFriendCodeInput] = useState(friendCode)
  const [isLoading, setIsLoading] = useState(false)
  
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
    setOpen(false)
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
