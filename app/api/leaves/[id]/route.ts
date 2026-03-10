import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateLeaveStatusSchema } from '@/lib/validations/leave'
import { sendStatusUpdatedEmail } from '@/lib/email/send'
import type { LeaveType, LeaveRequest, LeaveBalance, Profile } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, profiles!employee_id(full_name, email, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: reviewer } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (reviewer?.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can update leave status' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateLeaveStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { status, manager_comment } = parsed.data

  const { data: leaveRequest } = await supabase
    .from('leave_requests').select('*').eq('id', id).single() as { data: LeaveRequest | null }

  if (!leaveRequest) return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })

  const { data: updated, error } = await supabase
    .from('leave_requests')
    .update({ status, manager_comment, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update leave_balances
  const admin = createAdminClient()
  const year = new Date(leaveRequest.start_date).getFullYear()

  const { data: balance } = await admin
    .from('leave_balances').select('*')
    .eq('employee_id', leaveRequest.employee_id)
    .eq('year', year)
    .eq('leave_type', leaveRequest.leave_type as LeaveType)
    .single() as { data: LeaveBalance | null }

  if (balance) {
    const updates: { used?: number; pending: number } = { pending: Math.max(0, balance.pending - leaveRequest.total_days) }
    if (status === 'approved' || status === 'compensated') {
      updates.used = balance.used + leaveRequest.total_days
    }
    await admin.from('leave_balances').update(updates).eq('id', balance.id)
  }

  // Send email to employee
  const { data: employee } = await admin
    .from('profiles').select('email, full_name').eq('id', leaveRequest.employee_id).single() as { data: Pick<Profile, 'email' | 'full_name'> | null }

  if (employee) {
    sendStatusUpdatedEmail({
      employeeName: employee.full_name,
      employeeEmail: employee.email,
      leaveType: leaveRequest.leave_type as LeaveType,
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      status,
      managerComment: manager_comment,
      leaveRequestId: id,
    }).catch(console.error)
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: leaveRequest } = await supabase
    .from('leave_requests').select('*').eq('id', id).eq('employee_id', user.id).single() as { data: LeaveRequest | null }

  if (!leaveRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (leaveRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 400 })
  }

  await supabase.from('leave_requests').delete().eq('id', id)

  // Update balance — remove from pending
  const admin = createAdminClient()
  const year = new Date(leaveRequest.start_date).getFullYear()
  const { data: balance } = await admin
    .from('leave_balances').select('*')
    .eq('employee_id', user.id).eq('year', year).eq('leave_type', leaveRequest.leave_type)
    .single() as { data: LeaveBalance | null }

  if (balance) {
    await admin.from('leave_balances')
      .update({ pending: Math.max(0, balance.pending - leaveRequest.total_days) })
      .eq('id', balance.id)
  }

  return NextResponse.json({ success: true })
}
