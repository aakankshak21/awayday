import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaveRequestsTable } from '@/components/manager/LeaveRequestsTable'

const PAGE_SIZE = 20

const STATUS_TABS = [
  { value: 'all',         label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'approved',    label: 'Approved' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'compensated', label: 'Compensated' },
]

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function LeaveRequestsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'manager') redirect('/dashboard')

  const { status, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('leave_requests')
    .select('*, profiles!employee_id(full_name, email, avatar_url, department)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (status && status !== 'all') query = query.eq('status', status as any)

  const { data: leaves, count } = await query

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const activeStatus = status || 'all'

  function buildHref(params: { status?: string; page?: number }) {
    const sp = new URLSearchParams()
    if (params.status && params.status !== 'all') sp.set('status', params.status)
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    const qs = sp.toString()
    return `/leave-requests${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total requests</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
        {STATUS_TABS.map(tab => (
          <a
            key={tab.value}
            href={buildHref({ status: tab.value, page: 1 })}
            className={
              activeStatus === tab.value
                ? 'bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium'
                : 'text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-1.5 text-sm'
            }
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <LeaveRequestsTable leaves={(leaves || []) as any[]} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <a
                href={buildHref({ status: activeStatus, page: page - 1 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Previous
              </a>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-gray-100 rounded-lg text-gray-300 cursor-not-allowed">
                Previous
              </span>
            )}
            {page < totalPages ? (
              <a
                href={buildHref({ status: activeStatus, page: page + 1 })}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Next
              </a>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-gray-100 rounded-lg text-gray-300 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
