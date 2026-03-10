import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()
  const month = searchParams.get('month')?.padStart(2, '0') || String(new Date().getMonth() + 1).padStart(2, '0')

  const from = `${year}-${month}-01`
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
  const to = `${year}-${month}-${lastDay}`

  const { data: profile } = await supabase
    .from('profiles').select('role, company_domain').eq('id', user.id).single()

  // Fetch approved leaves
  let leavesQuery = supabase
    .from('leave_requests')
    .select('*, profiles!employee_id(full_name, avatar_url)')
    .eq('status', 'approved')
    .lte('start_date', to)
    .gte('end_date', from)

  if (profile?.role !== 'manager') {
    leavesQuery = leavesQuery.eq('employee_id', user.id)
  }

  const [{ data: leaves }, { data: holidays }] = await Promise.all([
    leavesQuery,
    supabase.from('company_holidays').select('*')
      .eq('company_domain', profile?.company_domain || '')
      .gte('date', from).lte('date', to),
  ])

  return NextResponse.json({ leaves, holidays })
}
