import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">AwayDay</h1>
          <p className="mt-2 text-sm text-gray-500">Leave Management for Modern Teams</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Set new password</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter a new password for your account.
          </p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}
