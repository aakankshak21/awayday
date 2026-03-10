'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

interface SidebarShellProps {
  role: UserRole
  fullName: string
  email: string
  children: React.ReactNode
}

export function SidebarShell({ role, fullName, email, children }: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        role={role}
        fullName={fullName}
        email={email}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'flex flex-col flex-1 min-h-screen transition-all duration-300',
          'ml-0',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-white border-b border-gray-100 px-4 h-14 lg:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-bold text-gray-900 cursor-pointer" onClick={() => window.location.reload()}>AwayDay</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
