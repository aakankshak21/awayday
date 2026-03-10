'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, Trash2, MessageSquare } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types'

interface LeavesTableProps {
  leaves: LeaveRequest[]
}

export function LeavesTable({ leaves }: LeavesTableProps) {
  const router = useRouter()
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailLeave, setDetailLeave] = useState<LeaveRequest | null>(null)

  async function handleCancel() {
    if (!cancelTarget) return
    setLoading(true)
    try {
      const res = await fetch(`/api/leaves/${cancelTarget}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to cancel request')
        return
      }
      toast.success('Leave request cancelled')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
      setCancelTarget(null)
    }
  }

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-12 w-12 text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">No leave requests yet</p>
        <p className="text-sm text-gray-400 mt-1">Your submitted leave requests will appear here</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map(leave => (
            <TableRow key={leave.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType]}
              </TableCell>
              <TableCell>{format(new Date(leave.start_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>{format(new Date(leave.end_date), 'MMM d, yyyy')}</TableCell>
              <TableCell>{leave.total_days}d</TableCell>
              <TableCell>
                <StatusBadge status={leave.status as LeaveStatus} />
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {format(new Date(leave.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                {leave.manager_comment ? (
                  <button
                    onClick={() => setDetailLeave(leave)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="View comment"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-gray-200">—</span>
                )}
              </TableCell>
              <TableCell>
                {leave.status === 'pending' && (
                  <button
                    onClick={() => setCancelTarget(leave.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Cancel request"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Cancel confirm dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Leave Request?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will permanently cancel your leave request. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep it
            </Button>
            <Button variant="destructive" disabled={loading} onClick={handleCancel}>
              {loading ? 'Cancelling...' : 'Yes, cancel it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager comment dialog */}
      <Dialog open={!!detailLeave} onOpenChange={() => setDetailLeave(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Manager&apos;s Comment</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            {detailLeave?.manager_comment}
          </div>
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>Leave: {detailLeave && LEAVE_TYPE_LABELS[detailLeave.leave_type as LeaveType]}</p>
            <p>Status: {detailLeave?.status}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
