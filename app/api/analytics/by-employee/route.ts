import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'manager') {
    return NextResponse.json({ error: 'Managers only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  const { data, error } = await supabase
    .from('leave_requests')
    .select('status, total_days, profiles!employee_id(full_name)')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate per employee
  const map: Record<string, { name: string; approved: number; pending: number; rejected: number; compensated: number }> = {}

  data?.forEach((r: any) => {
    const name = r.profiles?.full_name || 'Unknown'
    if (!map[name]) map[name] = { name, approved: 0, pending: 0, rejected: 0, compensated: 0 }
    map[name][r.status as keyof Omit<typeof map[string], 'name'>] += r.total_days
  })

  return NextResponse.json({ data: Object.values(map) })
}
