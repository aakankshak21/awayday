'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Umbrella, Stethoscope, Coffee, TrendingUp } from 'lucide-react'
import type { LeaveBalance } from '@/types'

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[]
  annualAllowance: number
  sickAllowance: number
}

const CARD_CONFIG = [
  {
    type: 'privileged',
    label: 'Privileged Leave',
    icon: Umbrella,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    type: 'sick',
    label: 'Sick Leave',
    icon: Stethoscope,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  {
    type: 'casual',
    label: 'Casual Leave',
    icon: Coffee,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
]

export function LeaveBalanceCards({ balances, annualAllowance, sickAllowance }: LeaveBalanceCardsProps) {
  const getBalance = (type: string) => {
    return balances.find(b => b.leave_type === type)
  }

  const getRemaining = (type: string) => {
    const b = getBalance(type)
    const allocated = type === 'privileged' ? annualAllowance : type === 'sick' ? sickAllowance : 5
    if (!b) return allocated
    return allocated - b.used - b.pending
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARD_CONFIG.map(({ type, label, icon: Icon, color, bg, border }) => {
        const b = getBalance(type)
        const allocated = type === 'privileged' ? annualAllowance : type === 'sick' ? sickAllowance : 5
        const used = b?.used || 0
        const pending = b?.pending || 0
        const remaining = getRemaining(type)

        return (
          <Card key={type} className={`border ${border}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <span className={`text-3xl font-bold ${color}`}>{remaining}</span>
                <span className="text-sm text-gray-400 mb-1">/ {allocated} days</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.max(0, (remaining / allocated) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{used} used</span>
                  {pending > 0 && <span className="text-yellow-500">{pending} pending</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Total summary card */}
      <Card className="border border-green-100 sm:col-span-3">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Leave Balance</p>
              <p className="text-xs text-gray-400">Privileged + Sick + Casual</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {CARD_CONFIG.reduce((sum, { type }) => sum + getRemaining(type), 0)}
            </p>
            <p className="text-xs text-gray-400">days remaining</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
