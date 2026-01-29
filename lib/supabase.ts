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

export async function getUserItems(friendCode: string): Promise<UserItem[]> {
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
  const { data } = await supabase
    .from('user_items')
    .select('id')
    .eq('friend_code', friendCode.toUpperCase())
    .eq('item_id', itemId)
    .single()

  return !!data
}
