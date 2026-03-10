'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChange() {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Password updated')
      setPassword('')
      setConfirm('')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>New Password</Label>
        <Input
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Confirm Password</Label>
        <Input
          type="password"
          placeholder="Repeat new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
      </div>
      <Button disabled={loading} onClick={handleChange}>
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </div>
  )
}
