import { useMemo, useState } from 'react'
import { Award, Building2, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { ThemeToggle } from '../components/layout/ThemeToggle'

// Matches scripts/seed.mjs's default (overridable there via SEED_DEMO_PASSWORD) —
// only works for accounts created by that script.
const DEMO_PASSWORD = 'Demo-Password-123!'

const MIN_PASSWORD_LENGTH = 8

export function LoginPage() {
  const allUsers = useDataStore((s) => s.users)
  const users = useMemo(() => allUsers.filter((u) => u.status === 'active'), [allUsers])
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isNewCompany, setIsNewCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  const demoAdmins = users.filter((u) => u.role === 'admin')
  const demoEmployees = users.filter((u) => u.role === 'employee').slice(0, 4)

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setConfirmationSentTo(null)
    setPassword('')
    setConfirmPassword('')
    setIsNewCompany(false)
    setCompanyName('')
  }

  async function handleSignIn(signInEmail: string, signInPassword: string) {
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(signInEmail, signInPassword)
    setSubmitting(false)
    if (signInError) setError(signInError)
  }

  async function handleSignUp() {
    setError(null)
    if (!name.trim()) return setError('Enter your full name.')
    if (isNewCompany && !companyName.trim()) return setError('Enter your company name.')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    }
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setSubmitting(true)
    const { error: signUpError, needsConfirmation } = await signUp(
      email,
      password,
      name.trim(),
      isNewCompany ? companyName.trim() : undefined,
    )
    setSubmitting(false)
    if (signUpError) return setError(signUpError)
    if (needsConfirmation) {
      setConfirmationSentTo(email)
    }
    // If confirmation isn't required, onAuthStateChange already picked up the new
    // session and App will redirect away from /login on its own.
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex justify-end p-5">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
              <Award size={24} />
            </div>
            <h1 className="text-xl font-semibold text-text-primary">Goal &amp; Certification Tracking</h1>
            <p className="mt-1 text-sm text-text-secondary">Sign in to manage or complete your development goals</p>
          </div>

          <div className="rounded-xl bg-bg-elevated border border-border/10 shadow-card p-6">
            {confirmationSentTo ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-text-primary">
                  We sent a confirmation link to <span className="font-medium">{confirmationSentTo}</span>.
                </p>
                <p className="text-sm text-text-secondary">
                  Click the link in that email to activate your account, then sign in below.
                </p>
                <Button className="w-full" onClick={() => switchMode('signin')}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (mode === 'signin') void handleSignIn(email, password)
                  else void handleSignUp()
                }}
              >
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="name"
                        placeholder="Jane Doe"
                        className="pl-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={isNewCompany}
                        onChange={(e) => setIsNewCompany(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border/30"
                      />
                      I&apos;m setting up a new company
                    </label>
                    {!isNewCompany && (
                      <p className="text-xs text-text-muted">
                        Your email&apos;s domain must already be registered by your company&apos;s admin.
                      </p>
                    )}
                    {isNewCompany && (
                      <div>
                        <Label htmlFor="company-name">Company name</Label>
                        <div className="relative">
                          <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                          <Input
                            id="company-name"
                            placeholder="Acme Corp"
                            className="pl-9"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          You&apos;ll be the admin. Your email&apos;s domain becomes the one other employees
                          use to join.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Work email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                {mode === 'signup' && (
                  <div>
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Supabase Auth · email/password</span>
                  {mode === 'signin' && (
                    <button type="button" className="text-accent-text hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                {error && <p className="text-xs text-danger-text">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    submitting ||
                    !email ||
                    !password ||
                    (mode === 'signup' && (!name || !confirmPassword || (isNewCompany && !companyName)))
                  }
                >
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Button>
                <p className="text-center text-xs text-text-muted">
                  {mode === 'signin' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button type="button" className="text-accent-text hover:underline" onClick={() => switchMode('signup')}>
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button" className="text-accent-text hover:underline" onClick={() => switchMode('signin')}>
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}

            {mode === 'signin' && !confirmationSentTo && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/15" />
                  <span className="text-xs text-text-muted">Frontend preview — quick demo login</span>
                  <div className="h-px flex-1 bg-border/15" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Admin</p>
                    <div className="space-y-1.5">
                      {demoAdmins.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => void handleSignIn(u.email, DEMO_PASSWORD)}
                          className="flex w-full items-center gap-3 rounded-lg border border-border/15 px-3 py-2 text-left transition-colors hover:bg-bg-raised"
                        >
                          <Avatar name={u.name} color={u.avatarColor} size={28} />
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-sm font-medium text-text-primary">{u.name}</span>
                            <span className="block truncate text-xs text-text-muted">{u.department} · Admin</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Employee</p>
                    <div className="space-y-1.5">
                      {demoEmployees.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => void handleSignIn(u.email, DEMO_PASSWORD)}
                          className="flex w-full items-center gap-3 rounded-lg border border-border/15 px-3 py-2 text-left transition-colors hover:bg-bg-raised"
                        >
                          <Avatar name={u.name} color={u.avatarColor} size={28} />
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-sm font-medium text-text-primary">{u.name}</span>
                            <span className="block truncate text-xs text-text-muted">{u.department} · Employee</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
