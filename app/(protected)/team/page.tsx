import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveType } from '@/types'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'manager') redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const year = new Date().getFullYear()

  const [{ data: onLeaveToday }, { data: upcomingLeaves }, { data: employees }] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('*, profiles!employee_id(full_name, email, avatar_url, department)')
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today),

    supabase
      .from('leave_requests')
      .select('*, profiles!employee_id(full_name, email, avatar_url, department)')
      .eq('status', 'approved')
      .gt('start_date', today)
      .lte('start_date', in14)
      .order('start_date', { ascending: true }),

    supabase
      .from('profiles')
      .select('id, full_name, email, department')
      .eq('role', 'employee'),
  ])

  const { data: leaveCounts } = await supabase
    .from('leave_requests')
    .select('employee_id, total_days, status')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)
    .eq('status', 'approved')

  const onLeaveTodayList = (onLeaveToday ?? []) as any[]
  const upcomingLeavesList = (upcomingLeaves ?? []) as any[]
  const employeesList = (employees ?? []) as any[]
  const onLeaveTodayCount = onLeaveTodayList.length

  function getInitials(name: string | null | undefined) {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  function getDaysUsed(employeeId: string) {
    return leaveCounts
      ?.filter(l => l.employee_id === employeeId)
      .reduce((sum, l) => sum + (l.total_days ?? 0), 0) ?? 0
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          {onLeaveTodayCount} {onLeaveTodayCount === 1 ? 'employee' : 'employees'} on leave today
        </p>
      </div>

      {/* Section 1: On Leave Today */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
          <h2 className="text-base font-semibold text-gray-900">On Leave Today</h2>
          <span className="ml-1 text-xs font-medium bg-red-100 text-red-700 rounded-full px-2 py-0.5">
            {onLeaveTodayCount}
          </span>
        </div>

        {onLeaveTodayCount === 0 ? (
          <p className="text-sm text-gray-400">No employees on leave today</p>
        ) : (
          <div className="space-y-3">
            {onLeaveTodayList.map((leave) => {
              const p = leave.profiles
              return (
                <div key={leave.id} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                    {getInitials(p?.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{p?.full_name || '—'}</p>
                    {p?.department && (
                      <p className="text-xs text-gray-400">{p.department}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-700">
                      {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType] || leave.leave_type}
                    </p>
                    <p className="text-xs text-gray-400">
                      Back on {format(new Date(leave.end_date), 'dd MMM')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Upcoming Leaves */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Upcoming Leaves (Next 14 Days)</h2>
        </div>

        {upcomingLeavesList.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No upcoming leaves in the next 14 days</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Leave Type</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">From</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">To</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingLeavesList.map((leave) => {
                  const p = leave.profiles
                  return (
                    <tr key={leave.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                            {getInitials(p?.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p?.full_name || '—'}</p>
                            {p?.department && (
                              <p className="text-xs text-gray-400">{p.department}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType] || leave.leave_type}
                      </td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        {format(new Date(leave.start_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                        {format(new Date(leave.end_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{leave.total_days}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: All Employees */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900">All Employees</h2>
        </div>

        {employeesList.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 pb-5">No employees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Days Used This Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employeesList.map((emp) => {
                  const daysUsed = getDaysUsed(emp.id)
                  const pct = Math.min(100, Math.round((daysUsed / 30) * 100))
                  return (
                    <tr key={emp.id}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                            {getInitials(emp.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.full_name || '—'}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{emp.department || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-700 font-medium w-8 shrink-0">{daysUsed}</span>
                          <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
