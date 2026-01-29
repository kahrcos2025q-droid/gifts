import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item } from './types'

interface CartItem extends Item {
  quantity: number
}

const MAX_CART_ITEMS = 20
const MAX_ITEM_PRICE = 30000
const MAX_CART_TOTAL = 100000 // Declared MAX_CART_TOTAL variable

interface BlockedItem {
  item_id: string
  status: 'owned' | 'purchase_not_allowed'
}

interface AppStore {
  // Key state
  userKey: string
  setUserKey: (key: string) => void
  balance: number | null
  setBalance: (balance: number | null) => void
  isKeyValid: boolean
  setIsKeyValid: (valid: boolean) => void
  
  // Friend code state
  friendCode: string
  setFriendCode: (code: string) => void
  blockedItems: BlockedItem[]
  setBlockedItems: (items: BlockedItem[]) => void
  addBlockedItem: (itemId: string, status: 'owned' | 'purchase_not_allowed') => void
  isItemBlocked: (itemId: string) => BlockedItem | undefined
  
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
      
      // Friend code state
      friendCode: '',
      setFriendCode: (code) => set({ friendCode: code }),
      blockedItems: [],
      setBlockedItems: (items) => set({ blockedItems: items }),
      addBlockedItem: (itemId, status) => {
        const state = get()
        const exists = state.blockedItems.some((i) => i.item_id === itemId)
        if (!exists) {
          set({ blockedItems: [...state.blockedItems, { item_id: itemId, status }] })
        }
      },
      isItemBlocked: (itemId) => {
        return get().blockedItems.find((i) => i.item_id === itemId)
      },
      
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
        if (item.preco > MAX_ITEM_PRICE) {
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
        if (item.preco > MAX_ITEM_PRICE) return false
        return true
      },
      getRemainingCartValue: () => {
        return MAX_ITEM_PRICE
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
        cart: state.cart,
        friendCode: state.friendCode,
        blockedItems: state.blockedItems,
      }),
    }
  )
)
