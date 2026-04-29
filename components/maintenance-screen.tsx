"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MaintenanceScreenProps {
  onRetry?: () => void
}

export function MaintenanceScreen({ onRetry }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full text-center space-y-8">
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
            Estamos em manutenção. O sistema voltará em breve.
          </p>
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
