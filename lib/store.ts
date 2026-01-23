import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item } from './types'

interface CartItem extends Item {
  quantity: number
}

const MAX_CART_TOTAL = 25000
const MAX_CART_ITEMS = 5

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
  canAddToCart: (item: Item) => boolean
  getRemainingCartValue: () => number
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
        if (state.cart.length >= MAX_CART_ITEMS) {
          return false
        }
        const existingItem = state.cart.find((i) => i.id === item.id)
        if (existingItem) {
          return false
        }
        const currentTotal = state.cart.reduce((total, i) => total + i.preco, 0)
        if (currentTotal + item.preco > MAX_CART_TOTAL) {
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
      canAddToCart: (item) => {
        const state = get()
        if (state.cart.length >= MAX_CART_ITEMS) return false
        if (state.cart.some((i) => i.id === item.id)) return false
        const currentTotal = state.cart.reduce((total, i) => total + i.preco, 0)
        if (currentTotal + item.preco > MAX_CART_TOTAL) return false
        if (item.preco > MAX_CART_TOTAL) return false
        return true
      },
      getRemainingCartValue: () => {
        const state = get()
        const currentTotal = state.cart.reduce((total, i) => total + i.preco, 0)
        return MAX_CART_TOTAL - currentTotal
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
