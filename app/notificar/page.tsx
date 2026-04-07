"use client"

import { useState, useEffect } from "react"
import { Bell, Send, Users, Loader2, Lock, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const ADMIN_KEY = "i20v20a20d20@avkngifts"

interface Subscription {
  id: string
  endpoint: string
  user_agent: string
  created_at: string
}

export default function NotificarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [url, setUrl] = useState("")
  const { toast } = useToast()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (accessKey === ADMIN_KEY) {
      setIsAuthenticated(true)
      loadSubscriptions()
    } else {
      toast({
        title: "Chave inválida",
        description: "A chave de acesso está incorreta.",
        variant: "destructive",
      })
    }
  }

  const loadSubscriptions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/send", {
        method: "GET",
        headers: {
          "x-admin-key": ADMIN_KEY,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error("Erro ao carregar subscriptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ title, message, url }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Notificação enviada!",
          description: `Enviada para ${data.sent} de ${data.total} usuários.`,
        })
        setTitle("")
        setMessage("")
        setUrl("")
      } else {
        throw new Error(data.error || "Erro ao enviar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return "Desconhecido"
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS"
    if (/Android/i.test(userAgent)) return "Android"
    if (/Windows/i.test(userAgent)) return "Windows"
    if (/Mac/i.test(userAgent)) return "Mac"
    return "Outro"
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Digite a chave de acesso para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Chave de acesso"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Painel de Notificações</h1>
            <p className="text-muted-foreground">Envie notificações para os usuários inscritos.</p>
          </div>
          <Button variant="outline" onClick={loadSubscriptions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscritos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                usuários receberão notificações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">Ativo</div>
              <p className="text-xs text-muted-foreground">
                sistema de notificações funcionando
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Send Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Enviar Notificação
            </CardTitle>
            <CardDescription>
              Preencha os campos abaixo para enviar uma notificação a todos os usuários inscritos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendNotification} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Ex: Novos itens disponíveis!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">{title.length}/50 caracteres</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem *</label>
                <Textarea
                  placeholder="Ex: Confira os novos itens que acabaram de chegar na loja!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{message.length}/200 caracteres</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL (opcional)</label>
                <Input
                  placeholder="Ex: https://avkngifts.com/novidades"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                />
                <p className="text-xs text-muted-foreground">Link para onde o usuário será direcionado ao clicar</p>
              </div>

              <Button type="submit" disabled={isSending || subscriptions.length === 0} className="w-full">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para {subscriptions.length} usuário{subscriptions.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscribers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Inscritos ({subscriptions.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários que aceitaram receber notificações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum usuário inscrito ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {subscriptions.map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{getDeviceType(sub.user_agent)}</p>
                        <p className="text-xs text-muted-foreground">
                          Inscrito em {formatDate(sub.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {sub.endpoint?.split("/").pop()?.substring(0, 20)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
