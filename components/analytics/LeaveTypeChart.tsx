'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface LeaveTypeData {
  type: string
  days: number
  requests: number
}

interface LeaveTypeChartProps {
  data: LeaveTypeData[]
}

const COLORS: Record<string, string> = {
  'Privileged Leave': '#6366f1',
  'Sick Leave': '#ef4444',
  'Casual Leave': '#f59e0b',
  'Other': '#8b5cf6',
}

export function LeaveTypeChart({ data }: LeaveTypeChartProps) {
  if (data.length === 0 || data.every(d => d.days === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No leave data for this year
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
        <Tooltip
          formatter={(value: any, name: any) => [
            name === 'days'
              ? `${value} day${value !== 1 ? 's' : ''}`
              : `${value} request${value !== 1 ? 's' : ''}`,
            name === 'days' ? 'Days taken' : 'Requests',
          ]}
        />
        <Bar dataKey="days" radius={[4, 4, 0, 0]}>
          {data.map(entry => (
            <Cell key={entry.type} fill={COLORS[entry.type] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
