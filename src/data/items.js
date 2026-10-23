// Mock data taken from the Figma screens. Swap for a real API later.
// Photos live in /public/images (run `npm run assets` to pull them from Figma).

export const REF_DATE = new Date('2026-10-19T09:00:00') // "today" in the design

export const CATEGORIES = [
  { name: 'Electronics', count: 12 },
  { name: 'Bags & accessories', count: 8 },
  { name: 'Keys & cards', count: 7 },
  { name: 'Personal items', count: 6 },
  { name: 'Books & stationery', count: 5 },
]

export const LOCATIONS = [
  'Main Library',
  'Sports Centre',
  'Student Union',
  'Engineering Building',
  'Arts Building',
  'Church',
]

export const TOTALS = { all: 38, found: 23, lost: 15 }

export const items = [
  {
    id: 'LF-2048',
    name: 'Black Herschel backpack',
    status: 'found',
    category: 'Bags & accessories',
    place: 'Main Library',
    detailPlace: 'Main Library · Floor 2',
    date: '2026-10-19',
    time: '9:30 AM',
    image: '/images/backpack.png',
    heroImage: '/images/backpack-large.png',
    description:
      'Black Herschel backpack with a brown leather patch and front zip pocket. Found beside a study desk on the second floor of the Main Library this morning. It has been handed in to the library help desk for safekeeping.',
    collectionPoint: 'Main Library help desk',
    hours: 'Monday–Friday · 8:00 AM–8:00 PM',
  },
  {
    id: 'LF-2047',
    name: 'Sage green water bottle',
    status: 'lost',
    category: 'Personal items',
    place: 'Sports Centre',
    detailPlace: 'Sports Centre · Courts entrance',
    date: '2026-10-19',
    time: '4:15 PM',
    image: '/images/bottle.png',
    description:
      'Insulated sage green water bottle with a handle loop. Last seen near the courts entrance after evening practice.',
    collectionPoint: 'Sports Centre front desk',
    hours: 'Monday–Saturday · 7:00 AM–9:00 PM',
  },
  {
    id: 'LF-2046',
    name: 'Keys with a blue lanyard',
    status: 'found',
    category: 'Keys & cards',
    place: 'Student Union',
    detailPlace: 'Student Union · Ground floor',
    date: '2026-10-18',
    time: '1:10 PM',
    image: '/images/keys.png',
    description:
      'A small bunch of keys on a dark blue lanyard with a metal clip. Found on a table in the Student Union lounge.',
    collectionPoint: 'Student Union information desk',
    hours: 'Monday–Friday · 8:00 AM–6:00 PM',
  },
  {
    id: 'LF-2045',
    name: 'Silver Sony headphones',
    status: 'lost',
    category: 'Electronics',
    place: 'Engineering Building',
    detailPlace: 'Engineering Building · Room 204',
    date: '2026-10-18',
    time: '11:00 AM',
    image: '/images/headphones.png',
    description:
      'Silver over-ear Sony wireless headphones with a soft carrying case. Left behind after a morning lecture.',
    collectionPoint: 'Engineering Building office',
    hours: 'Monday–Friday · 8:00 AM–5:00 PM',
  },
  {
    id: 'LF-2044',
    name: 'Round tortoiseshell glasses',
    status: 'found',
    category: 'Personal items',
    place: 'Arts Building',
    detailPlace: 'Arts Building · Lobby',
    date: '2026-10-18',
    time: '2:45 PM',
    image: '/images/glasses.png',
    description:
      'Round tortoiseshell-frame glasses with clear lenses. Found on a bench in the Arts Building lobby.',
    collectionPoint: 'Arts Building office',
    hours: 'Monday–Friday · 8:00 AM–5:00 PM',
  },
  {
    id: 'LF-2043',
    name: 'Blue spiral notebook',
    status: 'found',
    category: 'Books & stationery',
    place: 'Main Library',
    detailPlace: 'Main Library · Floor 1',
    date: '2026-10-17',
    time: '5:20 PM',
    image: '/images/notebook.png',
    description:
      'Blue hardcover spiral notebook with handwritten notes inside. Found on a reading table near the entrance.',
    collectionPoint: 'Main Library help desk',
    hours: 'Monday–Friday · 8:00 AM–8:00 PM',
  },
]

// Extra cards shown on the Home screen only.
export const recentExtras = [
  {
    key: 'marlboro',
    name: 'Marlboro Blue',
    status: 'lost',
    category: 'Bags & accessories',
    place: 'Shed',
    date: '2026-10-19',
    image: '/images/marlboro.png',
  },
  {
    key: 'hitide',
    name: 'NO',
    status: 'lost',
    category: 'Personal items',
    place: 'Stacy',
    date: '2026-10-19',
    image: '/images/hitide.png',
  },
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

export function getItem(id) {
  return items.find((i) => i.id === id)
}
