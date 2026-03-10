'use client'

import { useState } from 'react'
import { format, isWeekend, isBefore, startOfDay, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CompanyHoliday } from '@/types'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  holidays: CompanyHoliday[]
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
}

export function DateRangePicker({
  startDate,
  endDate,
  holidays,
  onStartChange,
  onEndChange,
}: DateRangePickerProps) {
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const today = startOfDay(new Date())
  const holidayDates = new Set(holidays.map(h => h.date))

  function isDisabled(date: Date) {
    if (isBefore(date, today)) return true
    if (isWeekend(date)) return true
    if (holidayDates.has(format(date, 'yyyy-MM-dd'))) return true
    return false
  }

  function getHolidayName(date: Date) {
    const key = format(date, 'yyyy-MM-dd')
    return holidays.find(h => h.date === key)?.name
  }

  const startDateObj = startDate ? parseISO(startDate) : undefined
  const endDateObj = endDate ? parseISO(endDate) : undefined

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Start Date */}
      <div className="space-y-1.5">
        <Label>Start Date</Label>
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(parseISO(startDate), 'MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDateObj}
              onSelect={date => {
                if (!date) return
                const formatted = format(date, 'yyyy-MM-dd')
                onStartChange(formatted)
                // Reset end date if it's before new start
                if (endDate && endDate < formatted) onEndChange('')
                setStartOpen(false)
              }}
              disabled={isDisabled}
              modifiers={{ holiday: (date) => !!getHolidayName(date) }}
              modifiersClassNames={{ holiday: 'text-red-400 line-through' }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div className="space-y-1.5">
        <Label>End Date</Label>
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(parseISO(endDate), 'MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDateObj}
              onSelect={date => {
                if (!date) return
                onEndChange(format(date, 'yyyy-MM-dd'))
                setEndOpen(false)
              }}
              disabled={date =>
                isDisabled(date) ||
                (startDate ? isBefore(date, parseISO(startDate)) : false)
              }
              modifiers={{ holiday: (date) => !!getHolidayName(date) }}
              modifiersClassNames={{ holiday: 'text-red-400 line-through' }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
