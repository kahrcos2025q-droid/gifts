"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, X, Smartphone, Plus, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"

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

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (window.navigator as any).standalone === true || 
    window.matchMedia("(display-mode: standalone)").matches
}

interface NotificationBellProps {
  size?: "sm" | "md"
}

export function NotificationBell({ size = "md" }: NotificationBellProps) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error("Check subscription error:", error)
    }
  }

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js")
        return await navigator.serviceWorker.ready
      } catch (error) {
        console.error("SW registration failed:", error)
        throw error
      }
    }
    throw new Error("Service Worker not supported")
  }

  const subscribe = async () => {
    setLoading(true)
    try {
      const registration = await registerServiceWorker()
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      })

      setIsSubscribed(true)
      setShowModal(false)
    } catch (error) {
      console.error("Subscribe error:", error)
      // If permission denied or not available, show iOS tutorial
      if (isIOS() || isSafari()) {
        setShowIOSTutorial(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBellClick = () => {
    if (isSubscribed) {
      return // Already subscribed
    }
    
    if ((isIOS() || isSafari()) && !isStandalone()) {
      setShowIOSTutorial(true)
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleBellClick}
        className={`relative flex items-center justify-center rounded-xl transition-all duration-200 ${
          size === "sm" ? "h-8 w-8" : "h-9 w-9"
        } ${
          isSubscribed 
            ? "bg-primary/20 text-primary" 
            : "bg-card hover:bg-primary/10 text-muted-foreground hover:text-primary"
        }`}
        title={isSubscribed ? "Notificações ativadas" : "Ativar notificações"}
      >
        {isSubscribed ? (
          <BellRing className={size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} />
        ) : (
          <Bell className={size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} />
        )}
        {!isSubscribed && (
          <span className={`absolute flex ${size === "sm" ? "-right-0.5 -top-0.5 h-2.5 w-2.5" : "-right-1 -top-1 h-3 w-3"}`}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className={`relative inline-flex rounded-full bg-primary ${size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
          </span>
        )}
      </button>

      {/* Standard notification permission modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Ativar Notificações
            </DialogTitle>
            <DialogDescription>
              Receba atualizações sobre novos itens, promoções e novidades do Avakin Gifts!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
              <BellRing className="h-6 w-6 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Fique por dentro</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seja notificado quando novos itens forem adicionados ou quando houver atualizações importantes.
                </p>
              </div>
            </div>
            <Button 
              onClick={subscribe} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Ativando..." : "Ativar Notificações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* iOS/Safari tutorial modal */}
      <Dialog open={showIOSTutorial} onOpenChange={setShowIOSTutorial}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Adicionar na Tela Inicial
            </DialogTitle>
            <DialogDescription>
              Para receber notificações no Safari/iOS, você precisa adicionar o site na tela inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Toque no botão Compartilhar</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    Procure pelo ícone <Share className="h-4 w-4 inline" /> na barra de navegação
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Adicionar à Tela de Início</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    Role para baixo e toque em <Plus className="h-4 w-4 inline" /> Adicionar à Tela de Início
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Abra o app e ative</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após adicionar, abra o Avakin Gifts da tela inicial e toque no sininho novamente.
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowIOSTutorial(false)}
              className="w-full"
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
