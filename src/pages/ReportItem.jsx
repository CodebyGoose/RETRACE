import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, HandHeart, Lightbulb, LockKeyhole, Search, ShieldCheck, X } from 'lucide-react'
import { Button, Card, Field, PageIntro, Select, inputClass } from '../components/ui.jsx'
import { CATEGORIES, LOCATIONS } from '../data/items.js'
import { createItem } from '../data/itemsApi.js'

const KEEP_POINTS = [
  'Main Library help desk',
  'Student Union information desk',
  'Engineering Building office',
  'Arts Building office',
  'Sports Centre front desk',
  'Campus Safety office',
]

const MAX_PHOTOS = 3
const MAX_BYTES = 5 * 1024 * 1024
const DRAFT_KEY = 'retrace:report-draft'

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = () => ({
  type: 'found',
  name: '',
  category: '',
  place: '',
  date: today(),
  specific: '',
  description: '',
  keptAt: '',
  contactName: '',
  consent: false,
})

const tips = [
  { title: 'Be specific', body: 'Include the colour, brand and where you found the item.' },
  { title: 'Add a clear photo', body: 'Good lighting makes it easier for an owner to recognise their item.' },
  { title: 'Keep some details private', body: 'Don’t share ID numbers, card details or everything inside a bag.' },
]

