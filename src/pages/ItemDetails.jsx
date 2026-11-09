import { useEffect, useRef, useState } from 'react'
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

function optionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatDateLong(iso) {
  const value = optionalText(iso)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Date unavailable'
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Date unavailable'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function ItemPhoto({ item }) {
  const sources = [...new Set([item.heroImage, item.hero_image, item.image].map(optionalText).filter(Boolean))]
  const [failedSources, setFailedSources] = useState([])
  const [loadedSource, setLoadedSource] = useState('')
  const source = sources.find((candidate) => !failedSources.includes(candidate))

  return (
    <div className="flex flex-col gap-3">
      {source ? (
        <Img
          key={source}
          src={source}
          alt={item.name}
          onLoad={() => setLoadedSource(source)}
          onError={() => setFailedSources((previous) => [...previous, source])}
          className="h-[260px] w-full rounded-xl sm:h-[374px]"
        />
      ) : (
        <div
          role="img"
          aria-label={`No photo available for ${item.name}`}
          className="flex h-[260px] w-full flex-col items-center justify-center gap-3 rounded-xl bg-chip text-muted sm:h-[374px]"
        >
          <ImageIcon size={32} aria-hidden="true" />
          <span className="text-sm">No photo available</span>
        </div>
      )}
      {source && loadedSource === source && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ImageIcon size={13} aria-hidden="true" />
          Item photograph
        </p>
      )}
    </div>
  )
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
  const [itemState, setItemState] = useState({ id: null, item: null, loading: true, error: '' })
  const { item, loading, error: loadError } = itemState
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  // Temporary feedback only: this placeholder does not submit a claim (RT-9).
  const [claimed, setClaimed] = useState(false)
  const shareFeedback = useRef(null)
  useEffect(() => {
    const feedback = { active: true, timer: null }
    shareFeedback.current = feedback
    setSaved(false)
    setCopied(false)
    setClaimed(false)
    return () => {
      feedback.active = false
      clearTimeout(feedback.timer)
    }
  }, [id])

  useEffect(() => {
    let active = true
    setItemState({ id, item: null, loading: true, error: '' })
    async function loadItem() {
      try {
        const fetchedItem = await fetchItem(id)
        if (active) setItemState({ id, item: fetchedItem, loading: false, error: '' })
      } catch (error) {
        if (active) {
          console.error('Unable to load item:', error)
          setItemState({ id, item: null, loading: false, error: 'Unable to load this item right now.' })
        }
      }
    }
    loadItem()
    return () => { active = false }
  }, [id])

  if (itemState.id !== id || loading) return <p role="status" className="text-sm text-muted">Loading item...</p>
  if (loadError) return <p role="alert" className="text-sm text-red-700">{loadError}</p>

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
  const reportedDate = formatDateLong(item.date)
  const detailPlace = optionalText(item.detailPlace) || optionalText(item.detail_place) || optionalText(item.place) || 'Location not provided'
  const collectionPoint = optionalText(item.collectionPoint) || optionalText(item.collection_point)
  const hours = optionalText(item.hours)

  const share = async () => {
    const url = window.location.href
    const feedback = shareFeedback.current
    try {
      if (navigator.share) await navigator.share({ title: item.name, url })
      else {
        await navigator.clipboard.writeText(url)
        if (!feedback?.active) return
        clearTimeout(feedback.timer)
        setCopied(true)
        feedback.timer = setTimeout(() => {
          feedback.timer = null
          if (feedback.active) setCopied(false)
        }, 2000)
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
            {reportedDate === 'Date unavailable' ? reportedDate : `Reported on ${reportedDate}`} · {item.category}
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
          <ItemPhoto key={id} item={item} />

          <div className="flex flex-col gap-[13px]">
            <h2 className="text-[19px] font-semibold text-ink">About this item</h2>
            <p className="text-sm leading-[1.8] text-muted">{optionalText(item.description) || 'No description provided.'}</p>
          </div>

          <hr className="border-line" />

          <div className="flex flex-col gap-6 sm:flex-row">
            <Fact icon={MapPin} label={found ? 'Found at' : 'Last seen at'} value={detailPlace} />
            <Fact icon={CalendarDays} label={found ? 'Date found' : 'Date lost'} value={reportedDate} />
            <Fact icon={Clock3} label="Approximate time" value={optionalText(item.time) || 'Time not provided'} />
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

            {found && (
              <>
                <hr className="border-line" />
                <div className="flex flex-col gap-4">
                  <h3 className="text-[13px] font-semibold text-ink">Collection information</h3>
                  {collectionPoint ? (
                    <>
                      <Fact icon={Building2} label="Collection point" value={collectionPoint} />
                      <p className="text-xs text-muted">{hours || 'Opening hours not provided.'}</p>
                      <p className="text-xs leading-[1.7] text-muted">
                        Please wait for your claim to be confirmed before visiting. Bring your university ID.
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted">Collection point not provided.</p>
                  )}
                </div>
              </>
            )}
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
