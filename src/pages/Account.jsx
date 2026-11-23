import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, Bookmark, ChevronRight, ClipboardList, LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Button, Card, Field, Img, PageIntro, Select, StatusPill, Toggle, inputClass } from '../components/ui.jsx'
import { formatDate } from '../data/items.js'
import { fetchMyItems } from '../data/itemsApi.js'
import { supabase } from '../lib/supabase.js'

const DEPARTMENTS = [
  'BS Computer Engineering',
  'BS Information Technology',
  'BS Nursing',
  'BS Accountancy',
  'AB Communication',
  'BS Education',
]

const sideLinks = [
  { icon: UserRound, label: 'Profile & settings', key: 'profile' },
  { icon: ClipboardList, label: 'My reports', key: 'reports' },
  { icon: Bookmark, label: 'Saved items', key: 'saved' },
  { icon: ShieldCheck, label: 'Security', key: 'security' },
]

const notificationOptions = [
  { key: 'claims', title: 'Claim updates', body: 'Get an email when there’s an update to a claim or one of your reports.' },
  { key: 'matches', title: 'Possible matches', body: 'Hear when a newly reported item might be the one you’ve lost.' },
  { key: 'digest', title: 'Campus lost & found digest', body: 'Receive a weekly roundup of recently reported items.' },
]

const SAVED_ITEMS_KEY = 'retrace:saved-items'

