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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'The account service is not configured correctly.' }, 500)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const notificationClient = createClient(supabaseUrl, anonKey)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    stage = 'checking admin access'
    const { data: callerData, error: callerError } = await userClient.auth.getUser()
    if (callerError || callerData.user?.app_metadata?.role !== 'admin') {
      return json({ error: 'Admin access required' }, 403)
    }

    stage = 'validating student details'
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const studentId = String(body.studentId ?? '').trim()
    const firstName = String(body.firstName ?? '').trim()
    const lastName = String(body.lastName ?? '').trim()
    const department = String(body.department ?? '').trim()
    const temporaryPassword = String(body.temporaryPassword ?? '')

    if (!email.endsWith('@ua.edu.ph')) return json({ error: 'Use a university email ending in @ua.edu.ph.' }, 400)
    if (!studentId || !firstName || !lastName || !department || temporaryPassword.length < 8) {
      return json({ error: 'All student fields are required and the temporary password must be at least 8 characters.' }, 400)
    }

    stage = 'creating student account'
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        student_id: studentId,
        department,
        must_change_password: true,
      },
    })

    if (error) return json({ error: error.message }, 400)

    stage = 'sending password setup email'
    const origin = request.headers.get('origin') || Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const redirectTo = `${origin.replace(/\/$/, '')}/change-password`
    const { error: emailError } = await notificationClient.auth.resetPasswordForEmail(email, { redirectTo })
    if (emailError) {
      await adminClient.auth.admin.deleteUser(data.user.id)
      return json({ error: `The student account was not kept because the password email could not be sent: ${emailError.message}` }, 502)
    }

    return json({ userId: data.user.id, message: 'Student account created and password setup email sent.' })
  } catch (error) {
    console.error(`Student account creation failed during ${stage}:`, error)
    return json({
      error: error instanceof Error ? error.message : 'Unexpected account creation error',
      stage,
    }, 500)
  }
})
