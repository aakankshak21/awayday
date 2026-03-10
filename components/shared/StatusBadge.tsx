import { Badge } from '@/components/ui/badge'
import { LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS } from '@/lib/constants/leave-types'
import type { LeaveStatus } from '@/types'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge variant="outline" className={`${LEAVE_STATUS_COLORS[status]} font-medium text-xs`}>
      {LEAVE_STATUS_LABELS[status]}
    </Badge>
  )
}
