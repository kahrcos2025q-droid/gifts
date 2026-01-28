'use client';

import { useEffect, useState } from 'react'
import { getAppSettings } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'

export function useAppConfig() {
  const [isLoading, setIsLoading] = useState(true)
  const store = useAppStore()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAppSettings()
        
        // Set limits from settings or use defaults
        const maxItemPrice = settings.MAX_ITEM_PRICE || 30000
        const maxCartItems = settings.MAX_CART_ITEMS || 20
        
        store.setMaxItemPrice(Number(maxItemPrice))
        store.setMaxCartItems(Number(maxCartItems))
      } catch (err) {
        console.error('[v0] Error loading app config:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [store])

  return { isLoading }
}
