import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Bookmark, ChevronRight, ClipboardList, LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Card, Field, Img, PageIntro, Select, StatusPill, Toggle, inputClass } from '../components/ui.jsx'
import { formatDate, getItem } from '../data/items.js'

const DEPARTMENTS = [
  'BS Computer Engineering',
  'BS Information Technology',
  'BS Nursing',
  'BS Accountancy',
  'AB Communication',
  'BS Education',
]

const sideLinks = [
  { icon: UserRound, label: 'Profile & settings', active: true },
  { icon: ClipboardList, label: 'My reports' },
  { icon: Bookmark, label: 'Saved items' },
  { icon: ShieldCheck, label: 'Security' },
]

const notificationOptions = [
  { key: 'claims', title: 'Claim updates', body: 'Get an email when there’s an update to a claim or one of your reports.' },
  { key: 'matches', title: 'Possible matches', body: 'Hear when a newly reported item might be the one you’ve lost.' },
  { key: 'digest', title: 'Campus lost & found digest', body: 'Receive a weekly roundup of recently reported items.' },
]

const recentReports = [getItem('LF-2048'), getItem('LF-2047')]

export default function Account() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    first: 'Carl Dominik',
    last: 'Salazar',
    department: DEPARTMENTS[0],
  })
  const [prefs, setPrefs] = useState({ claims: true, matches: true, digest: false })
  const [saved, setSaved] = useState(false)

  const setField = (key) => (e) => {
    setSaved(false)
    setProfile((p) => ({ ...p, [key]: e.target.value }))
  }

  const initials = ((profile.first[0] ?? '') + (profile.last[0] ?? '')).toUpperCase() || 'U'

  const submit = (e) => {
    e.preventDefault()
    // TODO: persist profile changes
    setSaved(true)
  }

  return (
    <>
      <PageIntro title="Your account" description="Manage your details, notifications and the items you’ve reported." />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-60">
          <Card className="flex flex-col items-center gap-3 p-6">
            <span className="flex size-[68px] items-center justify-center rounded-full bg-[#bae6fd] text-[23px] text-brand">
              {initials}
            </span>
            <div className="flex flex-col items-center gap-[7px] text-center">
              <p className="text-[17px] font-semibold text-ink">Carl Dominik E. Salazar</p>
              <p className="text-xs text-muted">Undergraduate student</p>
            </div>
            <p className="flex items-center gap-[5px] text-[11px] text-brand">
              <BadgeCheck size={14} />
              University verified
            </p>
            <hr className="w-full border-line" />
            <p className="text-[11px] text-muted">Member since September 2026</p>
          </Card>

          <nav aria-label="Account" className="flex flex-col gap-1.5">
            {sideLinks.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                type="button"
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-lg px-3.5 text-left text-[13px] ${
                  active ? 'bg-white font-semibold text-brand' : 'bg-page text-muted hover:bg-chip'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
            <hr className="my-1.5 border-line" />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-11 items-center gap-3 self-start px-3.5 text-[13px] text-muted hover:text-ink"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </nav>
        </aside>

        {/* Settings */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <form onSubmit={submit} className="flex flex-col gap-[22px] rounded-xl border border-line bg-white p-7">
            <div className="flex flex-col gap-[7px]">
              <h2 className="text-lg font-semibold text-ink">Personal information</h2>
              <p className="text-xs text-muted">Keep your campus profile up to date.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" htmlFor="first">
                <input id="first" value={profile.first} onChange={setField('first')} className={inputClass} />
              </Field>
              <Field label="Last name" htmlFor="last">
                <input id="last" value={profile.last} onChange={setField('last')} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="University email"
                htmlFor="email"
                help="Your university email is verified and cannot be changed here."
              >
                <div className="relative">
                  <input
                    id="email"
                    readOnly
                    value="cdesalazar.student@ua.edu.ph"
                    className={`${inputClass} pr-10`}
                  />
                  <LockKeyhole size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
                </div>
              </Field>
              <Field label="Department" htmlFor="department">
                <Select
                  id="department"
                  value={profile.department}
                  onChange={setField('department')}
                  options={DEPARTMENTS}
                />
              </Field>
            </div>

            <hr className="border-line" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted" role="status">
                {saved ? 'Changes saved.' : 'Your contact details are never shown publicly.'}
              </p>
              <Button type="submit" className="border-forest">Save changes</Button>
            </div>
          </form>

          <Card className="flex flex-col gap-[22px] p-7">
            <div className="flex flex-col gap-[7px]">
              <h2 className="text-lg font-semibold text-ink">Notifications</h2>
              <p className="text-xs text-muted">A helpful nudge, only when it matters.</p>
            </div>
            {notificationOptions.map((n, i) => (
              <div key={n.key} className="flex flex-col gap-[22px]">
                {i > 0 && <hr className="border-line" />}
                <div className="flex items-center gap-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="text-[13px] text-ink">{n.title}</p>
                    <p className="text-xs text-muted">{n.body}</p>
                  </div>
                  <Toggle
                    label={n.title}
                    checked={prefs[n.key]}
                    onChange={(v) => setPrefs((p) => ({ ...p, [n.key]: v }))}
                  />
                </div>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-5 p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-black">Your recent reports</h2>
              <Link to="/browse" className="text-xs font-semibold text-black hover:underline">
                View all reports →
              </Link>
            </div>
            {recentReports.map((r) => (
              <Link
                key={r.id}
                to={`/items/${r.id}`}
                className="group flex items-center gap-4 rounded-lg"
              >
                <Img src={r.image} alt="" className="h-[54px] w-[58px] shrink-0 rounded-[7px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="truncate text-[13px] text-black group-hover:underline">{r.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {r.id} · {r.place} · {formatDate(r.date)}
                  </p>
                </div>
                <StatusPill status={r.status} />
                <span className="hidden text-[11px] text-muted sm:inline">Active</span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}
