import { supabase } from '../lib/supabase.js'

function mapItem(item) {
  return {
    ...item,
    detailPlace: item.detail_place,
    heroImage: item.hero_image,
    collectionPoint: item.collection_point,
  }
}

export async function fetchItems() {
  const { data, error } = await supabase.from('items').select('*').order('date', { ascending: false })

  if (error) throw error
  return data.map(mapItem)
}

export async function fetchItem(id) {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? mapItem(data) : null
}

export async function createItem(form) {
  const item = {
    id: `LF-${Date.now()}`,
    name: form.name,
    status: form.type,
    category: form.category,
    place: form.place,
    detail_place: form.specific || form.place,
    date: form.date,
    description: form.description,
    collection_point: form.keptAt || null,
  }

  const { data, error } = await supabase.from('items').insert(item).select().single()

  if (error) throw error
  return mapItem(data)
}
