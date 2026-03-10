import type { Database, LeaveStatus, LeaveType, UserRole } from './database'

export type { LeaveStatus, LeaveType, UserRole }

export type Profile = Database['public']['Tables']['profiles']['Row']
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']
export type CompanyHoliday = Database['public']['Tables']['company_holidays']['Row']
export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row']

// Extended types with joins
export type LeaveRequestWithProfile = LeaveRequest & {
  profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url' | 'department'>
}

export type ApiResponse<T> = {
  data?: T
  error?: string
}
