import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  let query = supabase
    .from('leave_requests')
    .select('status')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (profile?.role !== 'manager') {
    query = query.eq('employee_id', user.id)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const summary = { pending: 0, approved: 0, rejected: 0, compensated: 0 }
  data?.forEach(r => { summary[r.status as keyof typeof summary]++ })

  return NextResponse.json({ data: summary })
}
