"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Bell, BellRing, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceScreenProps {
  onRetry?: () => void
}

// Data alvo: 1 de maio de 2026 às 00:00:00
const TARGET_DATE = new Date("2026-05-01T00:00:00")

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  return registration
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isSafari(): boolean {
  if (typeof window === "undefined") return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function isPWA(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || 
         (window.navigator as any).standalone === true
}

export function MaintenanceScreen({ onRetry }: MaintenanceScreenProps) {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)

  // Contagem regressiva
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = TARGET_DATE.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [])

  // Verificar se já está inscrito
  useEffect(() => {
    const checkSubscription = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          if (registrations.length > 0) {
            const subscription = await registrations[0].pushManager.getSubscription()
            setIsSubscribed(!!subscription)
          }
        } catch {
          // Ignore
        }
      }
    }
    checkSubscription()
  }, [])

  const handleActivateNotifications = async () => {
    // iOS/Safari sem PWA - mostrar tutorial
    if ((isIOS() || isSafari()) && !isPWA()) {
      setShowIOSTutorial(true)
      return
    }

    // Navegador não suporta
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setShowIOSTutorial(true)
      return
    }

    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para ser avisado.",
          variant: "destructive",
        })
        return
      }

      const registration = await registerServiceWorker()
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error("VAPID key não configurada")
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

      setIsSubscribed(true)
      toast({
        title: "Notificações ativadas!",
        description: "Você será notificado quando o sistema voltar.",
      })
    } catch (error) {
      console.error("Erro ao ativar notificações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível ativar as notificações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative rounded-full glass border-2 border-primary/30 p-6">
              <AlertTriangle className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">
            Sistema <span className="gradient-text">Offline</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Tivemos alguns imprevistos e o sistema ficará offline até o dia 1 de Maio. Pedimos desculpas pelo transtorno.
          </p>
        </div>

        {/* Countdown */}
        <div className="rounded-2xl border-2 border-primary/20 glass p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Previsão de retorno: 1 de Maio</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-background/50 rounded-xl p-3 border border-border/30">
              <div className="text-2xl sm:text-3xl font-black text-primary">{timeLeft.days}</div>
              <div className="text-xs text-muted-foreground">Dias</div>
            </div>
            <div className="bg-background/50 rounded-xl p-3 border border-border/30">
              <div className="text-2xl sm:text-3xl font-black text-primary">{timeLeft.hours.toString().padStart(2, '0')}</div>
              <div className="text-xs text-muted-foreground">Horas</div>
            </div>
            <div className="bg-background/50 rounded-xl p-3 border border-border/30">
              <div className="text-2xl sm:text-3xl font-black text-primary">{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <div className="text-xs text-muted-foreground">Min</div>
            </div>
            <div className="bg-background/50 rounded-xl p-3 border border-border/30">
              <div className="text-2xl sm:text-3xl font-black text-primary">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-muted-foreground">Seg</div>
            </div>
          </div>
        </div>

        {/* Notification Card */}
        <div className="rounded-2xl border-2 border-border/20 glass p-5 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Seja notificado quando voltar</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ative as notificações para ser avisado assim que o sistema estiver funcionando novamente.
          </p>
          
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-500">
              <BellRing className="h-5 w-5" />
              <span className="font-medium">Notificações ativadas!</span>
            </div>
          ) : (
            <Button
              onClick={handleActivateNotifications}
              disabled={isLoading}
              className="rounded-xl font-bold gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? "Ativando..." : "Ativar Notificações"}
            </Button>
          )}
        </div>

        {/* iOS Tutorial Modal */}
        {showIOSTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl p-6 max-w-md w-full border border-border">
              <h3 className="text-lg font-bold mb-4">Como ativar notificações no iOS/Safari</h3>
              <div className="space-y-4 text-left text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</div>
                  <p>Toque no botão de compartilhar (ícone de quadrado com seta para cima)</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">2</div>
                  <p>Role para baixo e toque em &quot;Adicionar à Tela de Início&quot;</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">3</div>
                  <p>Toque em &quot;Adicionar&quot; no canto superior direito</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">4</div>
                  <p>Abra o app pela tela inicial e ative as notificações</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowIOSTutorial(false)} 
                className="w-full mt-6 rounded-xl"
              >
                Entendi
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60 mt-8">
          Obrigado pela compreensão
        </p>
      </div>
    </div>
  )
}
