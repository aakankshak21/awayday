'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface StatusSummary {
  pending: number
  approved: number
  rejected: number
  compensated: number
}

interface StatusPieChartProps {
  summary: StatusSummary
}

const COLORS: Record<string, string> = {
  approved: '#22c55e',
  pending: '#eab308',
  rejected: '#ef4444',
  compensated: '#3b82f6',
}

const LABELS: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  compensated: 'Compensated',
}

export function StatusPieChart({ summary }: StatusPieChartProps) {
  const data = Object.entries(summary)
    .map(([key, value]) => ({ name: LABELS[key], value, key }))
    .filter(d => d.value > 0)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No leave requests yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map(entry => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} request${value !== 1 ? 's' : ''}`, '']}
        />
        <Legend
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