export default function ReportItem() {
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
      return saved ? { ...emptyForm(), ...saved, consent: false } : emptyForm()
    } catch {
      return emptyForm()
    }
  })
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)
  const photosRef = useRef(photos)
  photosRef.current = photos

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const found = form.type === 'found'
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const addPhotos = (fileList) => {
    setPhotoError('')
    const next = [...photos]
    for (const file of fileList) {
      if (next.length >= MAX_PHOTOS) {
        setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`)
        break
      }
      if (!/^image\/(jpeg|png)$/.test(file.type)) {
        setPhotoError('Photos must be JPG or PNG.')
        continue
      }
      if (file.size > MAX_BYTES) {
        setPhotoError('Each photo must be 5 MB or smaller.')
        continue
      }
      next.push({ name: file.name, size: file.size, url: URL.createObjectURL(file) })
    }
    setPhotos(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (idx) => {
    URL.revokeObjectURL(photos[idx].url)
    setPhotos(photos.filter((_, i) => i !== idx))
    setPhotoError('')
  }

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      setNotice('Draft saved on this device.')
    } catch {
      setNotice('Couldn’t save the draft in this browser.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      await createItem(form)
      localStorage.removeItem(DRAFT_KEY)
      photos.forEach((p) => URL.revokeObjectURL(p.url))
      setPhotos([])
      setForm(emptyForm())
      setNotice('Your report is published. Thank you for helping out!')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Unable to publish report:', error)
      setSubmitError('We could not publish your report. Please sign in and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageIntro
        title="Report an item"
        titleClass="text-brand"
        description="Lost it or found it? Share a few details and let the campus community help."
      />

      {notice && (
        <div role="status" className="flex items-center justify-between gap-4 rounded-lg border border-line bg-found px-4 py-3 text-[13px] text-forest">
          <span>
            {notice}{' '}
            {notice.startsWith('Your report') && (
              <Link to="/browse" className="font-semibold underline">Browse items</Link>
            )}
            {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <form onSubmit={submit} className="flex min-w-0 flex-col gap-6 lg:w-[66.5%] lg:shrink-0">
          {/* Report type */}
          <Card className="flex flex-col gap-5 p-7">
            <h2 className="text-[17px] font-semibold text-black">What would you like to report?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: 'lost', icon: Search, title: 'I lost an item', sub: 'Help me find something.' },
                { value: 'found', icon: HandHeart, title: 'I found an item', sub: 'Help it get back to its owner.' },
              ].map(({ value, icon: Icon, title, sub }) => {
                const selected = form.type === value
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-[18px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                      selected ? 'border-black' : 'border-line'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={selected}
                      onChange={set('type')}
                      className="sr-only"
                    />
                    <Icon size={23} className="shrink-0 text-ink" />
                    <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                      <span className="text-sm font-semibold text-black">{title}</span>
                      <span className="text-[11px] text-muted">{sub}</span>
                    </span>
                    <span
                      className={`size-[17px] shrink-0 rounded-full bg-white ${
                        selected ? 'border-[5px] border-black' : 'border border-line'
                      }`}
                    />
                  </label>
                )
              })}
            </div>
          </Card>

          {/* Item details */}
          <Card className="flex flex-col gap-[22px] p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-[#040405]">Item details</h2>
              <span className="text-[11px] text-muted">* Required fields</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Item name *" htmlFor="name">
                <input id="name" required value={form.name} onChange={set('name')} placeholder="e.g. Black Herschel backpack" className={inputClass} />
              </Field>
              <Field label="Category *" htmlFor="category">
                <Select
                  id="category"
                  value={form.category}
                  onChange={set('category')}
                  placeholder="Select a category"
                  options={CATEGORIES.map((c) => c.name)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={found ? 'Where did you find it? *' : 'Where did you lose it? *'} htmlFor="place">
                <Select id="place" value={form.place} onChange={set('place')} placeholder="Select a campus location" options={LOCATIONS} />
              </Field>
              <Field label={found ? 'Date found *' : 'Date lost *'} htmlFor="date">
                <input id="date" type="date" required max={today()} value={form.date} onChange={set('date')} className={inputClass} />
              </Field>
            </div>

            <Field label="Specific location" htmlFor="specific">
              <input id="specific" value={form.specific} onChange={set('specific')} placeholder="e.g. Second floor, beside a study desk" className={inputClass} />
            </Field>

            <Field
              label="Description *"
              htmlFor="description"
              help="Keep one or two identifying details private to help verify the owner."
            >
              <textarea
                id="description"
                required
                rows={4}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe the item: colour, brand, distinguishing marks."
                className={`${inputClass} min-h-[102px] resize-y`}
              />
            </Field>

            {/* Photos */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#040405]">Item photos</span>
                <span className="text-[11px] text-muted">Optional · up to {MAX_PHOTOS} photos</span>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-4">
                {photos.map((p, i) => (
                  <div key={p.url} className="flex items-start gap-4">
                    <img src={p.url} alt="" className="h-[76px] w-[86px] shrink-0 rounded-md object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-[7px] self-stretch">
                      <p className="truncate text-xs text-[#040405]">{p.name}</p>
                      <p className="text-[11px] text-muted">{(p.size / 1024 / 1024).toFixed(1)} MB · Uploaded</p>
                    </div>
                    <button type="button" aria-label={`Remove ${p.name}`} onClick={() => removePhoto(i)} className="text-muted hover:text-ink">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="self-start text-[11px] font-semibold text-[#040405] hover:underline"
                  >
                    {photos.length ? '+ Add another photo' : '+ Add a photo'}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={(e) => addPhotos(Array.from(e.target.files ?? []))}
                />
              </div>
              <p className={`text-[11px] ${photoError ? 'text-red-700' : 'text-muted'}`} role={photoError ? 'alert' : undefined}>
                {photoError || 'JPG or PNG, up to 5 MB each. Avoid including faces or personal information.'}
              </p>
            </div>

            {found && (
              <Field label="Where is the item being kept? *" htmlFor="keptAt">
                <Select
                  id="keptAt"
                  value={form.keptAt}
                  onChange={set('keptAt')}
                  placeholder="Select a collection point"
                  options={KEEP_POINTS}
                />
              </Field>
            )}
          </Card>

          {/* Contact */}
          <Card className="flex flex-col gap-5 p-7">
            <h2 className="text-[17px] font-semibold text-black">Your contact information</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="contactName">
                <input id="contactName" value={form.contactName} onChange={set('contactName')} placeholder="Joshua J. Atienza" className={inputClass} />
              </Field>
              <Field label="University email" htmlFor="email">
                <div className="relative">
                  <input
                    id="email"
                    readOnly
                    value="jjatienza.student@ua.edu.ph"
                    className={`${inputClass} pr-10 text-muted`}
                  />
                  <LockKeyhole size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
                </div>
              </Field>
            </div>
            <p className="flex items-center gap-[7px] text-[11px] text-muted">
              <ShieldCheck size={14} className="shrink-0" />
              Your email stays private. Campus staff will coordinate any claims.
            </p>
          </Card>

          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-[1.6] text-muted">
            <input type="checkbox" required checked={form.consent} onChange={set('consent')} className="peer sr-only" />
            <span
              className={`mt-px flex size-[17px] shrink-0 items-center justify-center rounded border text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${
                form.consent ? 'border-brand bg-brand' : 'border-line bg-white'
              }`}
            >
              {form.consent && <Check size={12} strokeWidth={3} />}
            </span>
            I confirm that this information is accurate and agree to the community guidelines.
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button as={Link} to="/browse" variant="outline">Cancel</Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={saveDraft}>Save draft</Button>
              <Button type="submit" className="border-black" disabled={submitting}>
                <ArrowRight size={17} />
                {submitting ? 'Publishing…' : 'Publish report'}
              </Button>
            </div>
          </div>
        </form>

        {/* Guidance */}
        <aside className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex flex-col gap-5 border-transparent p-6">
            <Lightbulb size={24} className="text-brand" />
            <h2 className="text-lg text-black">A little detail goes a long way.</h2>
            {tips.map((t) => (
              <div key={t.title} className="flex flex-col gap-[7px]">
                <h3 className="text-[13px] font-semibold text-black">{t.title}</h3>
                <p className="text-xs leading-[1.7] text-[#6b7a8f]">{t.body}</p>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="text-[15px] font-semibold text-black">What happens next?</h2>
            <p className="text-xs leading-[1.8] text-muted">
              Your report will appear in Browse items. If someone thinks it’s theirs, campus staff will help verify their claim and arrange a safe return.
            </p>
            <hr className="border-line" />
            <h3 className="text-xs font-semibold text-black">Found a valuable or university ID?</h3>
            <p className="text-xs leading-[1.7] text-muted">
              Please hand it to the nearest help desk or Campus Safety as soon as possible.
            </p>
            <a href="#" className="text-xs font-semibold text-black hover:underline">Contact Campus Safety ↗</a>
          </Card>
        </aside>
      </div>
    </>
  )
}
