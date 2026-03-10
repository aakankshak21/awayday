export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'compensated'
export type LeaveType = 'privileged' | 'sick' | 'casual' | 'unpaid' | 'other'
export type UserRole = 'employee' | 'manager'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          company_domain: string
          department: string | null
          avatar_url: string | null
          manager_id: string | null
          annual_allowance: number
          sick_allowance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          company_domain: string
          department?: string | null
          avatar_url?: string | null
          manager_id?: string | null
          annual_allowance?: number
          sick_allowance?: number
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: LeaveType
          start_date: string
          end_date: string
          total_days: number
          status: LeaveStatus
          reason: string | null
          manager_comment: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          employee_id: string
          leave_type: LeaveType
          start_date: string
          end_date: string
          total_days: number
          status?: LeaveStatus
          reason?: string | null
          manager_comment?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['leave_requests']['Insert']>
        Relationships: []
      }
      company_holidays: {
        Row: {
          id: string
          company_domain: string
          name: string
          date: string
          created_by: string
          created_at: string
        }
        Insert: {
          company_domain: string
          name: string
          date: string
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['company_holidays']['Insert']>
        Relationships: []
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          year: number
          leave_type: LeaveType
          allocated: number
          used: number
          pending: number
          updated_at: string
        }
        Insert: {
          employee_id: string
          year: number
          leave_type: LeaveType
          allocated?: number
          used?: number
          pending?: number
        }
        Update: Partial<Database['public']['Tables']['leave_balances']['Insert']>
        Relationships: []
      }
      allowed_domains: {
        Row: {
          id: string
          domain: string
          company_name: string
          created_at: string
        }
        Insert: {
          domain: string
          company_name: string
        }
        Update: Partial<Database['public']['Tables']['allowed_domains']['Insert']>
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          recipient_email: string
          subject: string
          type: string
          leave_request_id: string | null
          status: string
          sent_at: string
        }
        Insert: {
          recipient_email: string
          subject: string
          type: string
          leave_request_id?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['notification_log']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      leave_status: LeaveStatus
      leave_type: LeaveType
      user_role: UserRole
    }
    CompositeTypes: Record<string, never>
  }
}
