'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  fullName: string
  email: string
  department: string | null
}

export function ProfileForm({ fullName, email, department }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [dept, setDept] = useState(department ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name.trim(), department: dept.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        return
      }
      toast.success('Profile updated')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled className="bg-gray-50 text-gray-400 cursor-not-allowed" />
        <p className="text-xs text-gray-400">Email cannot be changed</p>
      </div>
      <div className="space-y-1.5">
        <Label>Department <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Input
          placeholder="e.g. Engineering"
          value={dept}
          onChange={e => setDept(e.target.value)}
        />
      </div>
      <Button disabled={loading} onClick={handleSave}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}
