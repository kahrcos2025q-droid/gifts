import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item } from './types'

interface CartItem extends Item {
  quantity: number
}

interface AppStore {
  // Key state
  userKey: string
  setUserKey: (key: string) => void
  balance: number | null
  setBalance: (balance: number | null) => void
  isKeyValid: boolean
  setIsKeyValid: (valid: boolean) => void
  
  // Cart state
  cart: CartItem[]
  addToCart: (item: Item) => boolean
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  getCartTotal: () => number
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Key state
      userKey: '',
      setUserKey: (key) => set({ userKey: key }),
      balance: null,
      setBalance: (balance) => set({ balance }),
      isKeyValid: false,
      setIsKeyValid: (valid) => set({ isKeyValid: valid }),
      
      // Cart state
      cart: [],
      addToCart: (item) => {
        const state = get()
        if (state.cart.length >= 5) {
          return false
        }
        const existingItem = state.cart.find((i) => i.id === item.id)
        if (existingItem) {
          return false
        }
        set({ cart: [...state.cart, { ...item, quantity: 1 }] })
        return true
      },
      removeFromCart: (itemId) => {
        set({ cart: get().cart.filter((i) => i.id !== itemId) })
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + item.preco, 0)
      },
    }),
    {
      name: 'avkn-gifts-storage',
      partialize: (state) => ({ 
        userKey: state.userKey,
        cart: state.cart 
      }),
    }
  )
)
