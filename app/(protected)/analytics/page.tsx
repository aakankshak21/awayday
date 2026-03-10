import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StatusPieChart } from '@/components/analytics/StatusPieChart'
import { EmployeeBarChart } from '@/components/analytics/EmployeeBarChart'
import { LeaveTypeChart } from '@/components/analytics/LeaveTypeChart'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveType } from '@/types'

interface PageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { year: yearParam } = await searchParams
  const year = yearParam || new Date().getFullYear().toString()
  const isManager = profile?.role === 'manager'

  // Fetch status summary
  let summaryQuery = supabase
    .from('leave_requests')
    .select('status')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (!isManager) summaryQuery = summaryQuery.eq('employee_id', user.id)

  const { data: rawSummary } = await summaryQuery

  const summary = { pending: 0, approved: 0, rejected: 0, compensated: 0 }
  rawSummary?.forEach(r => {
    summary[r.status as keyof typeof summary]++
  })

  const total = Object.values(summary).reduce((a, b) => a + b, 0)

  // Fetch leave-type breakdown
  let typeQuery = supabase
    .from('leave_requests')
    .select('leave_type, total_days')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (!isManager) typeQuery = typeQuery.eq('employee_id', user.id)

  const { data: rawTypes } = await typeQuery

  const typeMap: Record<string, { days: number; requests: number }> = {}
  rawTypes?.forEach((r: any) => {
    const label = LEAVE_TYPE_LABELS[r.leave_type as LeaveType] ?? r.leave_type
    if (!typeMap[label]) typeMap[label] = { days: 0, requests: 0 }
    typeMap[label].days += r.total_days
    typeMap[label].requests += 1
  })

  const leaveTypeData = Object.entries(typeMap).map(([type, v]) => ({ type, ...v }))

  // Fetch per-employee data (manager only)
  let employeeData: { name: string; approved: number; pending: number; rejected: number; compensated: number }[] = []

  if (isManager) {
    const { data: byEmployee } = await supabase
      .from('leave_requests')
      .select('status, total_days, profiles!employee_id(full_name)')
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`)

    const map: Record<string, typeof employeeData[0]> = {}
    byEmployee?.forEach((r: any) => {
      const name = r.profiles?.full_name || 'Unknown'
      if (!map[name]) map[name] = { name, approved: 0, pending: 0, rejected: 0, compensated: 0 }
      map[name][r.status as keyof Omit<typeof map[string], 'name'>] += r.total_days
    })
    employeeData = Object.values(map)
  }

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1]

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} leave request{total !== 1 ? 's' : ''} in {year}
          </p>
        </div>
        {/* Year switcher */}
        <div className="flex gap-1">
          {years.map(y => (
            <a
              key={y}
              href={`/analytics?year=${y}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                y.toString() === year
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {y}
            </a>
          ))}
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'bg-gray-50 text-gray-700' },
          { label: 'Approved', value: summary.approved, color: 'bg-green-50 text-green-700' },
          { label: 'Pending', value: summary.pending, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Rejected', value: summary.rejected, color: 'bg-red-50 text-red-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl px-4 py-3 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top charts row — visible to all */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Leave by Status</p>
          <StatusPieChart summary={summary} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Leave Days by Type</p>
          <LeaveTypeChart data={leaveTypeData} />
        </div>
      </div>

      {/* Bottom row — manager only */}
      {isManager && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">Leave Days by Employee</p>
          <EmployeeBarChart data={employeeData} />
        </div>
      )}
    </div>
  )
}
