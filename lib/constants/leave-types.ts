import type { LeaveType, LeaveStatus } from '@/types'

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  privileged: 'Privileged Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  compensated: 'Compensated',
}

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  compensated: 'bg-blue-100 text-blue-800 border-blue-200',
}

export const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'privileged', label: 'Privileged Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'other', label: 'Other' },
]
