import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { CalendarPlus, CalendarX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LeaveBalanceCards } from '@/components/dashboard/LeaveBalanceCards'
import { RecentLeaves } from '@/components/dashboard/RecentLeaves'
import { PendingApprovals } from '@/components/dashboard/PendingApprovals'
import { StatusPieChart } from '@/components/analytics/StatusPieChart'
import { EmployeeBarChart } from '@/components/analytics/EmployeeBarChart'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, annual_allowance, sick_allowance')
    .eq('id', user.id)
    .single()

  const isManager = profile?.role === 'manager'
  const year = new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  // ── Employee data ────────────────────────────────────────
  const { data: balances } = !isManager
    ? await supabase.from('leave_balances').select('*').eq('employee_id', user.id).eq('year', year)
    : { data: [] }

  const { data: recentLeaves } = !isManager
    ? await supabase
        .from('leave_requests')
        .select('*, profiles!employee_id(full_name, email, avatar_url)')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  // ── Manager data ─────────────────────────────────────────
  const [pendingResult, allLeavesResult, onLeaveTodayResult, upcomingHolidaysResult, byEmployeeResult] =
    isManager
      ? await Promise.all([
          // All pending leaves
          supabase
            .from('leave_requests')
            .select('*, profiles!employee_id(full_name, email, avatar_url)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true }),

          // Status counts for this year
          supabase
            .from('leave_requests')
            .select('status')
            .gte('created_at', `${year}-01-01`),

          // Who's on leave today
          supabase
            .from('leave_requests')
            .select('*, profiles!employee_id(full_name, department)')
            .eq('status', 'approved')
            .lte('start_date', today)
            .gte('end_date', today),

          // Next 4 upcoming holidays
          supabase
            .from('company_holidays')
            .select('id, name, date')
            .gte('date', today)
            .order('date', { ascending: true })
            .limit(4),

          // Per-employee days for bar chart
          supabase
            .from('leave_requests')
            .select('status, total_days, profiles!employee_id(full_name)')
            .gte('start_date', `${year}-01-01`)
            .lte('start_date', `${year}-12-31`),
        ])
      : [
          { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] },
        ]

  // Compute manager stats
  const allLeaves = allLeavesResult.data ?? []
  const managerStats = {
    pending:     allLeaves.filter(l => l.status === 'pending').length,
    approved:    allLeaves.filter(l => l.status === 'approved').length,
    rejected:    allLeaves.filter(l => l.status === 'rejected').length,
    compensated: allLeaves.filter(l => l.status === 'compensated').length,
  }

  // Status summary for pie chart
  const summary = {
    pending:     managerStats.pending,
    approved:    managerStats.approved,
    rejected:    managerStats.rejected,
    compensated: managerStats.compensated,
  }

  // Per-employee data for bar chart
  const empMap: Record<string, { name: string; approved: number; pending: number; rejected: number; compensated: number }> = {}
  byEmployeeResult.data?.forEach((r: any) => {
    const name = r.profiles?.full_name || 'Unknown'
    if (!empMap[name]) empMap[name] = { name, approved: 0, pending: 0, rejected: 0, compensated: 0 }
    empMap[name][r.status as keyof Omit<typeof empMap[string], 'name'>] += r.total_days
  })
  const employeeChartData = Object.values(empMap)

  const onLeaveToday = onLeaveTodayResult.data ?? []
  const upcomingHolidays = upcomingHolidaysResult.data ?? []

  // ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isManager ? 'Manager Dashboard' : 'Employee Dashboard'} · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!isManager && (
          <Link href="/apply-leave">
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Apply Leave
            </Button>
          </Link>
        )}
        {isManager && (
          <Link href="/leave-requests">
            <Button variant="outline">
              View All Requests
            </Button>
          </Link>
        )}
      </div>

      {/* ── MANAGER LAYOUT ── */}
      {isManager && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pending',     value: managerStats.pending,     color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
              { label: 'Approved',    value: managerStats.approved,    color: 'bg-green-50  border-green-100  text-green-700'  },
              { label: 'Rejected',    value: managerStats.rejected,    color: 'bg-red-50    border-red-100    text-red-700'    },
              { label: 'Compensated', value: managerStats.compensated, color: 'bg-blue-50   border-blue-100   text-blue-700'  },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pending approvals + sidebar widgets */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pending approvals — prominent */}
            <div className="xl:col-span-2 flex flex-col [&>*]:flex-1">
              <PendingApprovals leaves={(pendingResult.data || []) as any} />
            </div>

            {/* Right column: Team Today + Upcoming Holidays */}
            <div className="space-y-4">
              {/* Team Status Today */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <p className="text-sm font-semibold text-gray-800">On Leave Today</p>
                  <span className="ml-auto text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                    {onLeaveToday.length}
                  </span>
                </div>
                {onLeaveToday.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No employees on leave today</p>
                ) : (
                  <div className="space-y-3">
                    {onLeaveToday.map((leave: any) => (
                      <div key={leave.id} className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                          {leave.profiles?.full_name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{leave.profiles?.full_name}</p>
                          <p className="text-xs text-gray-400">
                            {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType] ?? leave.leave_type} · back {format(parseISO(leave.end_date), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Holidays */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-800 mb-4">Upcoming Holidays</p>
                {upcomingHolidays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <CalendarX className="h-7 w-7 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">No upcoming holidays</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingHolidays.map((h: any) => (
                      <div key={h.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                          <span className="text-sm text-gray-700">{h.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {format(parseISO(h.date), 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-medium text-gray-700 mb-4">Leave by Status ({year})</p>
              <StatusPieChart summary={summary} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-medium text-gray-700 mb-4">Leave Days by Employee ({year})</p>
              <EmployeeBarChart data={employeeChartData} />
            </div>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE LAYOUT (unchanged) ── */}
      {!isManager && (
        <>
          <LeaveBalanceCards
            balances={(balances || []) as LeaveBalance[]}
            annualAllowance={profile?.annual_allowance || 10}
            sickAllowance={profile?.sick_allowance || 10}
          />
          <RecentLeaves
            leaves={(recentLeaves || []) as LeaveRequest[]}
            isManager={false}
          />
        </>
      )}
    </div>
  )
}
