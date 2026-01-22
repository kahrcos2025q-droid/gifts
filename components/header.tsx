"use client"

import { useState, useEffect, useRef } from "react"
import { Key, Wallet, ShoppingCart, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { getBalance } from "@/lib/api"
import { toast } from "sonner"

interface HeaderProps {
  onOpenCart: () => void
}

export function Header({ onOpenCart }: HeaderProps) {
  const { 
    userKey, 
    setUserKey, 
    balance, 
    setBalance, 
    isKeyValid, 
    setIsKeyValid,
    cart 
  } = useAppStore()
  
  const [keyInput, setKeyInput] = useState(userKey)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (userKey && !isKeyValid) {
      checkBalance(userKey)
    }
  }, [])

  const checkBalance = async (key: string) => {
    if (!key.trim()) {
      toast.error("Chave invalida", {
        description: "Por favor, insira uma chave valida",
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const data = await getBalance(key)
      
      if (!data.ativa) {
        toast.error("Chave inativa", {
          description: "Esta chave nao esta mais ativa ou ja foi utilizada",
        })
        setIsKeyValid(false)
        setBalance(null)
        return
      }
      
      setBalance(data.saldo)
      setIsKeyValid(true)
      setUserKey(key)
      toast.success("Chave validada com sucesso!", {
        description: `Saldo disponivel: ${new Intl.NumberFormat("pt-BR").format(data.saldo)} coins`,
      })
    } catch (err) {
      toast.error("Chave invalida", {
        description: "A chave informada nao existe ou esta incorreta. Verifique e tente novamente.",
      })
      setIsKeyValid(false)
      setBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setUserKey("")
    setBalance(null)
    setIsKeyValid(false)
    setKeyInput("")
  }

  const formatBalance = (bal: number) => {
    return new Intl.NumberFormat("pt-BR").format(bal)
  }

  const cartTotal = cart.reduce((total, item) => total + item.preco, 0)

  const showPlaceholder = !keyInput && !isFocused

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <img 
                src="/logo.jpeg" 
                alt="AVKNGIFTS Logo" 
                className="h-10 w-10 rounded-xl object-cover shadow-lg"
              />
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text hidden sm:block">AVKNGIFTS</span>
          </div>

          {/* Center - Key Input and Balance */}
          <div className="flex-1 max-w-md">
            {isKeyValid && balance !== null ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-bold text-foreground text-lg">{formatBalance(balance)}</span>
                  <span className="text-xs text-muted-foreground">coins</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 overflow-hidden">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 shrink-0" />
                  
                  {/* Animated placeholder */}
                  {showPlaceholder && (
                    <div 
                      className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden z-0"
                      style={{ width: 'calc(100% - 3rem)' }}
                    >
                      <span className="inline-block text-muted-foreground text-base font-mono whitespace-nowrap animate-marquee">
                        Insira sua chave para verificar o saldo...
                      </span>
                    </div>
                  )}
                  
                  <Input
                    ref={inputRef}
                    placeholder=""
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="pl-10 pr-4 h-10 bg-secondary/50 border-border/50 font-mono tracking-wider text-base"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        checkBalance(keyInput)
                      }
                    }}
                  />
                </div>
                <Button 
                  onClick={() => checkBalance(keyInput)} 
                  disabled={isLoading || !keyInput.trim()}
                  size="sm"
                  className="h-10 px-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verificar"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right side - Cart */}
          <div className="shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="relative gap-2 bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5"
              onClick={onOpenCart}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">
                {formatBalance(cartTotal)}
              </span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
