import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button, Card, Field, PageIntro, Select, StatusPill, inputClass } from '../components/ui.jsx'
import { confirmTurnover, fetchAdminData, releaseClaim, reviewClaim } from '../data/claimsApi.js'
import { deleteUser } from '../data/adminApi.js'
import { deleteItem } from '../data/itemsApi.js'
import { isAdmin } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

const EMPTY_STUDENT = {
  email: '',
  studentId: '',
  firstName: '',
  lastName: '',
  department: '',
  temporaryPassword: '',
}

const numberFormat = new Intl.NumberFormat('en-US')

export default function Admin() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [claimNotes, setClaimNotes] = useState({})
  const [claimPoints, setClaimPoints] = useState({})
  const [releaseIds, setReleaseIds] = useState({})
  const [student, setStudent] = useState(EMPTY_STUDENT)

  const loadDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    setError('')
    try {
      const { data } = await supabase.auth.getUser()
      if (!isAdmin(data.user)) {
        navigate('/home', { replace: true })
        return
      }
      const dashboard = await fetchAdminData()
      setItems(dashboard.items ?? [])
      setUsers(dashboard.users ?? [])
      setClaims(dashboard.claims ?? [])
    } catch (loadError) {
      console.error('Unable to load admin dashboard:', loadError)
      setError(`Unable to load dashboard data: ${loadError.message || 'unknown error'}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [navigate])

  const metrics = useMemo(() => {
    const found = items.filter((item) => item.status === 'found').length
    const lost = items.filter((item) => item.status === 'lost').length
    return [
      { label: 'Total reports', value: items.length, detail: 'All time', icon: ClipboardList, tone: 'bg-brand/10 text-brand' },
      { label: 'Found items', value: found, detail: `${items.length ? Math.round((found / items.length) * 100) : 0}% of reports`, icon: CheckCircle2, tone: 'bg-found text-forest' },
      { label: 'Lost items', value: lost, detail: 'Needs attention', icon: Activity, tone: 'bg-lost text-lostink' },
      { label: 'Registered users', value: users.length, detail: `${users.filter((user) => user.role === 'admin').length} admins`, icon: Users, tone: 'bg-chip text-ink' },
    ]
  }, [items, users])

  const trend = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setHours(0, 0, 0, 0)
      date.setDate(today.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return {
        key,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: items.filter((item) => item.date === key || item.created_at?.slice(0, 10) === key).length,
      }
    })
  }, [items])

  const maxTrend = Math.max(...trend.map((day) => day.count), 1)
  const topLocations = useMemo(() => getTopCounts(items, 'place'), [items])
  const topCategories = useMemo(() => getTopCounts(items, 'category'), [items])
  const reportCounts = useMemo(() => {
    const counts = new Map(items.map((item) => [item.reported_by, 0]))
    items.forEach((item) => {
      if (item.reported_by) counts.set(item.reported_by, (counts.get(item.reported_by) ?? 0) + 1)
    })
    return counts
  }, [items])

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    return users
      .filter((user) => !query || [user.email, user.firstName, user.lastName, user.department].join(' ').toLowerCase().includes(query))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [users, userSearch])

  const remove = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return
    setError('')
    try {
      await deleteItem(id)
      setItems((current) => current.filter((item) => item.id !== id))
    } catch (deleteError) {
      console.error('Unable to delete report:', deleteError)
      setError('Unable to delete this report.')
    }

    const confirmItemTurnover = async (id) => {
      try {
        await confirmTurnover(id)
        await loadDashboard(true)
      } catch (turnoverError) {
        console.error('Unable to confirm item turnover:', turnoverError)
        setError(turnoverError.message || 'Unable to confirm item turnover.')
      }
    }

    const decideClaim = async (claim, decision) => {
      try {
        await reviewClaim(claim.id, decision, claimNotes[claim.id], claimPoints[claim.id] || claim.collection_point || '')
        setClaimNotes((current) => ({ ...current, [claim.id]: '' }))
        setClaimPoints((current) => ({ ...current, [claim.id]: '' }))
        await loadDashboard(true)
      } catch (reviewError) {
        console.error('Unable to review claim:', reviewError)
        setError(reviewError.message || 'Unable to review claim.')
      }
    }

    const releaseApprovedClaim = async (claim) => {
      try {
        await releaseClaim(claim.id, releaseIds[claim.id] || '')
        setReleaseIds((current) => ({ ...current, [claim.id]: '' }))
        await loadDashboard(true)
      } catch (releaseError) {
        console.error('Unable to release item:', releaseError)
        setError(releaseError.message || 'Unable to release item.')
      }
    }
  }

  const updateStudent = (key) => (event) => {
    setStudent((current) => ({ ...current, [key]: event.target.value }))
    setNotice('')
    setError('')
  }

  const createStudent = async (event) => {
    event.preventDefault()
    setCreating(true)
    setNotice('')
    setError('')
    try {
      const { error: functionError } = await supabase.functions.invoke('create-student', { body: student })
      if (functionError) throw functionError
      setNotice(`Account created for ${student.email}. A one-time password setup email has been sent.`)
      setStudent(EMPTY_STUDENT)
      await loadDashboard(true)
    } catch (createError) {
      console.error('Unable to create student account:', createError)
      let message = createError.message || 'Unable to create the student account.'
      const response = createError.context
      if (response && typeof response.clone === 'function') {
        try {
          const body = await response.clone().json()
          if (body?.error) message = body.error
        } catch {
          // Keep the SDK error when the function did not return JSON.
        }

        const removeUser = async (user) => {
          if (!window.confirm(`Delete the account for ${user.email}? This cannot be undone.`)) return
          setDeletingUserId(user.id)
          setError('')
          try {
            await deleteUser(user.id)
            setUsers((current) => current.filter((entry) => entry.id !== user.id))
            setNotice(`Account for ${user.email} was deleted.`)
          } catch (deleteError) {
            console.error('Unable to delete user account:', deleteError)
            setError(deleteError.message || 'Unable to delete the user account.')
          } finally {
            setDeletingUserId('')
          }
        }
      }
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-5 lg:sticky lg:top-32 lg:w-56">
          <Card className="flex flex-col gap-2 p-5">
            <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">Admin console</p>
            <p className="text-sm font-semibold text-ink">Operations</p>
            <p className="text-xs leading-relaxed text-muted">Manage campus reports, claims, and student accounts.</p>
          </Card>
          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1.5">
            {[
              ['Overview', 'overview'],
              ['Operations', 'operations'],
              ['Community', 'community'],
              ['Create account', 'create-account'],
              ['Recent reports', 'reports'],
            ].map(([label, id]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-lg bg-page px-3.5 py-2.5 text-xs text-muted hover:bg-chip hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <PageIntro title="Operations overview" description="A live view of RETRACE activity, participation, and reports across campus.">
            <Button variant="outline" onClick={() => loadDashboard(true)} disabled={loading || refreshing}>
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </Button>
          </PageIntro>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-line bg-found px-4 py-3 text-sm text-forest">{notice}</p>}

      <section id="overview" aria-label="Key metrics" className="grid scroll-mt-32 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card key={label} className="flex items-start justify-between gap-4 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted">{label}</span>
              <strong className="text-[30px] leading-none font-semibold tracking-tight text-ink">{loading ? '—' : numberFormat.format(value)}</strong>
              <span className="text-[11px] text-muted">{detail}</span>
            </div>
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={19} /></span>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="flex min-h-[300px] flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Report activity</h2>
              <p className="mt-1 text-xs text-muted">New reports submitted over the last 7 days.</p>
            </div>
            <BarChart3 size={19} className="text-muted" />
          </div>
          <div className="flex min-h-[175px] flex-1 items-end gap-3 border-b border-line px-1">
            {trend.map((day) => (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-medium text-ink">{day.count || ''}</span>
                <div className="flex h-[132px] w-full items-end rounded-t-md bg-chip">
                  <div
                    className="w-full rounded-t-md bg-brand transition-all"
                    style={{ height: `${Math.max((day.count / maxTrend) * 100, day.count ? 8 : 0)}%` }}
                    title={`${day.count} reports on ${day.key}`}
                  />
                </div>
                <span className="text-[11px] text-muted">{day.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="text-base font-semibold text-ink">Report status</h2>
            <p className="mt-1 text-xs text-muted">The current balance of lost and found items.</p>
          </div>
          <div className="flex flex-col gap-5 pt-2">
            <ProgressRow label="Found" count={items.filter((item) => item.status === 'found').length} total={items.length} color="bg-forest" />
            <ProgressRow label="Lost" count={items.filter((item) => item.status === 'lost').length} total={items.length} color="bg-lostink" />
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
            <ShieldCheck size={16} className="text-forest" />
            Data is sourced from the live reports table.
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <InsightList title="Most reported locations" subtitle="Where the community is finding or losing items." rows={topLocations} />
        <InsightList title="Popular categories" subtitle="The types of items most often reported." rows={topCategories} />
      </section>

      <section id="operations" className="grid scroll-mt-32 gap-5 xl:grid-cols-2">
        <Card id="community" className="flex scroll-mt-32 flex-col gap-5 p-6">
          <div>
            <h2 className="text-base font-semibold text-ink">Turnover queue</h2>
            <p className="mt-1 text-xs text-muted">Confirm when a found item has reached the designated office.</p>
          </div>
          {items.filter((item) => item.status === 'found' && item.custody_status === 'pending_turnover').length ? (
            <div className="flex flex-col divide-y divide-line">
              {items.filter((item) => item.status === 'found' && item.custody_status === 'pending_turnover').map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    <p className="truncate text-xs text-muted">{item.id} · {item.collection_point || 'Office not specified'}</p>
                    {item.reporter && <p className="mt-1 text-[11px] text-brand">Reported by {item.reporter.firstName} {item.reporter.lastName} · {item.reporter.studentId || item.reporter.email}</p>}
                  </div>
                  <Button onClick={() => confirmItemTurnover(item.id)}>Confirm received</Button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No found items are waiting for turnover confirmation.</p>}
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="text-base font-semibold text-ink">Claim review</h2>
            <p className="mt-1 text-xs text-muted">Review private evidence before approving ownership.</p>
          </div>
          {claims.filter((claim) => claim.status === 'pending_review').length ? (
            <div className="flex flex-col gap-5">
              {claims.filter((claim) => claim.status === 'pending_review').map((claim) => {
                const item = items.find((entry) => entry.id === claim.item_id)
                return (
                  <div key={claim.id} className="flex flex-col gap-3 rounded-lg border border-line p-4">
                    <div className="flex justify-between gap-3">
                      <div><p className="text-sm font-semibold text-ink">{item?.name || claim.item_id}</p><p className="text-xs text-muted">{claim.claimant?.firstName} {claim.claimant?.lastName} · {claim.claimant?.studentId || claim.claimant?.email}</p></div>
                      {claim.evidenceUrl && <a href={claim.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">View evidence</a>}
                    </div>
                    <dl className="grid gap-2 text-xs sm:grid-cols-2"><div><dt className="text-muted">Lost at</dt><dd className="text-ink">{claim.lost_place}</dd></div><div><dt className="text-muted">Lost on</dt><dd className="text-ink">{claim.lost_date} · {claim.lost_time}</dd></div></dl>
                    <p className="rounded-md bg-page p-3 text-xs leading-relaxed text-ink">{claim.identifying_details}</p>
                    <input value={claimPoints[claim.id] ?? item?.collection_point ?? ''} onChange={(event) => setClaimPoints((current) => ({ ...current, [claim.id]: event.target.value }))} placeholder="Collection office for approved claim" className={inputClass} />
                    <textarea value={claimNotes[claim.id] ?? ''} onChange={(event) => setClaimNotes((current) => ({ ...current, [claim.id]: event.target.value }))} placeholder="Decision note (optional)" rows={2} className={`${inputClass} resize-y`} />
                    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => decideClaim(claim, 'rejected')}>Reject</Button><Button onClick={() => decideClaim(claim, 'approved')}>Approve claim</Button></div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-sm text-muted">No claims are waiting for review.</p>}
        </Card>
      </section>

      <Card className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Approved claims awaiting collection</h2>
          <p className="mt-1 text-xs text-muted">Verify the student’s school ID in person before recording the release.</p>
        </div>
        {claims.filter((claim) => claim.status === 'approved' && !claim.released_at).length ? (
          <div className="flex flex-col divide-y divide-line">
            {claims.filter((claim) => claim.status === 'approved' && !claim.released_at).map((claim) => (
              <div key={claim.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{items.find((item) => item.id === claim.item_id)?.name || claim.item_id}</p><p className="text-xs text-muted">{claim.claimant?.firstName} {claim.claimant?.lastName} · Collect at {claim.collection_point || 'designated office'}</p></div>
                <div className="flex w-full gap-2 sm:w-auto"><input value={releaseIds[claim.id] ?? ''} onChange={(event) => setReleaseIds((current) => ({ ...current, [claim.id]: event.target.value }))} placeholder="Verify student ID" className={`${inputClass} sm:w-40`} /><Button onClick={() => releaseApprovedClaim(claim)}>Record release</Button></div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted">No approved claims are waiting for collection.</p>}
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Community directory</h2>
            <p className="mt-1 text-xs text-muted">Registered students and administrators using RETRACE.</p>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs text-muted sm:w-64">
            <Search size={16} />
            <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="border-b border-line text-[11px] font-medium tracking-wide text-muted uppercase">
              <tr><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Department</th><th className="pb-3 font-medium">Reports</th><th className="pb-3 font-medium">Joined</th><th className="pb-3 text-right font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredUsers.slice(0, 8).map((user) => (
                <tr key={user.id}>
                  <td className="py-3.5"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-chip text-[11px] font-semibold text-forest">{initials(user)}</span><div><p className="font-medium text-ink">{displayName(user)}</p><p className="mt-0.5 text-[11px] text-muted">{user.email}</p></div></div></td>
                  <td className="py-3.5 text-muted">{user.department || '—'}</td>
                  <td className="py-3.5 font-medium text-ink">{reportCounts.get(user.id) ?? 0}</td>
                  <td className="py-3.5 text-muted">{formatShortDate(user.createdAt)}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${user.role === 'admin' ? 'bg-brand/10 text-brand' : 'bg-found text-forest'}`}>{user.role === 'admin' ? 'Admin' : 'Active'}</span>
                      <Button
                        variant="outline"
                        className="h-8 px-2.5"
                        disabled={deletingUserId === user.id}
                        onClick={() => removeUser(user)}
                        aria-label={`Delete ${user.email}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredUsers.length && <p className="py-8 text-center text-sm text-muted">No users match that search.</p>}
        </div>
        {filteredUsers.length > 8 && <p className="text-xs text-muted">Showing 8 of {filteredUsers.length} matching users.</p>}
      </Card>

      <Card id="create-account" className="flex scroll-mt-32 flex-col gap-5 p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chip text-brand"><UserPlus size={19} /></span>
          <div><h2 className="text-lg font-semibold text-ink">Create a student account</h2><p className="text-xs text-muted">Create an account with a university email and temporary password.</p></div>
        </div>
        <form onSubmit={createStudent} className="grid gap-5 sm:grid-cols-2">
          <Field label="University email" htmlFor="student-email"><input id="student-email" type="email" required value={student.email} onChange={updateStudent('email')} placeholder="student@ua.edu.ph" className={inputClass} /></Field>
          <Field label="Student ID number" htmlFor="student-id"><input id="student-id" required value={student.studentId} onChange={updateStudent('studentId')} placeholder="e.g. 2026-12345" className={inputClass} /></Field>
          <Field label="First name" htmlFor="student-first-name"><input id="student-first-name" required value={student.firstName} onChange={updateStudent('firstName')} className={inputClass} /></Field>
          <Field label="Last name" htmlFor="student-last-name"><input id="student-last-name" required value={student.lastName} onChange={updateStudent('lastName')} className={inputClass} /></Field>
          <Field label="Department" htmlFor="student-department"><Select id="student-department" required value={student.department} onChange={updateStudent('department')} placeholder="Select a department" options={['BS Computer Engineering', 'BS Information Technology', 'BS Nursing', 'BS Accountancy', 'AB Communication', 'BS Education']} /></Field>
          <Field label="Temporary password" htmlFor="student-password" help="The student must replace this password after their first login."><input id="student-password" type="password" minLength={8} required value={student.temporaryPassword} onChange={updateStudent('temporaryPassword')} className={inputClass} /></Field>
          <div className="flex items-end sm:justify-end"><Button type="submit" disabled={creating}>{creating ? 'Creating account…' : 'Create account'}</Button></div>
        </form>
      </Card>

      <Card id="reports" className="flex scroll-mt-32 flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-semibold text-ink">Recent reports</h2><p className="mt-1 text-xs text-muted">Moderate and remove reports from the live directory.</p></div><Link to="/browse" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">View directory <ArrowUpRight size={14} /></Link></div>
        {loading ? <p className="text-sm text-muted">Loading reports…</p> : items.length ? <div className="flex flex-col divide-y divide-line">{items.slice(0, 6).map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{item.name}</p><p className="truncate text-xs text-muted">{item.id} · {item.place} · {item.date}</p>{item.reporter && <p className="mt-1 truncate text-[11px] text-brand">Reported by {item.reporter.firstName} {item.reporter.lastName} · {item.reporter.studentId || item.reporter.email}</p>}</div><StatusPill status={item.status} /><Button variant="outline" onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={16} /> Delete</Button></div>)}</div> : <p className="text-sm text-muted">No reports have been submitted yet.</p>}
      </Card>
        </div>
      </div>
    </>
  )
}

function getTopCounts(items, key) {
  const counts = items.reduce((result, item) => {
    const value = item[key] || 'Unspecified'
    result.set(value, (result.get(value) ?? 0) + 1)
    return result
  }, new Map())
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
}

function ProgressRow({ label, count, total, color }) {
  const percentage = total ? Math.round((count / total) * 100) : 0
  return <div className="flex flex-col gap-2"><div className="flex justify-between text-xs"><span className="font-medium text-ink">{label}</span><span className="text-muted">{count} <span className="text-[11px]">({percentage}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-chip"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div></div>
}

function InsightList({ title, subtitle, rows }) {
  const max = rows[0]?.[1] ?? 1
  return <Card className="flex flex-col gap-5 p-6"><div><h2 className="text-base font-semibold text-ink">{title}</h2><p className="mt-1 text-xs text-muted">{subtitle}</p></div><div className="flex flex-col gap-4">{rows.length ? rows.map(([label, count]) => <div key={label} className="flex flex-col gap-2"><div className="flex justify-between gap-4 text-xs"><span className="truncate text-ink">{label}</span><span className="font-medium text-muted">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${(count / max) * 100}%` }} /></div></div>) : <p className="text-sm text-muted">No report data yet.</p>}</div></Card>
}

function displayName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unnamed user'
}

function initials(user) {
  const name = displayName(user)
  return name.split(/[\s@]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
}

function formatShortDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
