import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, HandHeart, HeartHandshake, Info, Search } from 'lucide-react'
import { Card, ItemCard, PageIntro } from '../components/ui.jsx'
import { fetchItems } from '../data/itemsApi.js'

const metrics = [
  { icon: Search, value: '38', label: 'items looking for their owners' },
  { icon: HeartHandshake, value: '124', label: 'happy reunions this semester' },
  { icon: ClipboardList, value: '2', label: 'active reports from you' },
]

const popular = ['Electronics', 'Keys & cards', 'Bags']

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    fetchItems().then(setItems).catch((error) => {
      console.error('Unable to load items:', error)
      setLoadError('Unable to load items right now.')
    })
  }, [])
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const search = (q) => navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse')

  const recent = [
    ...items.slice(0, 4).map((item) => ({ ...item, to: `/items/${item.id}` })),
  ]

  return (
    <>
      <PageIntro title={`${greeting()}, Justine.`} description="Let’s get the things that matter back where they belong.">
        <p className="text-xs text-muted">{today}</p>
      </PageIntro>

      <section className="flex flex-col gap-8 rounded-2xl bg-hero p-6 sm:p-8 lg:flex-row">
        <div className="flex min-w-0 flex-col gap-5 lg:w-[60%] lg:shrink-0">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[26px] text-black sm:text-[28px]">Missing something? Start here.</h2>
            <p className="text-sm text-slate">Search items reported by students and staff across campus.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              search(query.trim())
            }}
            className="flex h-[52px] items-center gap-3 rounded-lg border border-[#e1e0e6] bg-white pr-1 pl-4"
          >
            <Search size={19} className="shrink-0 text-slate" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search items"
              placeholder="Try “backpack”, “keys” or “Main Library”"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-slate"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-lg bg-black px-[18px] text-[13px] font-semibold text-white hover:bg-[#1c1c1c]"
            >
              Search items
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
            <span className="text-[11px] text-slate">POPULAR</span>
            {popular.map((p) => (
              <button key={p} type="button" onClick={() => search(p)} className="text-xs text-brand hover:underline">
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden w-px shrink-0 bg-hero-line lg:block" />

        <div className="flex min-w-0 flex-1 flex-col items-start gap-[13px]">
          <HandHeart size={26} className="text-ink" />
          <h3 className="text-lg text-ink">Found something on campus?</h3>
          <p className="text-[13px] leading-[1.6] text-slate">A quick report could make someone’s day.</p>
          <Link to="/report" className="text-[13px] font-semibold text-black hover:underline">
            Report a found item →
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {metrics.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-4 py-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-chip text-brand">
              <Icon size={20} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-2xl text-black">{value}</span>
              <span className="text-xs text-muted">{label}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[21px] font-semibold text-ink">Recently reported</h2>
            <p className="text-[13px] text-muted">A few things waiting to find their way home.</p>
          </div>
          <Link to="/browse" className="text-[13px] font-semibold text-brand hover:underline">
            Browse all items →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loadError ? (
            <p className="text-sm text-red-700">{loadError}</p>
          ) : recent.length ? (
            recent.map((item) => <ItemCard key={item.id} item={item} to={item.to} />)
          ) : (
            <p className="text-sm text-muted">Loading recently reported items...</p>
          )}
        </div>
      </section>

      <Card className="flex flex-wrap items-center gap-4 p-6">
        <Info size={20} className="shrink-0 text-muted" />
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <p className="text-sm text-ink">Think you’ve found your item?</p>
          <p className="text-xs leading-normal text-muted">
            Open the listing and send a claim. Keep a photo or a few identifying details handy so we can confirm it’s yours.
          </p>
        </div>
        <a href="#" className="text-xs font-semibold text-brand hover:underline">
          How it works ↗
        </a>
      </Card>
    </>
  )
}
