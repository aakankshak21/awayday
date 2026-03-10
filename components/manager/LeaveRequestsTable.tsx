'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LeaveType, LeaveStatus } from '@/types'

interface LeaveRequestsTableProps {
  leaves: any[]
}

export function LeaveRequestsTable({ leaves }: LeaveRequestsTableProps) {
  const router = useRouter()

  const [actionDialog, setActionDialog] = useState<{
    id: string
    action: 'rejected'
  } | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function updateStatus(id: string, status: string, manager_comment?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, manager_comment }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Failed to update')
        return
      }
      toast.success(`Leave ${status}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
      setActionDialog(null)
      setComment('')
    }
  }

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <CalendarDays className="h-10 w-10 mb-3 text-gray-300" />
        <p className="text-sm font-medium">No leave requests found</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => {
            const profile = leave.profiles
            const initials = profile?.full_name
              ? profile.full_name.charAt(0).toUpperCase()
              : '?'

            return (
              <TableRow key={leave.id}>
                {/* Employee */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {profile?.full_name || '—'}
                      </p>
                      {profile?.department && (
                        <p className="text-xs text-gray-400 truncate">{profile.department}</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="text-sm text-gray-700">
                  {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType] || leave.leave_type}
                </TableCell>

                {/* Dates */}
                <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                  {format(new Date(leave.start_date), 'dd MMM yyyy')}
                  {leave.end_date !== leave.start_date && (
                    <> &ndash; {format(new Date(leave.end_date), 'dd MMM yyyy')}</>
                  )}
                </TableCell>

                {/* Days */}
                <TableCell className="text-sm text-gray-700">
                  {leave.total_days}
                </TableCell>

                {/* Reason */}
                <TableCell className="text-sm text-gray-500 max-w-[180px]">
                  <span className="line-clamp-2">{leave.reason || '—'}</span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={leave.status as LeaveStatus} />
                </TableCell>

                {/* Applied On */}
                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                  {format(new Date(leave.created_at), 'dd MMM yyyy')}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <TooltipProvider>
                    <div className="flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 disabled:opacity-40"
                            onClick={() => updateStatus(leave.id, 'approved')}
                            disabled={loading || leave.status === 'approved'}
                          >
                            ✓
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 disabled:opacity-40"
                            onClick={() => setActionDialog({ id: leave.id, action: 'rejected' })}
                            disabled={loading || leave.status === 'rejected'}
                          >
                            ✗
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reject</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-40"
                            onClick={() => updateStatus(leave.id, 'compensated')}
                            disabled={loading || leave.status === 'compensated'}
                          >
                            ↺
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Compensate</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>

      {/* Reject dialog */}
      <Dialog
        open={actionDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null)
            setComment('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="manager-comment">Comment (optional)</Label>
            <Textarea
              id="manager-comment"
              placeholder="Add a reason for rejection..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(null)
                setComment('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => {
                if (actionDialog) {
                  updateStatus(actionDialog.id, actionDialog.action, comment || undefined)
                }
              }}
            >
              {loading ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
