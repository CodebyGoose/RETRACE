import { supabase } from '../lib/supabase.js'

export async function fetchNotifications() {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_notifications')
  if (error) throw error
  return data ?? []
}
