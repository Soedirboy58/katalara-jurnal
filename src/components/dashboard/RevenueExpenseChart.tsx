'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface RevenueExpenseChartProps {
  revenue?: number
  expense?: number
  loading?: boolean
}

export function RevenueExpenseChart({ 
  revenue = 0, 
  expense = 0,
  loading = false
}: RevenueExpenseChartProps) {
  const data = [
    { name: 'Pendapatan', value: revenue },
    { name: 'Pengeluaran', value: expense }
  ]

  // Gradient colors - modern and professional
  const COLORS = ['url(#revenueGradient)', 'url(#expenseGradient)']
  
  const profit = revenue - expense
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }
  
  const formatShortCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`
    } else if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}jt`
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)}rb`
    }
    return `Rp ${value}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = revenue + expense
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {percentage}% dari total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Revenue vs Expense
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Perbandingan pendapatan dan pengeluaran bulan ini
        </p>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Chart Container with fixed height */}
        <div className="w-full" style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {/* Gradient for Revenue - Green */}
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
                {/* Gradient for Expense - Red */}
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                </linearGradient>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center Label - Positioned outside chart to avoid overlap */}
        <div className="absolute top-[105px] left-1/2 -translate-x-1/2 text-center pointer-events-none w-28">
          <div className="text-[10px] text-gray-500 font-medium mb-0.5">Laba Bersih</div>
          <div className={`text-base sm:text-lg font-bold leading-tight ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatShortCurrency(Math.abs(profit))}
          </div>
          <div className={`text-[10px] font-medium mt-0.5 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitMargin}%
          </div>
        </div>

        {/* Legend - Below chart */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-green-500 to-green-600"></div>
            <div className="text-left">
              <div className="text-xs text-gray-600">Pendapatan</div>
              <div className="text-sm font-semibold text-gray-900">{formatShortCurrency(revenue)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-500 to-red-600"></div>
            <div className="text-left">
              <div className="text-xs text-gray-600">Pengeluaran</div>
              <div className="text-sm font-semibold text-gray-900">{formatShortCurrency(expense)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 mb-0.5">Total</div>
          <div className="text-xs font-semibold text-gray-900">
            {formatShortCurrency(revenue + expense)}
          </div>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <div className="text-[10px] text-gray-500 mb-0.5">Laba</div>
          <div className={`text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}{formatShortCurrency(profit)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-500 mb-0.5">Margin</div>
          <div className={`text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitMargin}%
          </div>
        </div>
      </div>
    </div>
  )
}
