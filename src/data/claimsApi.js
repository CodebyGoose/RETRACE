import { supabase } from '../lib/supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function submitClaim({ itemId, lostPlace, lostDate, lostTime, identifyingDetails, evidence }) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Please sign in before submitting a claim.')

  let evidencePath = null
  if (evidence) {
    const extension = evidence.name.split('.').pop()?.toLowerCase() || 'jpg'
    evidencePath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await client.storage.from('claim-evidence').upload(evidencePath, evidence, {
      cacheControl: '3600',
      contentType: evidence.type,
      upsert: false,
    })
    if (uploadError) throw uploadError
  }

  const { data, error } = await client.from('claims').insert({
    item_id: itemId,
    claimant_id: userData.user.id,
    lost_place: lostPlace,
    lost_date: lostDate,
    lost_time: lostTime,
    identifying_details: identifyingDetails,
    evidence_path: evidencePath,
    status: 'pending_review',
  }).select('id, item_id, status, created_at').single()

  if (error) {
    if (evidencePath) await client.storage.from('claim-evidence').remove([evidencePath])
    throw error
  }
  return data
}

export async function fetchMyClaims() {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return []

  const [{ data: claims, error }, { data: items, error: itemsError }] = await Promise.all([
    client.from('claims').select('*').eq('claimant_id', userData.user.id).order('created_at', { ascending: false }),
    client.from('public_item_details').select('*'),
  ])
  if (error) throw error
  if (itemsError) throw itemsError

  const itemMap = new Map(items.map((item) => [item.id, item]))
  return claims.map((claim) => ({ ...claim, item: itemMap.get(claim.item_id) ?? null }))
}

export async function fetchAdminData() {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('list-admin-data', { body: {} })
  if (error) {
    let detail = error.message
    if (error.context?.status) detail = `${detail} (HTTP ${error.context.status})`
    if (error.context?.clone) {
      try {
        const body = await error.context.clone().json()
        if (body.error) detail = `${body.error}${body.stage ? ` [${body.stage}]` : ''}`
      } catch {
        // Keep the original FunctionsHttpError when the response is not JSON.
      }
    }
    throw new Error(detail)
  }
  return data
}

export async function confirmTurnover(itemId) {
  const { data, error } = await requireSupabase().rpc('admin_confirm_turnover', { p_item_id: itemId })
  if (error) throw error
  return data
}

export async function reviewClaim(claimId, decision, reviewNote, collectionPoint) {
  const { data, error } = await requireSupabase().rpc('admin_review_claim', {
    p_claim_id: claimId,
    p_decision: decision,
    p_review_note: reviewNote || null,
    p_collection_point: collectionPoint || null,
  })
  if (error) throw error
  return data
}

export async function releaseClaim(claimId, verifiedStudentId) {
  const { data, error } = await requireSupabase().rpc('admin_release_claim', {
    p_claim_id: claimId,
    p_verified_student_id: verifiedStudentId,
  })
  if (error) throw error
  return data
}
