'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesData {
  date: string
  sales: number
}

interface SalesChartProps {
  data?: SalesData[]
  refreshTrigger?: any
}

export function SalesChart({ data, refreshTrigger }: SalesChartProps) {
  const [chartData, setChartData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data) {
      setChartData(data)
      setLoading(false)
    } else {
      fetchSalesData()
    }
  }, [data, refreshTrigger])

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/sales-7days')
      const result = await response.json()
      
      if (result.success && result.data) {
        setChartData(result.data)
      } else {
        // Fallback to empty data
        setChartData(generateEmptyData())
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
      setChartData(generateEmptyData())
    } finally {
      setLoading(false)
    }
  }

  const generateEmptyData = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        sales: 0
      }
    })
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Penjualan 7 Hari Terakhir
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Tren penjualan harian dalam seminggu terakhir (hanya yang lunas)
        </p>
      </div>

      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatCurrency}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Penjualan']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Bar 
              dataKey="sales" 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Total penjualan</span>
        </div>
        <div className="font-semibold text-blue-600">
          Rp {chartData.reduce((sum, item) => sum + item.sales, 0).toLocaleString('id-ID')}
        </div>
      </div>
    </div>
  )
}
