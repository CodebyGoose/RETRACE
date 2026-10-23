import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CircleHelp, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button, Field, Img, inputClass } from '../components/ui.jsx'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })
    setSubmitting(false)
    if (authError) {
      setError(authError.message)
      return
    }
    navigate('/home')
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Campus welcome panel */}
      <section className="relative hidden w-[628px] shrink-0 flex-col justify-between overflow-hidden bg-[#173d31] p-12 lg:flex xl:w-[44%]">
        <Img src="/images/campus.png" alt="" className="absolute inset-0 size-full object-bottom" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,29,145,0.6)] via-[rgba(16,25,44,0.2)] via-40% to-[rgba(7,16,53,0.96)] to-[98.5%]" />

        <div className="relative flex items-center gap-3">
          <Img src="/images/seal.png" alt="" className="size-[74px] rounded-full" />
          <div className="flex flex-col gap-[3px]">
            <span className="text-xs font-semibold text-sage">UNIVERSITY OF THE ASSUMPTION</span>
            <span className="font-glitch text-[40px] leading-none text-white">RETRACE</span>
          </div>
        </div>

        <div className="relative flex flex-col gap-6 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-px w-7 bg-sage" />
            <span className="text-[11px] text-sage">OUR CAMPUS. OUR COMMUNITY.</span>
          </div>
          <h2 className="text-[44px] leading-[1.12] font-medium text-white">
            Good things find
            <br />
            their way back.
          </h2>
          <p className="max-w-[440px] text-[15px] leading-[1.8] text-sage">
            A familiar place for the things you’ve misplaced. Together, we make campus a little more connected.
          </p>
          <p className="flex items-center gap-2.5 pt-3 text-xs text-sage">
            <ShieldCheck size={20} />
            Only for the Assumptionists.
          </p>
        </div>
      </section>

      {/* Sign in */}
      <section className="flex min-w-0 flex-1 flex-col items-center justify-between gap-8 px-6 py-10 sm:px-12 lg:px-20">
        <div className="flex w-full items-center justify-end gap-[7px] text-xs text-muted">
          <CircleHelp size={16} />
          <a href="#" className="hover:text-ink">Need help?</a>
        </div>

        <div className="flex w-full max-w-[412px] flex-col items-center gap-10">
          <Img src="/images/seal.png" alt="University of the Assumption seal" className="size-[200px] rounded-full lg:size-[254px]" />

          <form onSubmit={submit} className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] font-semibold text-ink">Welcome back.</h1>
              <p className="text-sm leading-[1.7] text-muted">
                Sign in to find what’s missing, or help someone find what’s theirs.
              </p>
            </div>

            <div className="flex flex-col gap-[18px]">
              <Field label="University Email/Student No." htmlFor="identifier">
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="jus-resuello.student@ua.edu.ph"
                  className={inputClass}
                />
              </Field>
              <Field label="Password" htmlFor="password">
                <div className="relative">
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    {show ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-muted select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="flex size-4 items-center justify-center rounded border border-line bg-white text-white peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                  {remember && <Check size={12} strokeWidth={3} />}
                </span>
                Remember me
              </label>
              <a href="#" className="text-brand hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full border-forest">
              <ArrowRight size={17} />
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            <p className="text-center text-[11px] leading-[1.7] text-muted">
              By continuing, you agree to our community <b>guidelines</b> and <b>privacy policy.</b>
            </p>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted">
          © 2026 Atienza, Dorado, Resuello, Salazar · Campus care, connected.
        </p>
      </section>
    </div>
  )
}
