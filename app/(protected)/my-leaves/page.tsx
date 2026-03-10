import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LeavesTable } from '@/components/leaves/LeavesTable'
import { LeavesFilter } from '@/components/leaves/LeavesFilter'
import type { LeaveRequest } from '@/types'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function MyLeavesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { status } = await searchParams

  let query = supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status as any)
  }

  const { data: leaves } = await query

  const counts = {
    total: leaves?.length ?? 0,
    pending: leaves?.filter(l => l.status === 'pending').length ?? 0,
    approved: leaves?.filter(l => l.status === 'approved').length ?? 0,
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.total} total · {counts.approved} approved · {counts.pending} pending
          </p>
        </div>
        <Link href="/apply-leave">
          <Button>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Apply Leave
          </Button>
        </Link>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Leave History</p>
          <LeavesFilter />
        </div>
        <div className="p-1">
          <LeavesTable leaves={(leaves ?? []) as LeaveRequest[]} />
        </div>
      </div>
    </div>
  )
}
