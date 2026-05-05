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

type TopProductDatum = { name: string; sold: number }

interface TopProductsChartProps {
  data: TopProductDatum[]
}

export function formatTopProductTick(value: unknown, maxLength = 20) {
  const label = String(value ?? '').trim()

  if (label.length <= maxLength) return label

  return `${label.slice(0, Math.max(1, maxLength - 3)).trimEnd()}...`
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = data
    .filter((item) => item.name && Number.isFinite(item.sold) && item.sold > 0)
    .map((item) => ({
      ...item,
      shortName: formatTopProductTick(item.name),
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground">
        No product sales this week
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 48)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="shortName"
          type="category"
          tick={{ fontSize: 12 }}
          tickLine={false}
          width={150}
        />
        <Tooltip
          cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
          formatter={(value: number) => [`${value} sold`, 'Units Sold']}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
        />
        <Bar dataKey="sold" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
