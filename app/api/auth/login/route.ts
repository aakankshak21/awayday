import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loginSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      const admin = createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (!profile) {
        return NextResponse.json(
          { error: 'No account found with this email. Please sign up first.' },
          { status: 401 }
        )
      }

      return NextResponse.json({ error: 'Invalid password. Please try again.' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
