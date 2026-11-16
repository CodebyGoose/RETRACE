import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Button, Card, Field, PageIntro, inputClass } from '../components/ui.jsx'
import { isAdmin } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/', { replace: true })
        return
      }
      const recoveryFlow = window.location.hash.includes('type=recovery')
      if (!recoveryFlow && data.session.user?.user_metadata?.must_change_password !== true) {
        navigate('/home', { replace: true })
        return
      }
      setRecovery(recoveryFlow)
      setReady(true)
    }).catch((sessionError) => {
      console.error('Unable to verify password session:', sessionError)
      setError('This password link is no longer valid. Request a new one.')
    })
  }, [navigate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }

    setSaving(true)
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })
    setSaving(false)
    if (passwordError) {
      setError(passwordError.message)
      return
    }
    const { data } = await supabase.auth.getUser()
    window.history.replaceState({}, '', '/change-password')
    navigate(isAdmin(data.user) ? '/admin' : '/home', { replace: true })
  }

  if (!ready) return <p className="text-sm text-muted">Checking your password link…</p>

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <PageIntro
        title={recovery ? 'Reset your password' : 'Set your password'}
        description={recovery ? 'Choose a new password to restore access to your account.' : 'Your temporary password must be replaced before you continue.'}
      />
      <Card className="flex flex-col gap-6 p-7">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="New password" htmlFor="new-password" help="Use at least 8 characters.">
            <div className="relative">
              <input id="new-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-10`} />
              <LockKeyhole size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
            </div>
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-password">
            <div className="relative">
              <input id="confirm-password" type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={`${inputClass} pr-10`} />
              <LockKeyhole size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
            </div>
          </Field>
          <Button type="submit" disabled={saving} className="self-start">
            <ArrowRight size={17} />
            {saving ? 'Saving password…' : 'Save password'}
          </Button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </form>
      </Card>
    </div>
  )
}
