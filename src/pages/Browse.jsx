import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lightbulb, Search } from 'lucide-react'
import { Button, Card, ItemCard, PageIntro, Select } from '../components/ui.jsx'
import { fetchItems } from '../data/itemsApi.js'
import { REF_DATE } from '../data/items.js'

const DATE_OPTIONS = [
  { label: 'Any time', days: Infinity },
  { label: 'Past 24 hours', days: 1 },
  { label: 'Past 7 days', days: 7 },
  { label: 'Past 30 days', days: 30 },
]

const TABS = [
  { key: 'all', label: 'All items' },
  { key: 'found', label: 'Found' },
  { key: 'lost', label: 'Lost' },
]

const PAGE_SIZE = 6

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)
  const [cats, setCats] = useState([]) // empty = all categories
  const [location, setLocation] = useState('')
  const [dateIdx, setDateIdx] = useState(0)
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    let active = true
    async function loadItems() {
      try {
        const fetchedItems = await fetchItems()
        if (active) setItems(fetchedItems)
      } catch (error) {
        if (active) {
          console.error('Unable to load items:', error)
          setLoadError('Unable to load items right now.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadItems()
    return () => { active = false }
  }, [])
  const categories = [...new Set(items.map((item) => item.category))]
  const locations = [...new Set(items.map((item) => item.place))]

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const maxDays = DATE_OPTIONS[dateIdx].days
    return items
      .filter((i) => (tab === 'all' ? true : i.status === tab))
      .filter((i) => (cats.length ? cats.includes(i.category) : true))
      .filter((i) => (location ? i.place === location : true))
      .filter((i) => {
        if (!needle) return true
        return [i.name, i.description, i.place, i.category].join(' ').toLowerCase().includes(needle)
      })
      .filter((i) => {
        const days = (REF_DATE - new Date(i.date + 'T00:00:00')) / 86400000
        return days <= maxDays
      })
      .sort((a, b) => (sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
  }, [items, q, cats, location, dateIdx, tab, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = filtered.slice(startIndex, startIndex + PAGE_SIZE)
  const pageNumbers = []
  const numberedPages = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
      .filter((number) => number >= 1 && number <= totalPages)
      .sort((a, b) => a - b)
  numberedPages.forEach((number, index) => {
    const previous = numberedPages[index - 1]
    if (number - previous === 2) pageNumbers.push(previous + 1)
    else if (number - previous > 2) pageNumbers.push(`ellipsis-${number}`)
    pageNumbers.push(number)
  })

  useEffect(() => {
    setPage(1)
  }, [q, cats, location, dateIdx, tab, sort])

  useEffect(() => {
    setPage((previous) => Math.min(previous, Math.max(1, totalPages)))
  }, [totalPages])

  const count = (key) => (key === 'all' ? items.length : items.filter((item) => item.status === key).length)

  const reset = () => {
    setCats([])
    setLocation('')
    setDateIdx(0)
    setTab('all')
    setDraft('')
    setParams({})
    setPage(1)
  }

  const toggleCat = (name) => setCats((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))

  return (
    <>
      <PageIntro
        title="Find what you’re looking for."
        description="Browse lost and found items from across the University of the Assumption campus."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setParams(draft.trim() ? { q: draft.trim() } : {})
          setPage(1)
        }}
        className="flex h-[52px] items-center gap-3 rounded-lg border border-line bg-white pr-1 pl-[18px]"
      >
        <Search size={20} className="shrink-0 text-muted" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Search items"
          placeholder="Search by item name, description or location"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <Button type="submit" className="shrink-0 border-forest">
          Search items
        </Button>
      </form>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Filters */}
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-56">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Filters</h2>
            <button type="button" onClick={reset} className="text-[11px] text-brand hover:underline">
              Reset all
            </button>
          </div>
          <hr className="border-line" />

          <fieldset className="flex flex-col gap-[18px]">
            <legend className="mb-[18px] text-xs font-semibold text-ink">Category</legend>
            <CheckRow label="All categories" count={items.length} checked={cats.length === 0} onChange={() => setCats([])} accent />
            {categories.map((name) => (
              <CheckRow
                key={name}
                label={name}
                count={items.filter((item) => item.category === name).length}
                checked={cats.includes(name)}
                onChange={() => toggleCat(name)}
              />
            ))}
          </fieldset>
          <hr className="border-line" />

          <div className="flex flex-col gap-4">
            <label htmlFor="location" className="text-xs font-semibold text-ink">Campus location</label>
            <Select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              options={[{ value: '', label: 'All locations' }, ...locations]}
              className="[&_select]:min-h-[42px] [&_select]:text-xs"
            />
          </div>

          <fieldset className="flex flex-col gap-[18px]">
            <legend className="mb-[18px] text-xs font-semibold text-ink">Date reported</legend>
            {DATE_OPTIONS.map((o, i) => (
              <label key={o.label} className="flex cursor-pointer items-center gap-[9px] text-xs text-ink">
                <input
                  type="radio"
                  name="date"
                  checked={dateIdx === i}
                  onChange={() => setDateIdx(i)}
                  className="peer sr-only"
                />
                <span
                  className={`size-[15px] shrink-0 rounded-full bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
                    dateIdx === i ? 'border-[5px] border-brand' : 'border border-line'
                  }`}
                />
                {o.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col items-start gap-2.5 rounded-lg bg-white p-4">
            <Lightbulb size={19} className="text-brand" />
            <p className="text-xs font-semibold text-brand">No luck yet?</p>
            <p className="text-xs leading-[1.6] text-muted">
              Report your lost item so the community can keep an eye out.
            </p>
            <Link to="/report" className="text-xs font-semibold text-brand hover:underline">
              Report an item →
            </Link>
          </div>
        </aside>

        {/* Results */}
        <section aria-busy={isLoading} className="flex min-w-0 flex-1 flex-col gap-6">
          <div role="tablist" className="flex h-[41px] gap-6 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 text-[13px] whitespace-pre ${
                  tab === t.key ? 'border-black font-semibold text-black' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {t.label}
                {'  '}
                <span className="font-normal">{count(t.key)}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <p aria-live="polite">
              {isLoading ? 'Loading items…' : loadError ? loadError : filtered.length
                ? `Showing ${startIndex + 1}–${startIndex + visibleItems.length} of ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`
                : 'Showing 0 items'}
            </p>
            <label className="relative flex items-center gap-2">
              Sort by:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-transparent pr-5 text-xs text-black outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-0" />
            </label>
          </div>

          {isLoading ? (
            <Card className="px-6 py-14 text-center text-sm text-muted">
              Loading items…
            </Card>
          ) : loadError ? (
            <Card role="alert" className="px-6 py-14 text-center text-sm text-ink">
              {loadError}
            </Card>
          ) : filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <ItemCard key={item.id} item={item} to={`/items/${item.id}`} />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-base font-semibold text-ink">Nothing matches those filters yet.</p>
              <p className="max-w-sm text-sm text-muted">
                Try clearing a filter, or report your item so the community can keep an eye out.
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={reset}>Reset filters</Button>
                <Button as={Link} to="/report">Report an item</Button>
              </div>
            </Card>
          )}

          <nav aria-label="Pagination" className="flex items-center justify-between pt-1">
            <Button type="button" variant="outline" disabled={isLoading || !!loadError || currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              <ArrowLeft size={17} />
              Previous
            </Button>
            <div className="hidden gap-1.5 sm:flex">
              {pageNumbers.map((number) => {
                if (typeof number === 'string') {
                  return <span key={number} className="flex size-[34px] items-center justify-center text-xs text-muted">…</span>
                }
                const current = number === currentPage
                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    aria-label={`Page ${number}`}
                    aria-current={current ? 'page' : undefined}
                    className={`size-[34px] rounded-md text-xs ${
                      current ? 'bg-found font-semibold text-black' : 'bg-page text-muted hover:bg-chip'
                    }`}
                  >
                    {number}
                  </button>
                )
              })}
            </div>
            <Button type="button" variant="outline" disabled={isLoading || !!loadError || currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
              <ArrowRight size={17} />
            </Button>
          </nav>
        </section>
      </div>
    </>
  )
}

function CheckRow({ label, count, checked, onChange, accent }) {
  return (
    <label className="flex cursor-pointer items-center gap-[9px] text-xs">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`flex size-[15px] shrink-0 items-center justify-center rounded border text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
          checked ? 'border-brand bg-brand' : 'border-line bg-white'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className={`flex-1 ${accent && checked ? 'text-brand' : 'text-ink'}`}>{label}</span>
      <span className="text-[11px] text-muted">{count}</span>
    </label>
  )
}
