import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user?.id ?? '').single()

  return NextResponse.json({
    cookies: allCookies,
    user: user?.email ?? null,
    error: error?.message ?? null,
    profile: profile ?? null,
    profileError: profileError?.message ?? null,
  })
}
