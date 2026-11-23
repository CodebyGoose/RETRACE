import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { Button, Img } from './ui.jsx'
import { fetchNotifications } from '../data/notificationsApi.js'
import { isAdmin } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

const links = [
  { to: '/home', label: 'Home', match: (p) => p === '/home' },
  { to: '/browse', label: 'Browse items', match: (p) => p.startsWith('/browse') || p.startsWith('/items') },
  { to: '/account/reports', label: 'My reports', match: (p) => p === '/account/reports' },
  { to: '/claims', label: 'My claims', match: (p) => p === '/claims' },
]

export function Navbar() {
  const { pathname } = useLocation()
  const [admin, setAdmin] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    const loadNotifications = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!active) return
        setAdmin(isAdmin(data.user))
        setNotifications(await fetchNotifications())
      } catch (error) {
        console.error('Unable to load notifications:', error)
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-6 px-4 sm:px-8 lg:min-h-24 lg:px-16">
        <Link to="/home" className="flex items-center gap-3 py-3" aria-label="RETRACE home">
          <Img src="/images/seal.png" alt="University of the Assumption seal" className="size-[66px] rounded-full" />
          <div className="flex flex-col gap-[3px]">
            <span className="text-xs font-semibold text-muted">UNIVERSITY OF THE ASSUMPTION</span>
            <span className="font-glitch text-xl leading-none text-ink">RETRACE</span>
          </div>
        </Link>

        <nav className="order-3 flex w-full justify-center gap-8 lg:order-none lg:h-24 lg:w-auto" aria-label="Main">
          {links.map((l) => {
            const active = l.match(pathname)
            return (
              <NavLink
                key={l.to}
                to={l.to}
                className={`flex h-12 items-center border-b-[3px] text-sm transition-colors lg:h-full ${
                  active ? 'border-forest text-forest' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {l.label}
              </NavLink>
            )
          })}
          {admin && (
            <NavLink
              to="/admin"
              className={`flex h-12 items-center border-b-[3px] text-sm transition-colors lg:h-full ${
                pathname === '/admin' ? 'border-forest text-forest' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <Button as={Link} to="/report" className="px-3.5 sm:px-[18px]">
            <Plus size={17} />
            <span className="hidden sm:inline">Report an item</span>
            <span className="sm:hidden">Report</span>
          </Button>
          <span className="hidden h-7 w-px bg-line sm:block" />
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative text-muted hover:text-ink"
            >
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-brand" />}
            </button>
            {notificationsOpen && (
              <div className="absolute top-9 right-0 z-20 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  {notifications.length > 0 && <span className="text-[11px] text-muted">{notifications.length} updates</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length ? notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      to={notification.href}
                      onClick={() => setNotificationsOpen(false)}
                      className="block border-b border-line px-4 py-3 last:border-0 hover:bg-page"
                    >
                      <p className="text-xs font-semibold text-ink">{notification.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{notification.body}</p>
                    </Link>
                  )) : <p className="px-4 py-6 text-center text-xs text-muted">You’re all caught up.</p>}
                </div>
              </div>
            )}
          </div>
          <Link
            to="/account"
            aria-label="Your account"
            className="flex size-[38px] items-center justify-center rounded-full bg-brand/70 text-xs text-white"
          >
            J
          </Link>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted sm:px-8 lg:h-[76px] lg:px-28 lg:py-0">
        <p>© 2026 Atienza, Dorado, Resuello, Salazar · A little help finding your way back.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-ink">Campus safety</a>
          <a href="#" className="hover:text-ink">Help &amp; FAQs</a>
          <a href="#" className="hover:text-ink">Privacy</a>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar />
      <main className="flex flex-1 flex-col gap-8 px-4 pt-10 pb-12 sm:px-8 lg:px-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
