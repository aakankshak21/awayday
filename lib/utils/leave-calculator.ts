import { eachDayOfInterval, isWeekend, parseISO, format } from 'date-fns'

/**
 * Calculates the number of working days between two dates,
 * excluding weekends and company holidays.
 */
export function calculateBusinessDays(
  startDate: Date | string,
  endDate: Date | string,
  holidayDates: string[] = []
): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

  if (end < start) return 0

  const days = eachDayOfInterval({ start, end })
  const holidaySet = new Set(holidayDates.map(d => format(parseISO(d), 'yyyy-MM-dd')))

  return days.filter(day => {
    if (isWeekend(day)) return false
    if (holidaySet.has(format(day, 'yyyy-MM-dd'))) return false
    return true
  }).length
}

/**
 * Returns true if a date is a weekend or a company holiday.
 */
export function isBlockedDate(date: Date, holidayDates: string[]): boolean {
  if (isWeekend(date)) return true
  const dateStr = format(date, 'yyyy-MM-dd')
  return holidayDates.some(h => format(parseISO(h), 'yyyy-MM-dd') === dateStr)
}

/**
 * Returns true if a date is strictly in the future (after today).
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}
