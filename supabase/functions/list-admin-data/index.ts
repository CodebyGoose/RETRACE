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

  let stage = 'initializing'
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    stage = 'checking admin access'
    const { data: callerData, error: callerError } = await userClient.auth.getUser()
    if (callerError || callerData.user?.app_metadata?.role !== 'admin') {
      return json({ error: 'Admin access required' }, 403)
    }

    stage = 'loading reports'
    const { data: items, error: itemsError } = await adminClient
      .from('items')
      .select('*')
      .order('date', { ascending: false })
    if (itemsError) return json({ error: itemsError.message, stage }, 500)

    stage = 'loading claims'
    const { data: claims, error: claimsError } = await adminClient
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false })
    if (claimsError) return json({ error: claimsError.message, stage }, 500)

    stage = 'loading users'
    const { data: userPage, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) return json({ error: usersError.message, stage }, 500)

    const userMap = new Map((userPage?.users ?? []).map((user) => [
      user.id,
      {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name ?? '',
        lastName: user.user_metadata?.last_name ?? '',
        studentId: user.user_metadata?.student_id ?? '',
        department: user.user_metadata?.department ?? '',
        role: user.app_metadata?.role ?? 'user',
      },
    ]))

    stage = 'signing evidence links'
    const claimsWithDetails = await Promise.all((claims ?? []).map(async (claim) => {
      let evidenceUrl = null
      if (claim.evidence_path) {
        const { data } = await adminClient.storage.from('claim-evidence').createSignedUrl(claim.evidence_path, 600)
        evidenceUrl = data?.signedUrl ?? null
      }
      return { ...claim, claimant: userMap.get(claim.claimant_id) ?? null, evidenceUrl }
    }))

    return json({
      items: (items ?? []).map((item) => ({ ...item, reporter: userMap.get(item.reported_by) ?? null })),
      claims: claimsWithDetails,
      users: [...userMap.values()],
    })
  } catch (error) {
    console.error(`Admin dashboard failed during ${stage}:`, error)
    return json({
      error: error instanceof Error ? error.message : 'Unexpected admin dashboard error',
      stage,
    }, 500)
  }
})
