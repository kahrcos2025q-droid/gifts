"use client"

import { useState, useEffect } from "react"
import { Bell, X, Loader2, Share, Plus, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verifica se deve mostrar o prompt
    const checkNotificationStatus = async () => {
      // Não mostrar se o usuário já dispensou o prompt hoje
      const dismissedAt = localStorage.getItem("notification-prompt-dismissed")
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt)
        const now = new Date()
        // Mostrar novamente depois de 24 horas
        if (now.getTime() - dismissedDate.getTime() < 24 * 60 * 60 * 1000) {
          return
        }
      }

      // Verificar se já está inscrito (só se suportar service worker)
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          if (registrations.length > 0) {
            const subscription = await registrations[0].pushManager.getSubscription()
            if (subscription) {
              // Já tem subscription ativa, não mostrar
              return
            }
          }
        } catch {
          // Se der erro, mostra o prompt mesmo assim
        }
      }

      // Aguarda 3 segundos antes de mostrar
      setTimeout(() => {
        setIsVisible(true)
      }, 3000)
    }

    checkNotificationStatus()
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("notification-prompt-dismissed", new Date().toISOString())
  }

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

  const handleActivate = async () => {
    // Verificar se é iOS/Safari sem ser PWA - mostrar tutorial
    if ((isIOS() || isSafari()) && !isPWA()) {
      setShowIOSTutorial(true)
      return
    }

    // Verificar se o navegador suporta notificações push
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // Navegador não suporta, mostrar tutorial iOS como fallback
      setShowIOSTutorial(true)
      return
    }

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Permissao negada",
          description: "Voce precisa permitir notificacoes para receber atualizacoes.",
          variant: "destructive",
        })
        handleDismiss()
        return
      }

      const registration = await registerServiceWorker()
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidPublicKey) {
        throw new Error("VAPID key nao configurada")
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

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

      setIsVisible(false)
      localStorage.removeItem("notification-prompt-dismissed")
      toast({
        title: "Notificacoes ativadas!",
        description: "Voce recebera atualizacoes sobre novos itens.",
      })
    } catch (error) {
      console.error("Erro ao ativar notificacoes:", error)
      toast({
        title: "Erro",
        description: "Nao foi possivel ativar as notificacoes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  if (showIOSTutorial) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-sm">Instalar como App</span>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-xs text-muted-foreground mb-3">
            <p className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              Toque em <Share className="inline h-3.5 w-3.5 mx-0.5" /> Compartilhar
            </p>
            <p className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
              <Plus className="inline h-3.5 w-3.5 mx-0.5" /> Adicionar a Tela de Inicio
            </p>
            <p className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
              Abra o app e ative as notificacoes
            </p>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={handleDismiss}>
            Entendi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-auto max-w-md rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">Ative as notificacoes</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seja notificado quando novos itens forem lancados no site!
            </p>
          </div>

          <button onClick={handleDismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            Agora nao
          </Button>
          <Button size="sm" className="flex-1" onClick={handleActivate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ativar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
