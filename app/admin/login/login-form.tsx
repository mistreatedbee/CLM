'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signIn } from '@/app/actions/auth'

export function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-base font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-base font-semibold text-foreground">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-13 rounded-xl border border-input bg-background px-4 text-lg text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          placeholder="admin@clm.org.za"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-base font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-13 w-full rounded-xl border border-input bg-background px-4 pr-12 text-lg text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="h-14 w-full gap-2 text-lg font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" /> Signing in...
          </>
        ) : (
          <>
            <LogIn className="size-5" /> Sign in
          </>
        )}
      </Button>
    </form>
  )
}
