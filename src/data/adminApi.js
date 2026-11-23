import { supabase } from '../lib/supabase.js'

export async function fetchAdminUsers() {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke('list-users', {
    body: {},
  })

  if (error) throw error
  return data.users ?? []
}

export async function deleteUser(userId) {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  })

  if (error) {
    let functionMessage = ''
    if (error.context && typeof error.context.clone === 'function') {
      try {
        const body = await error.context.clone().json()
        functionMessage = body?.error || ''
      } catch {
        // Keep the SDK error when the function did not return JSON.
      }
    }
    if (functionMessage) throw new Error(functionMessage)
    throw error
  }
  return data
}
