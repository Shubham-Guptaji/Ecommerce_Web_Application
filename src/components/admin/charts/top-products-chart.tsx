// File path: src/components/admin/charts/top-products-chart.tsx
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TopProductsChartProps {
  data: Array<{ name: string; sold: number }>
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
        <Tooltip formatter={(value: number) => [`${value} sold`, 'Units Sold']} />
        <Bar dataKey="sold" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  )
}
