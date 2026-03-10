'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, CalendarPlus, CalendarDays,
  UmbrellaOff, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  ClipboardList, Users2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard, roles: ['employee', 'manager'] },
  { href: '/leave-requests',   label: 'Leave Requests',   icon: ClipboardList,   roles: ['manager'] },
  { href: '/team',             label: 'Team',             icon: Users2,          roles: ['manager'] },
  { href: '/apply-leave',      label: 'Apply Leave',      icon: CalendarPlus,    roles: ['employee', 'manager'] },
  { href: '/my-leaves',        label: 'My Leaves',        icon: CalendarDays,    roles: ['employee', 'manager'] },
  { href: '/company-holidays', label: 'Company Holidays', icon: UmbrellaOff,     roles: ['employee', 'manager'] },
  { href: '/analytics',        label: 'Analytics',        icon: BarChart3,       roles: ['employee', 'manager'] },
  { href: '/settings',         label: 'Settings',         icon: Settings,        roles: ['employee', 'manager'] },
]

interface SidebarProps {
  role: UserRole
  fullName: string
  email: string
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ role, fullName, email, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleNavClick() {
    onMobileClose()
  }

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role))
  const initials = fullName.charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40 transition-all duration-300',
        // Mobile: slide in/out as drawer, always full width
        mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64',
        // Desktop: always visible, collapse to icon-only
        'lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        'flex items-center border-b border-gray-100 h-16 shrink-0',
        collapsed ? 'lg:justify-center lg:px-0 justify-between px-5' : 'justify-between px-5'
      )}>
        {/* Logo — always show on mobile drawer; hide on desktop when collapsed */}
        <div className={cn(collapsed ? 'lg:hidden' : '')}>
          <h1 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={() => window.location.reload()}>AwayDay</h1>
          <p className="text-xs text-gray-400">Leave Management</p>
        </div>

        {/* Mobile: X close button */}
        <button
          onClick={onMobileClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Desktop: collapse chevron */}
        <button
          onClick={onToggle}
          className="h-7 w-7 rounded-lg hidden lg:flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-0.5 px-2">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'lg:justify-center' : '',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn(collapsed ? 'lg:hidden' : '')}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 py-3 px-2 space-y-1">
        <div className={cn(
          'flex items-center gap-2.5 px-2 py-2 rounded-lg',
          collapsed ? 'lg:justify-center' : ''
        )}>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className={cn('min-w-0', collapsed ? 'lg:hidden' : '')}>
            <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center gap-2 w-full px-2.5 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors',
            collapsed ? 'lg:justify-center' : ''
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(collapsed ? 'lg:hidden' : '')}>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
