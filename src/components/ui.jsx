import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MapPin } from 'lucide-react'
import { formatDate } from '../data/items.js'

/** Image with a soft placeholder if the file is missing from /public/images. */
export function Img({ src, alt = '', className = '', ...props }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-[#e9ede6] to-[#d5dcd1] ${className}`}
      />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      {...props}
    />
  )
}

export function StatusPill({ status, className = '' }) {
  const found = status === 'found'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-[5px] text-[11px] whitespace-pre ${
        found ? 'bg-found text-forest' : 'bg-lost text-lostink'
      } ${className}`}
    >
      {found ? '●  Found' : '○  Lost'}
    </span>
  )
}

const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-[18px] text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

const variants = {
  primary: 'border border-brand bg-brand text-white hover:bg-[#00166f]',
  dark: 'border border-black bg-black text-white hover:bg-[#1c1c1c]',
  outline: 'border border-line bg-white text-ink hover:bg-chip',
}

export function Button({ variant = 'primary', className = '', as: Comp = 'button', ...props }) {
  const Tag = Comp
  return <Tag className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function PageIntro({ title, description, titleClass = 'text-ink', children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h1 className={`text-[28px] font-semibold sm:text-[32px] ${titleClass}`}>{title}</h1>
        <p className="text-sm leading-[1.6] text-muted">{description}</p>
      </div>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full min-h-11 rounded-lg border border-line bg-white px-3.5 py-3 text-[13px] leading-normal text-ink placeholder:text-muted outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-white'

export function Field({ label, htmlFor, help, children, className = '' }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] text-ink">
        {label}
      </label>
      {children}
      {help && <p className="text-[11px] leading-normal text-muted">{help}</p>}
    </div>
  )
}

export function Select({ id, value, onChange, options, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 ${value ? '' : 'text-muted'}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        })}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[21px] w-9 shrink-0 items-center rounded-full p-[3px] transition-colors ${
        checked ? 'justify-end bg-brand' : 'justify-start bg-toggle-off'
      }`}
    >
      <span className="size-[15px] rounded-full bg-white" />
    </button>
  )
}

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-xl border border-line bg-white ${className}`} {...props}>
      {children}
    </div>
  )
}

export function ItemCard({ item, to }) {
  const date = item.date.includes('-') ? formatDate(item.date) : item.date
  return (
    <Card className="flex min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-[180px] shrink-0">
        <Img src={item.image} alt={item.name} className="size-full" />
        <StatusPill status={item.status} className="absolute top-3 left-3" />
      </div>
      <div className="flex flex-col gap-2.5 p-[18px]">
        <p className="text-[10px] font-medium tracking-wide text-muted uppercase">{item.category}</p>
        <h3 className="text-[15px] leading-snug font-semibold text-ink">{item.name}</h3>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={13} />
          {item.place}
        </p>
        <div className="flex items-start justify-between pt-1">
          <span className="text-[11px] text-muted">{date}</span>
          <Link to={to} className="text-xs font-semibold text-black hover:underline">
            View item ↗
          </Link>
        </div>
      </div>
    </Card>
  )
}