export default function Account() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [user, setUser] = useState(null)
  const [reports, setReports] = useState([])
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState({ first: '', last: '', studentId: '', department: DEPARTMENTS[0] })
  const [prefs, setPrefs] = useState({ claims: true, matches: true, digest: false })
  const [savingPreference, setSavingPreference] = useState('')
  const [notificationStatus, setNotificationStatus] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [section, setSection] = useState(pathname === '/account/reports' ? 'reports' : 'profile')
  const [savedItems, setSavedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    Promise.all([supabase.auth.getUser(), fetchMyItems()]).then(([{ data }, userItems]) => {
      const currentUser = data.user
      setUser(currentUser)
      setReports(userItems)
      const metadata = currentUser?.user_metadata ?? {}
      setProfile({
        first: metadata.first_name ?? metadata.first ?? '',
        last: metadata.last_name ?? metadata.last ?? '',
        studentId: metadata.student_id ?? '',
        department: metadata.department ?? DEPARTMENTS[0],
      })
      setPrefs({
        claims: metadata.notification_preferences?.claims ?? true,
        matches: metadata.notification_preferences?.matches ?? true,
        digest: metadata.notification_preferences?.digest ?? false,
      })
    }).catch((error) => {
      console.error('Unable to load account:', error)
      setLoadError('Unable to load your account right now.')
    })
  }, [])

  const setField = (key) => (e) => {
    setSaved(false)
    setProfile((p) => ({ ...p, [key]: e.target.value }))
  }

  const initials = ((profile.first[0] ?? '') + (profile.last[0] ?? '')).toUpperCase() || 'U'

  const updatePreference = async (key) => {
    const previous = prefs
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSavingPreference(key)
    setNotificationStatus('')
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { notification_preferences: next },
      })
      if (error) throw error
      setUser(data.user)
      setNotificationStatus('Notification preferences saved.')
    } catch (error) {
      console.error('Unable to save notification preference:', error)
      setPrefs(previous)
      setNotificationStatus(error.message || 'Unable to save notification preferences right now.')
    } finally {
      setSavingPreference('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaved(false)
    setSaveError('')
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: profile.first.trim(),
          last_name: profile.last.trim(),
          student_id: profile.studentId.trim(),
          department: profile.department,
        },
      })
      if (error) throw error
      setUser(data.user)
      setSaved(true)
    } catch (error) {
      console.error('Unable to save profile:', error)
      setSaveError(error.message || 'Unable to save your profile right now.')
    }
  }

  return (
    <>
      <PageIntro
        title={section === 'reports' ? 'My reports' : 'Your account'}
        description={section === 'reports' ? 'Review the items you’ve reported.' : 'Manage your details, notifications and the items you’ve reported.'}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-60">
          <Card className="flex flex-col items-center gap-3 p-6">
            <span className="flex size-[68px] items-center justify-center rounded-full bg-[#bae6fd] text-[23px] text-brand">
              {initials}
            </span>
            <div className="flex flex-col items-center gap-[7px] text-center">
                <p className="text-[17px] font-semibold text-ink">{`${profile.first} ${profile.last}`.trim() || 'University member'}</p>
                <p className="text-xs text-muted">{user?.email ?? 'Signed-in account'}</p>
            </div>
            <p className="flex items-center gap-[5px] text-[11px] text-brand">
              <BadgeCheck size={14} />
              University verified
            </p>
            <hr className="w-full border-line" />
            <p className="text-[11px] text-muted">Member since {user?.created_at ? formatDate(user.created_at.slice(0, 10)) : 'today'}</p>
          </Card>

          <nav aria-label="Account" className="flex flex-col gap-1.5">
            {sideLinks.map(({ icon: Icon, label, key }) => (
              <button
                key={label}
                type="button"
                aria-current={section === key ? 'page' : undefined}
                onClick={() => setSection(key)}
                className={`flex h-11 items-center gap-3 rounded-lg px-3.5 text-left text-[13px] ${
                  section === key ? 'bg-white font-semibold text-brand' : 'bg-page text-muted hover:bg-chip'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
            <hr className="my-1.5 border-line" />
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/')
              }}
              className="flex h-11 items-center gap-3 self-start px-3.5 text-[13px] text-muted hover:text-ink"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </nav>
        </aside>

        {/* Settings */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {section === 'profile' && (
            <>
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
                    value={user?.email ?? ''}
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

              <Field label="Student ID number" htmlFor="studentId" help="This number is issued and managed by the university.">
              <input
                id="studentId"
                readOnly
                value={profile.studentId}
                placeholder="Assigned by the university"
                className={`${inputClass} bg-page text-muted`}
              />
            </Field>

            <hr className="border-line" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted" role="status">
                {saveError ? <span className="text-red-700" role="alert">{saveError}</span> : saved ? 'Changes saved.' : 'Your contact details are never shown publicly.'}
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
                    disabled={Boolean(savingPreference)}
                    onChange={() => updatePreference(n.key)}
                  />
                </div>
              </div>
            ))}
            <p className={`text-[11px] ${notificationStatus.startsWith('Unable') ? 'text-red-700' : 'text-muted'}`} role="status">
              {notificationStatus}
            </p>
              </Card>
            </>
          )}

          {section === 'reports' && <Card className="flex flex-col gap-5 p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-black">Your recent reports</h2>
              <Link to="/browse" className="text-xs font-semibold text-black hover:underline">
                View all reports →
              </Link>
            </div>
            {loadError ? <p className="text-sm text-red-700">{loadError}</p> : reports.length ? reports.map((r) => (
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
                <span className="hidden text-[11px] text-muted sm:inline">
                  {r.status === 'found'
                    ? r.custody_status === 'pending_turnover' ? 'Pending turnover' : r.custody_status === 'in_custody' ? 'In custody' : 'Claimed'
                    : 'Active'}
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </Link>
            )) : <p className="text-sm text-muted">You have not reported any items yet.</p>}
          </Card>}

          {section === 'saved' && (
            <Card className="flex flex-col gap-4 p-7">
              <h2 className="text-lg font-semibold text-ink">Saved items</h2>
              {savedItems.length ? savedItems.map((item) => (
                <Link key={item.id} to={`/items/${item.id}`} className="flex items-center gap-4 rounded-lg border-b border-line py-3 last:border-0">
                  <Img src={item.image} alt="" className="h-[54px] w-[58px] shrink-0 rounded-[7px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                    <span className="block truncate text-xs text-muted">{item.id} · {item.place}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted" />
                </Link>
              )) : (
                <>
                  <p className="text-sm text-muted">Items you save while browsing will appear here.</p>
                  <Button as={Link} to="/browse" className="self-start">Browse items</Button>
                </>
              )}
            </Card>
          )}

          {section === 'security' && (
            <Card className="flex flex-col gap-4 p-7">
              <h2 className="text-lg font-semibold text-ink">Security</h2>
              <p className="text-sm text-muted">Password changes are managed by the university admin.</p>
              <p className="text-xs text-muted">Contact the admin if you need your password reset.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
