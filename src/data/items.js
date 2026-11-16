export const CATEGORIES = [
  'Electronics',
  'Bags & accessories',
  'Keys & cards',
  'Personal items',
  'Books & stationery',
]

export const LOCATIONS = [
  'Main Library',
  'Sports Centre',
  'Student Union',
  'Engineering Building',
  'Arts Building',
  'Church',
]

export function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateLong(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
