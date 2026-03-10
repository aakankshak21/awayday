import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHolidaySchema } from '@/lib/validations/holiday'
import { isWeekend, parseISO } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  const { data, error } = await supabase
    .from('company_holidays')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, company_domain').eq('id', user.id).single()

  if (profile?.role !== 'manager') {
    return NextResponse.json({ error: 'Only managers can add holidays' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createHolidaySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, date } = parsed.data

  if (isWeekend(parseISO(date))) {
    return NextResponse.json({ error: 'Cannot add a holiday on a weekend' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('company_holidays')
    .insert({ name, date, company_domain: profile.company_domain, created_by: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A holiday already exists on this date' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
