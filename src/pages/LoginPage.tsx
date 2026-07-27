import { useMemo, useState } from 'react'
import { Award, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDataStore } from '../store/dataStore'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { ThemeToggle } from '../components/layout/ThemeToggle'

// Matches scripts/seed.mjs's default (overridable there via SEED_DEMO_PASSWORD) —
// only works for accounts created by that script.
const DEMO_PASSWORD = 'Demo-Password-123!'

export function LoginPage() {
  const allUsers = useDataStore((s) => s.users)
  const users = useMemo(() => allUsers.filter((u) => u.status === 'active'), [allUsers])
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const demoAdmins = users.filter((u) => u.role === 'admin')
  const demoEmployees = users.filter((u) => u.role === 'employee').slice(0, 4)

  async function handleSignIn(signInEmail: string, signInPassword: string) {
    setError(null)
    setSubmitting(true)
    const { error: signInError } = await signIn(signInEmail, signInPassword)
    setSubmitting(false)
    if (signInError) setError(signInError)
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
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSignIn(email, password)
              }}
            >
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
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Supabase Auth · email/password</span>
                <button type="button" className="text-accent-text hover:underline">
                  Forgot password?
                </button>
              </div>
              {error && <p className="text-xs text-danger-text">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                Sign in
              </Button>
            </form>

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
          </div>
        </div>
      </div>
    </div>
  )
}
