import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signupSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, full_name, role } = parsed.data
    const domain = email.split('@')[1]

    // Check domain against allowed list
    const admin = createAdminClient()
    const { data: allowedDomain } = await admin
      .from('allowed_domains')
      .select('domain')
      .eq('domain', domain)
      .single()

    if (!allowedDomain) {
      return NextResponse.json(
        { error: `Email domain "@${domain}" is not authorized for this application.` },
        { status: 403 }
      )
    }

    // Sign up via Supabase Auth — pass role in metadata for the trigger
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Explicitly patch the profile role via admin in case the trigger defaults to 'employee'
    if (data.user) {
      await admin
        .from('profiles')
        .update({ role })
        .eq('id', data.user.id)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
