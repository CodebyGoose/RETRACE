import { supabase } from '../lib/supabase.js'

export async function fetchAdminUsers() {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke('list-users', {
    body: {},
  })

  if (error) throw error
  return data.users ?? []
}
