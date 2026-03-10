'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { signupSchema } from '@/lib/validations/auth'

type Role = 'employee' | 'manager'

const ROLES: { value: Role; label: string; description: string; icon: typeof UserRound }[] = [
  {
    value: 'employee',
    label: 'Employee',
    description: 'Apply and track your leaves',
    icon: UserRound,
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Approve leaves & view team analytics',
    icon: ShieldCheck,
  },
]

export function SignupForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('employee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState({ full_name: '', email: '', password: '' })

  const domain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = signupSchema.safeParse({ ...values, role })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }
      router.push('/login?message=Account created! You can now sign in.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map(({ value, label, description, icon: Icon }) => {
          const active = role === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all',
                active
                  ? value === 'manager'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className={cn(
                'rounded-lg p-1.5',
                active
                  ? value === 'manager' ? 'bg-violet-100' : 'bg-blue-100'
                  : 'bg-gray-100'
              )}>
                <Icon className={cn(
                  'h-4 w-4',
                  active
                    ? value === 'manager' ? 'text-violet-600' : 'text-blue-600'
                    : 'text-gray-400'
                )} />
              </div>
              <p className={cn(
                'text-sm font-semibold mt-1',
                active
                  ? value === 'manager' ? 'text-violet-700' : 'text-blue-700'
                  : 'text-gray-700'
              )}>
                {label}
              </p>
              <p className="text-xs text-gray-400 leading-snug">{description}</p>
            </button>
          )
        })}
      </div>

      {/* Fields */}
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="Jane Smith"
          value={values.full_name}
          onChange={e => setValues(v => ({ ...v, full_name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Work Email</Label>
        <Input
          id="email"
          type="email"
          placeholder={`you@${domain || 'company.com'}`}
          value={values.email}
          onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
          required
        />
        {domain && (
          <p className="text-xs text-gray-400">Must use a @{domain} email address</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          value={values.password}
          onChange={e => setValues(v => ({ ...v, password: e.target.value }))}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        className={cn(
          'w-full',
          role === 'manager' ? 'bg-violet-600 hover:bg-violet-700' : ''
        )}
        disabled={loading}
      >
        {loading ? 'Creating account…' : `Create ${role === 'manager' ? 'Manager' : 'Employee'} Account`}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
      </p>
    </form>
  )
}
