import { supabase } from '../lib/supabase.js'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function mapItem(item) {
  return {
    ...item,
    detailPlace: item.detail_place,
    heroImage: item.hero_image,
    collectionPoint: item.collection_point,
  }
}

export async function fetchItems() {
  const { data, error } = await requireSupabase().from('public_item_details').select('*').order('date', { ascending: false })

  if (error) throw error
  return data.map(mapItem)
}

export async function fetchItem(id) {
  const { data, error } = await requireSupabase().from('public_item_details').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? mapItem(data) : null
}

export async function createItem(form) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) {
    const error = new Error('You must be signed in to publish a report.')
    error.code = 'AUTH_REQUIRED'
    throw error
  }

  const photo = form.photos?.[0]?.file
  if (!photo) {
    const error = new Error('Add at least one photo before publishing a report.')
    error.code = 'PHOTO_REQUIRED'
    throw error
  }

  const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const photoPath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await client.storage.from('item-photos').upload(photoPath, photo, {
    cacheControl: '3600',
    contentType: photo.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: publicPhoto } = client.storage.from('item-photos').getPublicUrl(photoPath)

  const item = {
    id: `LF-${Date.now()}`,
    name: form.name,
    status: form.type,
    category: form.category,
    place: form.place,
    detail_place: form.specific || form.place,
    date: form.date,
    time: form.time,
    image: publicPhoto.publicUrl,
    hero_image: publicPhoto.publicUrl,
    description: form.description,
    collection_point: form.keptAt || null,
    reported_by: userData.user.id,
    custody_status: form.type === 'found' ? 'pending_turnover' : null,
  }

  const { error } = await client.from('items').insert(item)

  if (error) throw error
  return mapItem(item)
}

export async function fetchMyItems() {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return []

  const { data, error } = await client.rpc('get_my_items')

  if (error) throw error
  return data.map(mapItem)
}

export async function deleteItem(id) {
  const client = requireSupabase()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || userData.user?.app_metadata?.role !== 'admin') {
    throw new Error('You must be an admin to delete reports.')
  }

  const { error } = await client.from('items').delete().eq('id', id)
  if (error) throw error
}
