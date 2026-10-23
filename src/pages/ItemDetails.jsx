import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  Image as ImageIcon,
  LockKeyhole,
  MapPin,
  Share2,
} from 'lucide-react'
import { Button, Card, Img, StatusPill } from '../components/ui.jsx'
import { fetchItem } from '../data/itemsApi.js'

function formatDateLong(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chip text-brand">
        <Icon size={17} />
      </span>
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="text-[13px] text-ink">{value}</span>
      </div>
    </div>
  )
}

export default function ItemDetails() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [claimed, setClaimed] = useState(false)
  useEffect(() => {
    setLoading(true)
    fetchItem(id).then(setItem).catch((error) => {
      console.error('Unable to load item:', error)
      setLoadError('Unable to load this item right now.')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-muted">Loading item...</p>
  if (loadError) return <p className="text-sm text-red-700">{loadError}</p>

  if (!item) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-14 text-center">
        <h1 className="text-xl font-semibold text-ink">We couldn’t find that item.</h1>
        <p className="text-sm text-muted">It may have been collected or removed.</p>
        <Button as={Link} to="/browse">Back to browse</Button>
      </Card>
    )
  }

  const found = item.status === 'found'

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: item.name, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-[9px] text-xs">
        <Link to="/browse" className="text-muted hover:text-ink">Browse items</Link>
        <ChevronRight size={12} className="text-muted" />
        <span className="text-ink">{item.name}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <StatusPill status={item.status} />
            <span className="text-[11px] text-muted">ITEM #{item.id}</span>
          </div>
          <h1 className="text-[28px] font-semibold text-ink sm:text-[32px]">{item.name}</h1>
          <p className="text-[13px] text-muted">
            Reported on {formatDateLong(item.date)} · {item.category}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={() => setSaved((s) => !s)} aria-pressed={saved}>
            <Bookmark size={17} className={saved ? 'fill-ink' : ''} />
            {saved ? 'Saved' : 'Save item'}
          </Button>
          <Button variant="outline" onClick={share}>
            {copied ? <Check size={17} /> : <Share2 size={17} />}
            {copied ? 'Link copied' : 'Share'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-7 lg:w-[61%] lg:shrink-0">
          <div className="flex flex-col gap-3">
            <Img
              src={item.heroImage ?? item.image}
              alt={item.name}
              className="h-[260px] w-full rounded-xl sm:h-[374px]"
            />
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <ImageIcon size={13} />
              Photo provided by the finder · 1 photo
            </p>
          </div>

          <div className="flex flex-col gap-[13px]">
            <h2 className="text-[19px] font-semibold text-ink">About this item</h2>
            <p className="text-sm leading-[1.8] text-muted">{item.description}</p>
          </div>

          <hr className="border-line" />

          <div className="flex flex-col gap-6 sm:flex-row">
            <Fact icon={MapPin} label={found ? 'Found at' : 'Last seen at'} value={item.detailPlace} />
            <Fact icon={CalendarDays} label={found ? 'Date found' : 'Date lost'} value={formatDateLong(item.date)} />
            <Fact icon={Clock3} label="Approximate time" value={item.time} />
          </div>

          <a href="#" className="flex items-center gap-[7px] text-[11px] text-muted hover:text-ink">
            <Flag size={13} />
            Something not right? Report this listing
          </a>
        </div>

        <aside className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex flex-col gap-5 p-7">
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">
                {found ? 'Available to claim' : 'Still missing'}
              </p>
              <p className="text-[25px] text-ink">{found ? 'Look familiar?' : 'Seen this item?'}</p>
              <p className="text-[13px] leading-[1.7] text-muted">
                {found
                  ? 'If this belongs to you, send a claim with a few details only the owner would know.'
                  : 'If you’ve spotted it, let campus staff know so it can find its way back to its owner.'}
              </p>
            </div>

            {found ? (
              <Button className="w-full" disabled={claimed} onClick={() => setClaimed(true)}>
                {claimed ? <Check size={17} /> : <ArrowRight size={17} />}
                {claimed ? 'Claim sent' : 'This is my item'}
              </Button>
            ) : (
              <Button as={Link} to="/report" className="w-full">
                <ArrowRight size={17} />
                I found this item
              </Button>
            )}

            <p className="flex items-center gap-[7px] text-[11px] text-muted">
              <LockKeyhole size={13} />
              Your details are only shared with campus staff.
            </p>

            <hr className="border-line" />

            <div className="flex flex-col gap-4">
              <h3 className="text-[13px] font-semibold text-ink">Kept safe at</h3>
              <Fact icon={Building2} label="Collection point" value={item.collectionPoint} />
              <p className="text-xs text-muted">{item.hours}</p>
              <p className="text-xs leading-[1.7] text-muted">
                Please wait for your claim to be confirmed before visiting. Bring your university ID.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 border-transparent p-6">
            <h3 className="text-sm font-semibold text-brand">A simple, safe return</h3>
            {['Tell us what makes it yours', 'Campus staff verify your claim', 'Collect it with your university ID'].map(
              (step, i) => (
                <div key={step} className="flex items-center gap-2.5">
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-line text-[10px] font-semibold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-xs text-brand">{step}</span>
                </div>
              ),
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}
