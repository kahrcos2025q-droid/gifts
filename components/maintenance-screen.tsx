"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface MaintenanceScreenProps {
  onRetry?: () => void
}

export function MaintenanceScreen({ onRetry }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative rounded-full glass border-2 border-primary/30 p-8">
              <AlertTriangle className="h-20 w-20 text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter">
            Sistema em <span className="gradient-text">Manutenção</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Estamos realizando melhorias no sistema. O funcionamento será retomado o mais rápido possível.
          </p>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border-2 border-border/20 glass p-6 max-w-md mx-auto">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              Aguarde alguns instantes e tente novamente
            </p>
            <p className="text-xs">
              Se o problema persistir, entre em contato com o suporte
            </p>
          </div>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <Button
            onClick={onRetry}
            size="lg"
            className="rounded-xl font-bold gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar Novamente
          </Button>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60 mt-12">
          Obrigado pela compreensão
        </p>
      </div>
    </div>
  )
}
