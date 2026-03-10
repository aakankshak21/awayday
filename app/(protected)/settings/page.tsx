import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm'
import { LEAVE_TYPE_LABELS } from '@/lib/constants/leave-types'
import { Building2, ShieldCheck, Calendar } from 'lucide-react'
import type { LeaveType } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, department, company_domain, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const year = new Date().getFullYear()
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('leave_type, allocated, used, pending')
    .eq('employee_id', user.id)
    .eq('year', year)

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left — forms */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="border-b border-gray-100 pb-4 mb-5">
              <p className="font-semibold text-gray-900">Profile</p>
              <p className="text-xs text-gray-400 mt-0.5">Update your display name and department</p>
            </div>
            <ProfileForm
              fullName={profile.full_name}
              email={profile.email}
              department={profile.department}
            />
          </div>

          {/* Change password */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="border-b border-gray-100 pb-4 mb-5">
              <p className="font-semibold text-gray-900">Change Password</p>
              <p className="text-xs text-gray-400 mt-0.5">Choose a strong password</p>
            </div>
            <ChangePasswordForm />
          </div>
        </div>

        {/* Right — account info + balances */}
        <div className="space-y-4">
          {/* Account info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">Account Info</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Role</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{profile.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Company Domain</p>
                  <p className="text-sm font-medium text-gray-800">{profile.company_domain}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Member Since</p>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave balances (employees only) */}
          {profile.role === 'employee' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Leave Balance {year}</p>
              {balances && balances.length > 0 ? (
                <div className="space-y-3">
                  {balances.map(b => {
                    const remaining = b.allocated - b.used - b.pending
                    const pct = b.allocated > 0
                      ? Math.min(100, Math.round(((b.used + b.pending) / b.allocated) * 100))
                      : 0
                    return (
                      <div key={b.leave_type}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">
                            {LEAVE_TYPE_LABELS[b.leave_type as LeaveType] ?? b.leave_type}
                          </span>
                          <span className="text-gray-400">{remaining} / {b.allocated} left</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        {b.pending > 0 && (
                          <p className="text-xs text-yellow-600 mt-0.5">{b.pending}d pending approval</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No balance data for this year yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
