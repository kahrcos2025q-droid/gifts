"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Key, Wallet, ShoppingCart, Loader2, X, User, Check, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"
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
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/80 glow-primary transition-all duration-300">
        {/* ==================== MOBILE HEADER (md:hidden) ==================== */}
        <div className="md:hidden container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 min-w-0">
            {/* Logo with animated glow */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 animate-pulse-glow" />
                <img 
                  src="/logo.png" 
                  alt="AVKNGIFTS Logo" 
                  className="relative h-8 w-8 rounded-xl object-cover ring-2 ring-primary/50"
                />
              </div>
            </div>

            {/* Center - Key Input and Balance (Mobile) */}
            <div className="flex-1 flex items-center gap-2 max-w-2xl min-w-0 overflow-hidden">
              <div className="flex-1 min-w-0 overflow-hidden">
                {isKeyValid && balance !== null ? (
                  <div className="relative group overflow-visible">
                    <div className="relative flex items-center gap-2 px-2 py-2 rounded-2xl glass border-2 border-primary/30 min-w-0 overflow-hidden">
                      <Wallet className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="font-black text-sm gradient-text block truncate">{formatBalance(balance)}</span>
                        <span className="text-[8px] text-muted-foreground uppercase tracking-widest truncate block">{keyCurrency.current} disponíveis</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/20 rounded-xl"
                        onClick={handleLogout}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="relative flex items-center gap-2 glass rounded-2xl p-1">
                      <div className="relative flex-1 overflow-hidden">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2">
                          <Key className="h-4 w-4 text-primary" />
                        </div>
                        {showPlaceholder && (
                          <div 
                            className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden z-0"
                            style={{ width: 'calc(100% - 4rem)' }}
                          >
                            <span className="inline-block gradient-text font-sans font-semibold text-xs tracking-tight truncate">
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
                          className="pl-12 pr-2 h-10 bg-transparent border-0 font-mono tracking-wider text-xs focus-visible:ring-0"
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
                        className="h-8 w-8 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-primary-foreground shrink-0 shadow-sm p-0 flex items-center justify-center"
                        title={keyInput.trim() ? "Confirmar chave" : "Colar chave"}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : keyInput.trim() ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                          </svg>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Theme Toggle + Cart (Mobile) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                className="relative gap-1.5 h-10 px-2.5 rounded-xl glass border border-primary/30 group bg-transparent overflow-hidden"
                onClick={onOpenCart}
              >
                <div className="relative shrink-0">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                      {cart.length}
                    </span>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* ==================== DESKTOP HEADER (hidden md:block) ==================== */}
        <div className="hidden md:block container mx-auto px-6 lg:px-12 max-w-[1920px]">
          <div className="flex h-20 items-center justify-between gap-6">
            {/* Left: Brand Identity & Currency */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src="/logo.png" 
                    alt="AVKNGIFTS Logo" 
                    className="relative h-11 w-11 rounded-2xl object-cover ring-2 ring-primary/40 shadow-lg group-hover:scale-105 transition-transform"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-2xl tracking-tight gradient-text">AVKNGIFTS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-widest">
                      v2.0
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium tracking-wide">Plataforma Oficial de Presentes</span>
                </div>
              </div>
            </div>

            {/* Center-Right: Controls, Keys & Friend Code */}
            <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
              {/* Friend Code Widget (Desktop) */}
              <div className="shrink-0">
                {friendCode ? (
                  <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-2xl bg-accent/10 border border-accent/25 hover:border-accent/40 transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block leading-none">
                          Destinatário
                        </span>
                        <span className="font-mono text-sm font-black text-accent leading-tight">
                          {friendCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-accent/20">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-accent hover:text-accent hover:bg-accent/20 rounded-lg relative"
                        onClick={() => router.push('/sent-items')}
                        title="Ver histórico de presentes enviados"
                      >
                        <History className="h-3.5 w-3.5" />
                        {blockedItems.length > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-1 text-[8px] flex items-center justify-center bg-accent text-accent-foreground border-background border">
                            {blockedItems.length}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={handleClearFriendCode}
                        title="Remover código de amigo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-1 pl-3 rounded-2xl glass border border-border/40 hover:border-accent/40 transition-colors">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Cód. Amigo"
                      value={friendCodeInput}
                      onChange={(e) => handleFriendCodeChange(e.target.value)}
                      className="h-8 w-44 bg-transparent border-0 font-mono text-xs font-semibold focus-visible:ring-0 px-1"
                      maxLength={7}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSetFriendCode()
                      }}
                    />
                    <Button 
                      onClick={handleSetFriendCode} 
                      disabled={isLoadingFriend || !friendCodeInput.trim()}
                      size="sm"
                      className="h-8 px-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-xs"
                    >
                      {isLoadingFriend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Definir"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Key Widget (Desktop) */}
              <div className="shrink-0">
                {isKeyValid && balance !== null ? (
                  <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-2xl glass border-2 border-primary/40 bg-card/60 shadow-md">
                    <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block leading-none">
                        Saldo ({currency})
                      </span>
                      <span className="font-black text-base gradient-text leading-tight block">
                        {formatBalance(balance)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg"
                      onClick={handleLogout}
                      title="Desconectar chave"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-1 pl-3 rounded-2xl glass border border-border/40 hover:border-primary/40 transition-colors w-72">
                    <Key className="h-4 w-4 text-primary shrink-0" />
                    <Input
                      ref={inputRef}
                      placeholder="Insira sua chave..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(sanitizeKey(e.target.value))}
                      className="h-8 bg-transparent border-0 font-mono text-xs font-semibold focus-visible:ring-0 px-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") checkBalance(keyInput)
                      }}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePasteKey}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                        title="Colar da área de transferência"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        </svg>
                      </Button>
                      <Button 
                        onClick={() => checkBalance(keyInput)} 
                        disabled={isLoading || !keyInput.trim()}
                        size="sm"
                        className="h-8 px-3 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold text-xs"
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Validar"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Utility Icons (Desktop) */}
              <div className="flex items-center gap-2 pl-2 border-l border-border/30">
                <NotificationBell variant="desktop" />
                <ThemeToggle />
              </div>

              {/* Cart Button (Desktop) */}
              <Button 
                variant="default" 
                className="relative gap-3 h-12 px-5 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-95 text-primary-foreground shadow-lg shadow-primary/20 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                onClick={onOpenCart}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2.5 h-5 w-5 rounded-full bg-background text-foreground border-2 border-primary flex items-center justify-center text-[10px] font-black">
                      {cart.length}
                    </span>
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="text-[10px] text-primary-foreground/80 uppercase tracking-widest block leading-none">Meu Carrinho</span>
                  <span className="text-sm font-black leading-tight block">{formatBalance(cartTotal)} {currency}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
