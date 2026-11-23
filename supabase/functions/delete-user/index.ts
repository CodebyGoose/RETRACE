import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'The account service is not configured correctly.' }, 500)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerData, error: callerError } = await userClient.auth.getUser()

    if (callerError || callerData.user?.app_metadata?.role !== 'admin') {
      return json({ error: 'Admin access required' }, 403)
    }

    const body = await request.json()
    const userId = String(body.userId ?? '').trim()
    if (!userId) return json({ error: 'A user ID is required.' }, 400)
    if (userId === callerData.user.id) return json({ error: 'You cannot delete your own administrator account.' }, 400)

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)

    return json({ userId, message: 'User account deleted.' })
  } catch (error) {
    console.error('User account deletion failed:', error)
    return json({
      error: error instanceof Error ? error.message : 'Unexpected account deletion error',
    }, 500)
  }
})
