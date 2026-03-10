'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from './DateRangePicker'
import { calculateBusinessDays } from '@/lib/utils/leave-calculator'
import { LEAVE_TYPE_OPTIONS } from '@/lib/constants/leave-types'
import type { CompanyHoliday } from '@/types'

interface ApplyLeaveFormProps {
  holidays: CompanyHoliday[]
}

export function ApplyLeaveForm({ holidays }: ApplyLeaveFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const holidayDates = holidays.map(h => h.date)
  const totalDays =
    form.start_date && form.end_date
      ? calculateBusinessDays(form.start_date, form.end_date, holidayDates)
      : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.leave_type) return toast.error('Please select a leave type')
    if (!form.start_date) return toast.error('Please select a start date')
    if (!form.end_date) return toast.error('Please select an end date')
    if (totalDays === 0) return toast.error('No working days in selected range')

    setLoading(true)
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to submit leave request')
        return
      }

      toast.success('Leave request submitted successfully!')
      router.push('/my-leaves')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Leave Type */}
      <div className="space-y-1.5">
        <Label>Leave Type</Label>
        <Select
          value={form.leave_type}
          onValueChange={val => setForm(f => ({ ...f, leave_type: val ?? '' }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {LEAVE_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <DateRangePicker
        startDate={form.start_date}
        endDate={form.end_date}
        holidays={holidays}
        onStartChange={val => setForm(f => ({ ...f, start_date: val }))}
        onEndChange={val => setForm(f => ({ ...f, end_date: val }))}
      />

      {/* Working days preview */}
      {form.start_date && form.end_date && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          totalDays === 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {totalDays === 0 ? (
            <>
              <Info className="h-4 w-4 shrink-0" />
              No working days in this range (weekends or holidays only)
            </>
          ) : (
            <>
              <CalendarCheck className="h-4 w-4 shrink-0" />
              <span>
                <strong>{totalDays} working day{totalDays !== 1 ? 's' : ''}</strong> will be deducted from your leave balance
              </span>
            </>
          )}
        </div>
      )}

      {/* Reason */}
      <div className="space-y-1.5">
        <Label>
          Reason <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <Textarea
          placeholder="Add a note for your manager..."
          value={form.reason}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right">{form.reason.length}/500</p>
      </div>

      {/* Holiday notice */}
      {holidays.length > 0 && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Dates crossed out in the calendar are company holidays or weekends
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading || totalDays === 0}>
        {loading ? 'Submitting...' : 'Submit Leave Request'}
      </Button>
    </form>
  )
}
