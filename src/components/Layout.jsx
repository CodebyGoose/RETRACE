import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { Button, Img } from './ui.jsx'

const links = [
  { to: '/home', label: 'Home', match: (p) => p === '/home' },
  { to: '/browse', label: 'Browse items', match: (p) => p.startsWith('/browse') || p.startsWith('/items') },
  { to: '/account', label: 'My reports', match: (p) => p === '/account' },
]

export function Navbar() {
  const { pathname } = useLocation()
  return (
    <header className="border-b border-line bg-white">
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
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <Button as={Link} to="/report" className="px-3.5 sm:px-[18px]">
            <Plus size={17} />
            <span className="hidden sm:inline">Report an item</span>
            <span className="sm:hidden">Report</span>
          </Button>
          <span className="hidden h-7 w-px bg-line sm:block" />
          <button type="button" aria-label="Notifications" className="text-muted hover:text-ink">
            <Bell size={20} />
          </button>
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
