"use client"

import { useState, useEffect, useRef } from "react"
import { Key, Wallet, ShoppingCart, Loader2, X, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAppStore } from "@/lib/store"
import { getBalance } from "@/lib/api"
import { getUserItems } from "@/lib/supabase"
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
    cart,
    friendCode,
    setFriendCode,
    setBlockedItems,
  } = useAppStore()
  
  const [keyInput, setKeyInput] = useState("")
  const [friendCodeInput, setFriendCodeInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFriend, setIsLoadingFriend] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasCheckedKey = useRef(false)
  const hasLoadedFriendCode = useRef(false)

  // Load saved key and verify on mount
  useEffect(() => {
    if (userKey && !hasCheckedKey.current) {
      hasCheckedKey.current = true
      setKeyInput(userKey)
      checkBalance(userKey)
    }
  }, [userKey])

  // Load saved friend code and fetch blocked items
  useEffect(() => {
    if (friendCode && !hasLoadedFriendCode.current) {
      hasLoadedFriendCode.current = true
      setFriendCodeInput(friendCode)
      loadBlockedItems(friendCode)
    }
  }, [friendCode])

  const loadBlockedItems = async (code: string) => {
    try {
      const items = await getUserItems(code)
      setBlockedItems(items.map(i => ({ item_id: i.item_id, status: i.status })))
    } catch (err) {
      console.error("[v0] Error loading blocked items:", err)
    }
  }

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
        description: `Saldo disponivel: ${new Intl.NumberFormat("pt-BR").format(data.saldo)} avacoins`,
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

  const handleSetFriendCode = async () => {
    const code = friendCodeInput.trim().toUpperCase()
    
    if (!code) {
      toast.error("Codigo invalido", {
        description: "Por favor, insira um codigo de amigo valido",
      })
      return
    }
    
    setIsLoadingFriend(true)
    
    try {
      const items = await getUserItems(code)
      setBlockedItems(items.map(i => ({ item_id: i.item_id, status: i.status })))
      setFriendCode(code)
      toast.success("Codigo de amigo definido!", {
        description: items.length > 0 
          ? `${items.length} item(ns) ja marcado(s) para esta conta` 
          : "Pronto para enviar presentes",
      })
    } catch (err) {
      console.error('[v0] Error in handleSetFriendCode:', err)
      toast.error("Erro ao verificar codigo", {
        description: "Tente novamente",
      })
    } finally {
      setIsLoadingFriend(false)
    }
  }

  const formatFriendCode = (value: string) => {
    // Remove tudo que não é letra ou número
    const cleaned = value.replace(/[^A-Z0-9]/g, '')
    
    // Limita a 6 caracteres
    const limited = cleaned.slice(0, 6)
    
    // Adiciona o hífen após 3 caracteres
    if (limited.length > 3) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`
    }
    
    return limited
  }

  const handleFriendCodeChange = (value: string) => {
    const formatted = formatFriendCode(value.toUpperCase())
    setFriendCodeInput(formatted)
  }

  const handleClearFriendCode = () => {
    setFriendCode("")
    setFriendCodeInput("")
    setBlockedItems([])
    hasLoadedFriendCode.current = false
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
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img 
              src="/logo.jpeg" 
              alt="AVKNGIFTS Logo" 
              className="h-9 w-9 rounded-xl object-cover shadow-lg"
            />
            <span className="font-bold text-lg tracking-tight gradient-text hidden md:block">AVKNGIFTS</span>
          </div>

          {/* Center - Key Input and Balance */}
          <div className="flex-1 flex items-center gap-2 max-w-2xl">
            {/* Key Section */}
            <div className="flex-1 min-w-0">
              {isKeyValid && balance !== null ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <Wallet className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-bold text-foreground text-sm sm:text-base">{formatBalance(balance)}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">avacoins</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
                    onClick={handleLogout}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 overflow-hidden">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 shrink-0" />
                    
                    {showPlaceholder && (
                      <div 
                        className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden z-0"
                        style={{ width: 'calc(100% - 3rem)' }}
                      >
                        <span className="inline-block text-muted-foreground text-sm font-mono whitespace-nowrap animate-marquee">
                          Insira sua chave...
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
                      className="pl-10 pr-3 h-10 bg-secondary/50 border-border/50 font-mono tracking-wider text-base"
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
                    className="h-10 px-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Friend Code Section - Desktop */}
            <div className="hidden sm:flex items-center gap-1.5 min-w-0">
              {friendCode ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                  <User className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="font-mono text-xs font-semibold text-accent">{friendCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearFriendCode}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="relative group">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                    <Input
                      placeholder="Amigo"
                      value={friendCodeInput}
                      onChange={(e) => handleFriendCodeChange(e.target.value)}
                      className="pl-8 pr-2 h-8 w-28 bg-secondary/30 border-border/30 focus:border-accent/50 font-mono text-xs"
                      maxLength={7}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSetFriendCode()
                        }
                      }}
                    />
                  </div>
                  <Button 
                    onClick={handleSetFriendCode} 
                    disabled={isLoadingFriend || !friendCodeInput.trim()}
                    size="sm"
                    className="h-8 px-2.5 bg-accent/80 hover:bg-accent text-accent-foreground shrink-0"
                  >
                    {isLoadingFriend ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Theme Toggle + Cart */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
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

        {/* Mobile Friend Code Row - REMOVED */}
        {/* Friend code input moved to a modal/sheet in the page */}
      </div>
    </header>
  )
}
