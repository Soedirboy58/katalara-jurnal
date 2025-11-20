'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface RevenueExpenseChartProps {
  revenue?: number
  expense?: number
}

export function RevenueExpenseChart({ 
  revenue = 45000000, 
  expense = 32000000 
}: RevenueExpenseChartProps) {
  const data = [
    { name: 'Pendapatan', value: revenue, color: '#10b981' },
    { name: 'Pengeluaran', value: expense, color: '#ef4444' }
  ]

  const profit = revenue - expense
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600 mt-1">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((payload[0].value / (revenue + expense)) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700">{entry.value}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(data[index].value)}
            </span>
          </div>
        ))}
      </div>
    )
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

      <div className="relative">
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
          <div className="text-xs text-gray-500">Laba Bersih</div>
          <div className={`text-lg sm:text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(profit))}
          </div>
          <div className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Margin: {profitMargin}%
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(revenue + expense)}
          </div>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Laba</div>
          <div className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(profit))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Margin</div>
          <div className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitMargin}%
          </div>
        </div>
      </div>
    </div>
  )
}
