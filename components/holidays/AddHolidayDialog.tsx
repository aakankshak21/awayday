'use client'

import { useState } from 'react'
import { format, isWeekend, isBefore, startOfDay } from 'date-fns'
import { CalendarIcon, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function AddHolidayDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState<Date | undefined>()
  const [calOpen, setCalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleClose() {
    setOpen(false)
    setName('')
    setDate(undefined)
    setError('')
  }

  async function handleSubmit() {
    setError('')
    if (!name.trim() || name.trim().length < 2) {
      setError('Holiday name must be at least 2 characters')
      return
    }
    if (!date) {
      setError('Please select a date')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date: format(date, 'yyyy-MM-dd') }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add holiday')
        return
      }
      toast.success('Holiday added')
      handleClose()
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const today = startOfDay(new Date())

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Holiday
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Company Holiday</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Holiday Name</Label>
              <Input
                placeholder="e.g. Christmas Day"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={d => {
                      setDate(d)
                      setCalOpen(false)
                    }}
                    disabled={d => isBefore(d, today) || isWeekend(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleSubmit}>
              {loading ? 'Adding...' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
