'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveRequest, LeaveType } from '@/types'

interface LeaveWithProfile extends LeaveRequest {
  profiles: { full_name: string; email: string; avatar_url: string | null }
}

interface PendingApprovalsProps {
  leaves: LeaveWithProfile[]
}

export function PendingApprovals({ leaves }: PendingApprovalsProps) {
  const router = useRouter()
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(id: string, status: string, manager_comment?: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, manager_comment }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Leave ${status} successfully`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(null)
      setRejectTarget(null)
      setComment('')
    }
  }

  if (leaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-800">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No pending requests</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Pending Approvals</CardTitle>
          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {leaves.length} pending
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {leaves.map(leave => (
              <div key={leave.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                      {leave.profiles?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium text-gray-800 hover:text-blue-600 cursor-pointer"
                        onClick={() => router.push('/leave-requests')}
                      >{leave.profiles?.full_name}</p>
                      <p className="text-xs text-gray-400">
                        {LEAVE_TYPE_LABELS[leave.leave_type as LeaveType]} ·{' '}
                        {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d')} ·{' '}
                        {leave.total_days}d
                      </p>
                      {leave.reason && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">"{leave.reason}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 h-8"
                      disabled={loading === leave.id}
                      onClick={() => updateStatus(leave.id, 'approved')}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 h-8"
                      disabled={loading === leave.id}
                      onClick={() => setRejectTarget(leave.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 h-8"
                      disabled={loading === leave.id}
                      onClick={() => updateStatus(leave.id, 'compensated')}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Compensate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reject modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setComment('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Comment (optional)</Label>
            <Textarea
              placeholder="Reason for rejection..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setComment('') }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!!loading}
              onClick={() => rejectTarget && updateStatus(rejectTarget, 'rejected', comment || undefined)}
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
