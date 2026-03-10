import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HolidaysTable } from '@/components/holidays/HolidaysTable'
import { AddHolidayDialog } from '@/components/holidays/AddHolidayDialog'
import { YearFilter } from '@/components/holidays/YearFilter'
import type { CompanyHoliday } from '@/types'

interface PageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function CompanyHolidaysPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { year: yearParam } = await searchParams
  const year = yearParam || new Date().getFullYear().toString()

  const { data: holidays } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date', { ascending: true })

  const isManager = profile?.role === 'manager'

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Holidays</h1>
          <p className="text-sm text-gray-500 mt-1">
            {holidays?.length ?? 0} holiday{(holidays?.length ?? 0) !== 1 ? 's' : ''} in {year}
          </p>
        </div>
        {isManager && <AddHolidayDialog />}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Holiday Calendar</p>
          <YearFilter />
        </div>
        <div className="p-1">
          <HolidaysTable
            holidays={(holidays ?? []) as CompanyHoliday[]}
            isManager={isManager}
          />
        </div>
      </div>
    </div>
  )
}
