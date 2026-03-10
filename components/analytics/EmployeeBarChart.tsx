'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface EmployeeData {
  name: string
  approved: number
  pending: number
  rejected: number
  compensated: number
}

interface EmployeeBarChartProps {
  data: EmployeeData[]
}

export function EmployeeBarChart({ data }: EmployeeBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No leave data for this year
      </div>
    )
  }

  // Shorten long names for display
  const chartData = data.map(d => ({
    ...d,
    name: d.name.split(' ')[0], // first name only to keep chart readable
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value} day${value !== 1 ? 's' : ''}`,
            name.charAt(0).toUpperCase() + name.slice(1),
          ]}
        />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-gray-600">
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </span>
          )}
        />
        <Bar dataKey="approved" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" stackId="a" fill="#eab308" />
        <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
        <Bar dataKey="compensated" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
