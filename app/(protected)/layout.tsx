import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarShell } from '@/components/layout/SidebarShell'
import { Toaster } from '@/components/ui/sonner'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <>
      <SidebarShell role={profile.role} fullName={profile.full_name} email={profile.email}>
        {children}
      </SidebarShell>
      <Toaster richColors position="top-right" />
    </>
  )
}
