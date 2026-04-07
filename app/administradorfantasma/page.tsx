"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Users, 
  Bell, 
  Send, 
  Eye, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Lock,
  Unlock,
  History,
  Smartphone,
  Globe,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const ADMIN_KEY = "i20v20a20d20@2026avkn"

interface Metrics {
  online: number
  totalVisitors: number
  todayVisitors: number
  subscribers: number
}

interface Subscriber {
  id: string
  user_agent: string
  created_at: string
  last_active: string
}

interface NotificationHistoryItem {
  id: string
  title: string
  body: string
  sent_at: string
  sent_to_count: number
}

interface Visitor {
  id: string
  visitor_id: string
  first_visit: string
  last_visit: string
  visit_count: number
  user_agent: string
  is_online: boolean
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [keyInput, setKeyInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [metrics, setMetrics] = useState<Metrics>({ online: 0, totalVisitors: 0, todayVisitors: 0, subscribers: 0 })
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([])
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([])
  
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")

  const fetchMetrics = useCallback(async () => {
    if (!isAuthenticated) return
    
    setRefreshing(true)
    try {
      const res = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: ADMIN_KEY })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.metrics)
        setSubscribers(data.subscribers || [])
        setNotificationHistory(data.notificationHistory || [])
        setRecentVisitors(data.recentVisitors || [])
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    } finally {
      setRefreshing(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics()
      const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchMetrics])

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      if (keyInput === ADMIN_KEY) {
        setIsAuthenticated(true)
        toast.success("Acesso autorizado")
      } else {
        toast.error("Chave incorreta")
      }
      setLoading(false)
    }, 500)
  }

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast.error("Preencha o titulo e a mensagem")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/admin/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey: ADMIN_KEY,
          title: notificationTitle,
          body: notificationBody
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(`Notificacao enviada para ${data.sent} de ${data.total} usuarios`)
        setNotificationTitle("")
        setNotificationBody("")
        fetchMetrics()
      } else {
        toast.error(data.error || "Erro ao enviar notificacao")
      }
    } catch (error) {
      toast.error("Erro ao enviar notificacao")
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getDeviceIcon = (userAgent: string) => {
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
      return <Smartphone className="h-4 w-4" />
    }
    return <Globe className="h-4 w-4" />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Painel de Administracao</CardTitle>
            <CardDescription>Insira a chave de acesso para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="Chave de acesso"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <Button onClick={handleLogin} disabled={loading} className="w-full">
                {loading ? "Verificando..." : "Entrar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Unlock className="h-8 w-8 text-primary" />
              Painel de Administracao
            </h1>
            <p className="text-muted-foreground">Gerencie notificacoes e monitore metricas do site</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchMetrics} 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{metrics.online}</div>
              <p className="text-xs text-muted-foreground">usuarios ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitantes Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{metrics.todayVisitors}</div>
              <p className="text-xs text-muted-foreground">desde meia-noite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Visitantes</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{metrics.totalVisitors}</div>
              <p className="text-xs text-muted-foreground">desde o inicio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscritos</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{metrics.subscribers}</div>
              <p className="text-xs text-muted-foreground">recebem notificacoes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Send Notification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Notificacao
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para todos os {metrics.subscribers} usuarios inscritos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Titulo</label>
                <Input
                  placeholder="Titulo da notificacao"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mensagem</label>
                <Textarea
                  placeholder="Escreva sua mensagem aqui..."
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleSendNotification} 
                disabled={sending || !notificationTitle.trim() || !notificationBody.trim()}
                className="w-full"
              >
                {sending ? "Enviando..." : `Enviar para ${metrics.subscribers} usuarios`}
              </Button>
            </CardContent>
          </Card>

          {/* Notification History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historico de Notificacoes
              </CardTitle>
              <CardDescription>Ultimas notificacoes enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notificationHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma notificacao enviada ainda
                  </p>
                ) : (
                  notificationHistory.map((notification) => (
                    <div key={notification.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{notification.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {notification.sent_to_count} enviados
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(notification.sent_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subscribers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Inscritos ({subscribers.length})
              </CardTitle>
              <CardDescription>Usuarios que aceitaram notificacoes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {subscribers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuario inscrito ainda
                  </p>
                ) : (
                  subscribers.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(sub.user_agent || "")}
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Inscrito em {formatDate(sub.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Ativo
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Visitors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visitantes Recentes
              </CardTitle>
              <CardDescription>Ultimos 50 visitantes do site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentVisitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum visitante registrado ainda
                  </p>
                ) : (
                  recentVisitors.map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(visitor.user_agent || "")}
                        <div>
                          <p className="text-xs font-mono">{visitor.visitor_id.substring(0, 12)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {visitor.visit_count} visitas
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={visitor.is_online ? "default" : "secondary"} 
                        className={visitor.is_online ? "bg-green-500" : ""}
                      >
                        {visitor.is_online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
