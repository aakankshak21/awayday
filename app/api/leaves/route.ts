import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createLeaveSchema } from '@/lib/validations/leave'
import { calculateBusinessDays } from '@/lib/utils/leave-calculator'
import { sendLeaveSubmittedEmail } from '@/lib/email/send'
import type { LeaveType, LeaveBalance, Profile } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('leave_requests')
    .select('*, profiles!employee_id(full_name, email, avatar_url, department)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Employees only see their own; managers see all (RLS handles this)
  if (profile?.role !== 'manager') {
    query = query.eq('employee_id', user.id)
  }

  if (status) query = query.eq('status', status as any)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createLeaveSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { leave_type, start_date, end_date, reason } = parsed.data

  // Validate start date is not in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(start_date) < today) {
    return NextResponse.json({ error: 'Start date must be today or in the future' }, { status: 400 })
  }

  // Get company holidays for date validation
  const { data: profile } = await supabase
    .from('profiles').select('company_domain, full_name, email').eq('id', user.id).single()

  const { data: holidays } = await supabase
    .from('company_holidays')
    .select('date')
    .eq('company_domain', profile?.company_domain || '')

  const holidayDates = holidays?.map(h => h.date) || []
  const total_days = calculateBusinessDays(start_date, end_date, holidayDates)

  if (total_days === 0) {
    return NextResponse.json(
      { error: 'Selected dates contain no working days (weekends/holidays only)' },
      { status: 400 }
    )
  }

  // Insert leave request
  const { data: leaveRequest, error } = await supabase
    .from('leave_requests')
    .insert({ employee_id: user.id, leave_type, start_date, end_date, total_days, reason })
    .select()
    .single() as any

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update leave_balances — add to pending
  const admin = createAdminClient()
  const year = new Date(start_date).getFullYear()
  const { data: balance } = await admin
    .from('leave_balances')
    .select('*')
    .eq('employee_id', user.id)
    .eq('year', year)
    .eq('leave_type', leave_type as LeaveType)
    .single() as { data: LeaveBalance | null }

  if (balance) {
    await admin.from('leave_balances').update({ pending: balance.pending + total_days })
      .eq('id', balance.id)
  } else {
    const allocations: Record<string, number> = { privileged: 10, sick: 10, casual: 5, unpaid: 0, other: 0 }
    await admin.from('leave_balances').insert({
      employee_id: user.id, year, leave_type: leave_type as LeaveType,
      allocated: allocations[leave_type] || 0,
      used: 0, pending: total_days,
    })
  }

  // Send email to manager (fire and forget)
  const { data: managers } = await admin
    .from('profiles')
    .select('email')
    .eq('company_domain', profile?.company_domain || '')
    .eq('role', 'manager') as { data: Pick<Profile, 'email'>[] | null }

  if (managers?.length) {
    sendLeaveSubmittedEmail({
      employeeName: profile?.full_name || '',
      managerEmail: managers[0].email,
      leaveType: leave_type as LeaveType,
      startDate: start_date,
      endDate: end_date,
      totalDays: total_days,
      reason,
      leaveRequestId: leaveRequest.id,
    }).catch(console.error)
  }

  return NextResponse.json({ data: leaveRequest }, { status: 201 })
}
