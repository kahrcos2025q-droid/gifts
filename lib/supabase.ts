import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[v0] Supabase environment variables are not configured. Database features will be disabled.')
    return null
  }
  return createClient(supabaseUrl, supabaseKey)
}

export const supabase = createSupabaseClient()

export interface UserItem {
  id?: string
  friend_code: string
  item_id: string
  item_name: string
  status: 'owned' | 'purchase_not_allowed'
  created_at?: string
}

export interface AppSettings {
  id?: string
  key: string
  value: string | number
  description?: string
  updated_at?: string
}

export async function markItemStatus(
  friendCode: string,
  itemId: string,
  itemName: string,
  status: 'owned' | 'purchase_not_allowed'
): Promise<void> {
  if (!supabase) {
    console.warn('[v0] Supabase not configured, skipping markItemStatus')
    return
  }
  
  const { error } = await supabase
    .from('user_items')
    .upsert(
      {
        friend_code: friendCode.toUpperCase(),
        item_id: itemId,
        item_name: itemName,
        status: status,
      },
      {
        onConflict: 'friend_code,item_id',
      }
    )

  if (error) {
    console.error('[v0] Error marking item:', error)
  }
}

export async function getUserItems(friendCode: string): Promise<UserItem[]> {
  if (!supabase) {
    console.warn('[v0] Supabase not configured, returning empty items')
    return []
  }
  
  const { data, error } = await supabase
    .from('user_items')
    .select('*')
    .eq('friend_code', friendCode.toUpperCase())

  if (error) {
    console.error('[v0] Error fetching user items:', error)
    return []
  }

  return data || []
}

export async function isItemBlocked(
  friendCode: string,
  itemId: string
): Promise<boolean> {
  if (!supabase) {
    console.warn('[v0] Supabase not configured, returning false for isItemBlocked')
    return false
  }
  
  const { data } = await supabase
    .from('user_items')
    .select('id')
    .eq('friend_code', friendCode.toUpperCase())
    .eq('item_id', itemId)
    .single()

  return !!data
}

export async function getAppSettings(): Promise<Record<string, string | number>> {
  if (!supabase) {
    console.warn('[v0] Supabase not configured, returning empty settings')
    return {}
  }
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')

  if (error) {
    console.error('[v0] Error fetching app settings:', error)
    return {}
  }

  const settings: Record<string, string | number> = {}
  data?.forEach(setting => {
    settings[setting.key] = setting.value
  })

  return settings
}
