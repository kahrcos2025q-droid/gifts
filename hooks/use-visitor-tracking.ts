"use client"

import { useEffect, useRef } from "react"

function getVisitorId(): string {
  if (typeof window === "undefined") return ""
  
  let visitorId = localStorage.getItem("visitor_id")
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("visitor_id", visitorId)
  }
  return visitorId
}

export function useVisitorTracking() {
  const trackedRef = useRef(false)

  useEffect(() => {
    if (trackedRef.current) return
    trackedRef.current = true

    const visitorId = getVisitorId()
    if (!visitorId) return

    // Track enter
    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, action: "enter" })
    }).catch(console.error)

    // Track leave
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        "/api/visitors",
        JSON.stringify({ visitorId, action: "leave" })
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, action: "leave" }),
          keepalive: true
        }).catch(console.error)
      } else if (document.visibilityState === "visible") {
        fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, action: "enter" })
        }).catch(console.error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])
}
