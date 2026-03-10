'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types'

interface RecentLeavesProps {
  leaves: LeaveRequest[]
  isManager?: boolean
}

export function RecentLeaves({ leaves, isManager }: RecentLeavesProps) {
  if (leaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarDays className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No leave requests yet</p>
            {!isManager && (
              <Link href="/apply-leave" className="mt-3 text-sm text-blue-600 hover:underline">
                Apply for leave →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">Recent Requests</CardTitle>
        <Link href="/my-leaves" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {leaves.map(leave => (
            <div key={leave.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d, yyyy')}
                    <span className="ml-1 text-gray-300">·</span>
                    <span className="ml-1">{leave.total_days}d</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={leave.status as LeaveStatus} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
