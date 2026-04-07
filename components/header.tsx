"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Key, Wallet, ShoppingCart, Loader2, X, User, Check, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAppStore } from "@/lib/store"
import { getBalance } from "@/lib/api"
import { getUserItems } from "@/lib/supabase"
import { toast } from "sonner"

interface HeaderProps {
  onOpenCart: () => void
}

export function Header({ onOpenCart }: HeaderProps) {
  const router = useRouter()
  const {
    keyCrowns,
    setKeyCrowns,
    friendCode,
    setFriendCode,
    cartItems,
    blockedItems,
    userKey,
    setUserKey,
    balance,
    setBalance,
    isKeyValid,
    setIsKeyValid,
    currency,
    setCurrency,
    setKeyCurrency,
    cart,
    clearCart,
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
  const keyCurrency = useRef<string | null>(null) // Declare keyCurrency variable
  
  // Sanitize key input - only allow letters, numbers and hyphens
  const sanitizeKey = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  }
  
  // Handle paste from clipboard
  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const sanitized = sanitizeKey(text)
      setKeyInput(sanitized)
      inputRef.current?.focus()
    } catch (err) {
      toast.error("Erro ao colar", {
        description: "Permissão negada para acessar a área de transferência",
      })
    }
  }

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
      
      // Detect and set currency from key
      const detectedCurrency = data.currency || (key.startsWith('CROWNS-') ? 'crowns' : 'avacoins')
      
      // If currency changed, clear cart
      if (keyCurrency.current && keyCurrency.current !== detectedCurrency) {
        clearCart()
      }
      
      setCurrency(detectedCurrency)
      keyCurrency.current = detectedCurrency // Save the currency of the validated key
      
      setBalance(data.saldo)
      setIsKeyValid(true)
      setUserKey(key)
      // Success - no toast, just update the UI silently
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
      // Success - no toast, just update the UI silently
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
    setKeyCurrency(null)
    clearCart()
  }

  const formatBalance = (bal: number) => {
    return new Intl.NumberFormat("pt-BR").format(bal)
  }

  const cartTotal = cart.reduce((total, item) => total + item.preco, 0)

  const showPlaceholder = !keyInput && !isFocused

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/20 glass glow-primary overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 min-w-0">
          {/* Logo with animated glow */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 animate-pulse-glow" />
              <img 
                src="/logo.png" 
                alt="AVKNGIFTS Logo" 
                className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover ring-2 ring-primary/50"
              />
            </div>
            <div className="hidden md:block">
              <span className="font-black text-xl tracking-tighter gradient-text block">AVKNGIFTS</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Gifts Platform</span>
            </div>
          </div>

          {/* Center - Key Input and Balance */}
          <div className="flex-1 flex items-center gap-2 max-w-2xl min-w-0 overflow-hidden">
            {/* Key Section */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {isKeyValid && balance !== null ? (
                <div className="relative group overflow-visible">
                  {/* Main balance display */}
                  <div className="relative flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-2xl glass border-2 border-primary/30 min-w-0 overflow-hidden">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <span className="font-black text-base sm:text-xl gradient-text block truncate">{formatBalance(balance)}</span>
                      <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-widest truncate block">{keyCurrency.current} disponíveis</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/20 rounded-xl"
                      onClick={handleLogout}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  {/* Elegant extending bar below */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-4/5 h-3 -mt-1 z-[-1]">
                    <div className="w-full h-full bg-gradient-to-b from-primary/30 via-accent/20 to-transparent rounded-b-2xl blur-sm" />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2/3 h-4 mt-1 z-[-1]">
                    <div className="w-full h-full bg-gradient-to-b from-primary/20 via-accent/10 to-transparent rounded-b-3xl blur-md" />
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2 glass rounded-2xl p-1">
                    <div className="relative flex-1 overflow-hidden">
                      {/* Key Icon */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      
                      {showPlaceholder && (
                        <div 
                          className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden z-0"
                          style={{ width: 'calc(100% - 4.5rem)' }}
                        >
                          <span 
                            className="inline-block gradient-text font-sans font-semibold tracking-tighter whitespace-nowrap"
                            style={{ fontSize: 'clamp(0.625rem, 3vw, 0.875rem)' }}
                          >
                            Insira sua chave
                          </span>
                        </div>
                      )}
                      
                      <Input
                        ref={inputRef}
                        placeholder=""
                        value={keyInput}
                        onChange={(e) => setKeyInput(sanitizeKey(e.target.value))}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="pl-14 pr-3 h-12 bg-transparent border-0 font-mono tracking-widest text-base focus-visible:ring-0"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            checkBalance(keyInput)
                          }
                        }}
                      />
                    </div>
                    <Button 
                      onClick={keyInput.trim() ? () => checkBalance(keyInput) : handlePasteKey} 
                      disabled={isLoading}
                      size="sm"
                      className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-primary-foreground shrink-0 shadow-lg"
                      title={keyInput.trim() ? "Confirmar chave" : "Colar chave"}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : keyInput.trim() ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Friend Code Section - Desktop */}
            <div className="hidden sm:flex items-center gap-1.5 min-w-0">
              {friendCode ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg relative"
                    onClick={() => router.push('/sent-items')}
                    title="Ver itens enviados"
                  >
                    <History className="h-4 w-4" />
                    {blockedItems.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground border-background border-2">
                        {blockedItems.length}
                      </Badge>
                    )}
                  </Button>
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              className="relative gap-2 sm:gap-3 h-10 sm:h-12 px-2 sm:px-4 rounded-2xl glass border-2 border-primary/30 hover:border-primary/50 group bg-transparent max-w-[120px] sm:max-w-[200px] overflow-hidden"
              onClick={onOpenCart}
            >
              <div className="relative shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-primary-foreground animate-pulse-glow">
                    {cart.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-black gradient-text truncate min-w-0 text-sm">
                {formatBalance(cartTotal)}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}
