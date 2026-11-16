import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, Img, PageIntro } from '../components/ui.jsx'
import { fetchMyClaims } from '../data/claimsApi.js'

const claimLabels = {
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const claimStyles = {
  pending_review: 'bg-lost text-lostink',
  approved: 'bg-found text-forest',
  rejected: 'bg-red-50 text-red-700',
}

export default function MyClaims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyClaims().then(setClaims).catch((loadError) => {
      console.error('Unable to load claims:', loadError)
      setError('Unable to load your claims right now.')
    }).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageIntro title="My claims" description="Track ownership claims and collection instructions in one place." />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-muted">Loading your claims…</p> : claims.length ? (
        <div className="flex flex-col gap-5">
          {claims.map((claim) => <ClaimCard key={claim.id} claim={claim} />)}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <CheckCircle2 size={26} className="text-muted" />
          <h2 className="text-lg font-semibold text-ink">No claims yet</h2>
          <p className="max-w-sm text-sm text-muted">When you find a confirmed found item that belongs to you, your submitted claims will appear here.</p>
          <Button as={Link} to="/browse">Browse found items <ArrowRight size={16} /></Button>
        </Card>
      )}
    </>
  )
}

function ClaimCard({ claim }) {
  const item = claim.item
  const released = Boolean(claim.released_at)
  const Icon = claim.status === 'approved' ? CheckCircle2 : claim.status === 'rejected' ? XCircle : Clock3
  return (
    <Card className="flex flex-col gap-5 p-6 sm:flex-row">
      {item && <Img src={item.image} alt="" className="h-28 w-full shrink-0 rounded-lg sm:w-32" />}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">Claim #{claim.id.slice(0, 8)}</p>
            <h2 className="mt-1 text-base font-semibold text-ink">{item?.name ?? 'Item unavailable'}</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${claimStyles[claim.status]}`}><Icon size={13} />{released ? 'Released' : claimLabels[claim.status]}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          {claim.status === 'pending_review' && 'Campus staff are reviewing your ownership details. You will see their decision here.'}
          {claim.status === 'rejected' && (claim.review_note || 'This claim was not approved. You may contact the campus office for clarification.')}
          {claim.status === 'approved' && (released ? 'This item was recorded as released to you.' : `Approved. Collect it at ${claim.collection_point || item?.collectionPoint || 'the designated campus office'} with your school ID.`)}
        </p>
        {claim.status === 'approved' && !released && <p className="text-xs font-medium text-forest">Bring the same school ID used to verify this claim at collection.</p>}
        {item && <Link to={`/items/${item.id}`} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">View item <ArrowRight size={14} /></Link>}
      </div>
    </Card>
  )
}
