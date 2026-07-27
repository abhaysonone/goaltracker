import { useState } from 'react'
import { Award, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { ThemeToggle } from '../components/layout/ThemeToggle'

const MIN_PASSWORD_LENGTH = 8

// Shown whenever authStore.passwordRecovery is true: after clicking a password
// reset/invite email link, regardless of whether the account ever had a password
// before (this is also how admin-created employees set their first one).
export function SetNewPasswordPage() {
  const updatePassword = useAuthStore((s) => s.updatePassword)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    }
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setSubmitting(true)
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)
    if (updateError) return setError(updateError)
    setDone(true)
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
            <h1 className="text-xl font-semibold text-text-primary">Set your password</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {done ? 'All set — taking you in…' : 'Choose a password to finish signing in.'}
            </p>
          </div>

          <div className="rounded-xl bg-bg-elevated border border-border/10 shadow-card p-6">
            {!done && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSubmit()
                }}
              >
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                {error && <p className="text-xs text-danger-text">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting || !password || !confirmPassword}>
                  Set password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
