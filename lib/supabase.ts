import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserItem {
  id?: string
  friend_code: string
  item_id: string
  item_name: string
  status: 'owned' | 'purchase_not_allowed'
  created_at?: string
}

export async function markItemStatus(
  friendCode: string,
  itemId: string,
  itemName: string,
  status: 'owned' | 'purchase_not_allowed'
): Promise<void> {
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

// Get total count of items for a friend code
export async function getUserItemsCount(friendCode: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_items')
    .select('*', { count: 'exact', head: true })
    .eq('friend_code', friendCode.toUpperCase())

  if (error) {
    console.error('[v0] Error counting user items:', error)
    return 0
  }

  return count || 0
}

// Get counts by status for a friend code
export async function getUserItemsCountByStatus(
  friendCode: string
): Promise<{ owned: number; blocked: number }> {
  const { data, error } = await supabase
    .from('user_items')
    .select('status')
    .eq('friend_code', friendCode.toUpperCase())

  if (error) {
    console.error('[v0] Error fetching items for count:', error)
    return { owned: 0, blocked: 0 }
  }

  const owned = data?.filter(item => item.status === 'owned').length || 0
  const blocked = data?.filter(item => item.status === 'purchase_not_allowed').length || 0

  return { owned, blocked }
}

// Get paginated items for a friend code
export async function getUserItemsPaginated(
  friendCode: string,
  page: number = 1,
  limit: number = 100
): Promise<UserItem[]> {
  const start = (page - 1) * limit
  const end = start + limit - 1

  const { data, error } = await supabase
    .from('user_items')
    .select('*')
    .eq('friend_code', friendCode.toUpperCase())
    .range(start, end)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching user items:', error)
    return []
  }

  return data || []
}

// Legacy function - fetches all items (use for backwards compatibility)
export async function getUserItems(friendCode: string): Promise<UserItem[]> {
  let allItems: UserItem[] = []
  let start = 0
  const pageSize = 1000
  
  while (true) {
    const { data, error } = await supabase
      .from('user_items')
      .select('*')
      .eq('friend_code', friendCode.toUpperCase())
      .range(start, start + pageSize - 1)

    if (error) {
      console.error('[v0] Error fetching user items:', error)
      break
    }

    if (!data || data.length === 0) {
      break
    }

    allItems = [...allItems, ...data]

    // Se retornou menos que o pageSize, não há mais dados
    if (data.length < pageSize) {
      break
    }

    start += pageSize
  }

  return allItems
}

export async function isItemBlocked(
  friendCode: string,
  itemId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_items')
    .select('id')
    .eq('friend_code', friendCode.toUpperCase())
    .eq('item_id', itemId)
    .single()

  return !!data
}
