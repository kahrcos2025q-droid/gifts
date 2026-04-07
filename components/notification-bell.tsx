"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Smartphone, Share, Plus, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// Detectar se é iOS/Safari
const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

const isSafari = () => {
  if (typeof window === "undefined") return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

const isPWA = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
}

interface NotificationBellProps {
  variant?: "mobile" | "desktop" | "tab"
}

export function NotificationBell({ variant = "desktop" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Verificar se já está inscrito
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")
        return registration
      } catch (error) {
        console.error("Erro ao registrar Service Worker:", error)
        throw error
      }
    }
    throw new Error("Service Worker não suportado")
  }

  const subscribeToPush = async () => {
    setIsLoading(true)
    try {
      // Verificar se é iOS/Safari sem ser PWA
      if ((isIOS() || isSafari()) && !isPWA()) {
        setShowIOSTutorial(true)
        setIsLoading(false)
        return
      }

      // Pedir permissão
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber atualizações.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Registrar Service Worker
      const registration = await registerServiceWorker()

      // Criar subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID key não configurada")
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Enviar para o servidor
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar subscription")
      }

      setIsSubscribed(true)
      setIsOpen(false)
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá atualizações sobre novidades do site.",
      })
    } catch (error) {
      console.error("Erro ao ativar notificações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível ativar as notificações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remover do servidor
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais atualizações.",
      })
    } catch (error) {
      console.error("Erro ao desativar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Converter VAPID key para Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const buttonContent = (
    <>
      {isSubscribed ? (
        <BellRing className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {variant === "mobile" && (
        <span className="ml-2">Notificações</span>
      )}
    </>
  )

  // Não renderizar até o componente estar montado (evitar hydration mismatch)
  if (!isMounted) {
    if (variant === "tab") {
      return (
        <button className="relative p-2" disabled>
          <Bell className="h-5 w-5 text-primary" />
        </button>
      )
    }
    return variant === "mobile" ? (
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-secondary/10"
        disabled
      >
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">Ativar Notificações</p>
          <p className="text-xs text-muted-foreground">Receba novidades do site</p>
        </div>
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <>
      {variant === "tab" ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 transition-transform hover:scale-110"
          aria-label="Notificações"
        >
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-green-500" />
          ) : (
            <Bell className="h-5 w-5 text-primary" />
          )}
          {!isSubscribed && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      ) : variant === "mobile" ? (
        <Button
          variant="ghost"
          onClick={() => setIsOpen(true)}
          className="w-full justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-secondary/10"
        >
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isSubscribed ? 'bg-green-500/10' : 'bg-primary/10'}`}>
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-green-500" />
            ) : (
              <Bell className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">{isSubscribed ? "Notificações Ativas" : "Ativar Notificações"}</p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? "Você receberá atualizações" : "Receba novidades do site"}
            </p>
          </div>
          {!isSubscribed && (
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="relative h-9 w-9 rounded-full"
        >
          {isSubscribed ? (
            <BellRing className="h-4 w-4 text-green-500" />
          ) : (
            <>
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </DialogTitle>
            <DialogDescription>
              {isSubscribed 
                ? "Você está recebendo notificações de atualizações."
                : "Receba notificações sobre novidades e atualizações do site."
              }
            </DialogDescription>
          </DialogHeader>

          {showIOSTutorial ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-3 font-semibold text-sm">Como ativar no Safari/iOS:</h4>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                    <span>Toque no botão <Share className="inline h-4 w-4 mx-1" /> Compartilhar na barra do Safari</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    <span>Role para baixo e toque em <Plus className="inline h-4 w-4 mx-1" /> "Adicionar à Tela de Início"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                    <span>Toque em "Adicionar" no canto superior direito</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                    <span>Abra o app da tela inicial e ative as notificações</span>
                  </li>
                </ol>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <Smartphone className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  O Safari só permite notificações em apps instalados na tela inicial.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowIOSTutorial(false)}
              >
                Entendi
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isSubscribed ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Notificações ativas</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Você será notificado sobre novidades.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fique por dentro</p>
                    <p className="text-xs text-muted-foreground">Novos itens, promoções e atualizações.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isSubscribed ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={unsubscribeFromPush}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Desativar notificações
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={subscribeToPush}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    Ativar notificações
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
