"use client"

import { Info } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"

interface MenuTabProps {
  onOpenInfo: () => void
  isHidden?: boolean
}

export function MenuTab({ onOpenInfo, isHidden = false }: MenuTabProps) {
  return (
    <div 
      className={`fixed top-[72px] sm:top-[80px] right-4 sm:right-6 z-30 transition-transform duration-300 ease-in-out flex flex-col gap-2 ${
        isHidden ? 'translate-x-[150%]' : 'translate-x-0'
      }`}
    >
      {/* Info Tab */}
      <div className="relative">
        <button
          onClick={onOpenInfo}
          className="relative flex items-center gap-2 px-4 py-2 rounded-b-2xl rounded-tl-2xl glass border-2 border-t-0 border-secondary/30 hover:border-secondary/50 bg-background/80 backdrop-blur-sm shadow-lg transition-all hover:py-3 group"
          aria-label="Abrir informações"
        >
          <Info className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Info
          </span>
        </button>
      </div>

      {/* Notification Bell - Only on mobile */}
      <div className="sm:hidden flex justify-end">
        <NotificationBell variant="tab" />
      </div>
    </div>
  )
}
