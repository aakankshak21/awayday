import { getResend } from './resend'
import { LeaveSubmittedEmail } from './templates/leave-submitted'
import { StatusUpdatedEmail } from './templates/status-updated'
import { createAdminClient } from '@/lib/supabase/admin'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import type { LeaveStatus, LeaveType } from '@/types'

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@awayday.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendLeaveSubmittedEmail(params: {
  employeeName: string
  managerEmail: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  leaveRequestId: string
}) {
  const { data, error } = await getResend().emails.send({
    from: `AwayDay <${FROM}>`,
    to: [params.managerEmail],
    subject: `New Leave Request from ${params.employeeName}`,
    react: LeaveSubmittedEmail({
      employeeName: params.employeeName,
      leaveType: LEAVE_TYPE_LABELS[params.leaveType],
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: params.totalDays,
      reason: params.reason,
      dashboardUrl: `${APP_URL}/dashboard`,
    }),
  })

  // Log notification (fire and forget)
  const admin = createAdminClient()
  await admin.from('notification_log').insert({
    recipient_email: params.managerEmail,
    subject: `New Leave Request from ${params.employeeName}`,
    type: 'leave_submitted',
    leave_request_id: params.leaveRequestId,
    status: error ? 'failed' : 'sent',
  })

  return { data, error }
}

export async function sendStatusUpdatedEmail(params: {
  employeeName: string
  employeeEmail: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  status: LeaveStatus
  managerComment?: string
  leaveRequestId: string
}) {
  const statusLabel = params.status.charAt(0).toUpperCase() + params.status.slice(1)

  const { data, error } = await getResend().emails.send({
    from: `AwayDay <${FROM}>`,
    to: [params.employeeEmail],
    subject: `Your leave request has been ${statusLabel}`,
    react: StatusUpdatedEmail({
      employeeName: params.employeeName,
      leaveType: LEAVE_TYPE_LABELS[params.leaveType],
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      managerComment: params.managerComment,
      dashboardUrl: `${APP_URL}/my-leaves`,
    }),
  })

  const admin = createAdminClient()
  await admin.from('notification_log').insert({
    recipient_email: params.employeeEmail,
    subject: `Your leave request has been ${statusLabel}`,
    type: 'status_updated',
    leave_request_id: params.leaveRequestId,
    status: error ? 'failed' : 'sent',
  })

  return { data, error }
}
