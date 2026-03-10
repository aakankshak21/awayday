import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CalendarX, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ApplyLeaveForm } from '@/components/leaves/ApplyLeaveForm'
import { LEAVE_TYPE_OPTIONS } from '@/lib/constants/leave-types'
import type { CompanyHoliday } from '@/types'

export default async function ApplyLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_domain')
    .eq('id', user.id)
    .single()

  const year = new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]

  const { data: holidays } = await supabase
    .from('company_holidays')
    .select('*')
    .eq('company_domain', profile?.company_domain ?? '')
    .gte('date', today)
    .lte('date', `${year}-12-31`)
    .order('date', { ascending: true })

  const { data: balances } = await supabase
    .from('leave_balances')
    .select('leave_type, allocated, used, pending')
    .eq('employee_id', user.id)
    .eq('year', year)

  const upcomingHolidays = (holidays ?? []) as CompanyHoliday[]

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new leave request for approval</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <ApplyLeaveForm holidays={(holidays ?? []) as CompanyHoliday[]} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Leave balances */}
          {balances && balances.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Your Leave Balance</p>
              <div className="space-y-3">
                {LEAVE_TYPE_OPTIONS.map(opt => {
                  const b = balances.find(b => b.leave_type === opt.value)
                  const allocated = b?.allocated ?? 0
                  const used = b?.used ?? 0
                  const pending = b?.pending ?? 0
                  const remaining = allocated - used - pending
                  if (allocated === 0) return null
                  const pct = Math.min(100, allocated > 0 ? Math.round(((used + pending) / allocated) * 100) : 0)
                  return (
                    <div key={opt.value}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{opt.label}</span>
                        <span className="text-gray-400">{remaining} / {allocated} left</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming holidays */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">Upcoming Holidays</p>
            {upcomingHolidays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CalendarX className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No upcoming holidays</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.slice(0, 6).map(h => (
                  <div key={h.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                      <span className="text-sm text-gray-700">{h.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {format(parseISO(h.date), 'MMM d')}
                    </span>
                  </div>
                ))}
                {upcomingHolidays.length > 6 && (
                  <p className="text-xs text-gray-400 pt-1">
                    +{upcomingHolidays.length - 6} more this year
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Policy note */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex gap-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-800">Leave Policy</p>
              <p className="text-xs text-blue-600">Weekends and company holidays are automatically excluded from your leave count.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
