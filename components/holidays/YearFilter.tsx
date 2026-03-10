'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function YearFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentYear = new Date().getFullYear()
  const year = searchParams.get('year') || currentYear.toString()

  const years = [currentYear - 1, currentYear, currentYear + 1].map(String)

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={year} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map(y => (
          <SelectItem key={y} value={y}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
