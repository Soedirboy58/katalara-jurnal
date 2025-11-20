'use client'

import { 
  CubeIcon, 
  CurrencyDollarIcon,
  FireIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface ProductKPICardsProps {
  totalProducts: number
  totalStockValue: number
  bestSellerName?: string
  lowStockCount: number
  topRevenueProduct?: string
  topRevenueAmount?: number
}

export function ProductKPICards({
  totalProducts,
  totalStockValue,
  bestSellerName = 'N/A',
  lowStockCount,
  topRevenueProduct = 'N/A',
  topRevenueAmount = 0
}: ProductKPICardsProps) {
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)} Jt`
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(0)} K`
    }
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const kpiData = [
    {
      icon: CubeIcon,
      label: 'Total Produk',
      value: totalProducts.toString(),
      subtitle: 'items',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600'
    },
    {
      icon: CurrencyDollarIcon,
      label: 'Total Nilai Stok',
      value: formatCurrency(totalStockValue),
      subtitle: 'nilai inventory',
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    },
    {
      icon: FireIcon,
      label: 'Best Seller',
      value: bestSellerName,
      subtitle: 'produk terlaris',
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-600'
    },
    {
      icon: ExclamationTriangleIcon,
      label: 'Stok Rendah',
      value: lowStockCount.toString(),
      subtitle: 'perlu restock',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600'
    },
    {
      icon: ChartBarIcon,
      label: 'Top Revenue',
      value: topRevenueProduct,
      subtitle: formatCurrency(topRevenueAmount),
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600'
    },
    {
      icon: StarIcon,
      label: 'Produk Aktif',
      value: totalProducts.toString(),
      subtitle: 'siap dijual',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-3 sm:mb-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${kpi.bgColor} rounded-lg flex items-center justify-center mb-1.5 sm:mb-3`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.iconColor}`} />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1 leading-tight">{kpi.label}</p>
            <p className={`text-sm sm:text-lg lg:text-xl font-bold ${kpi.textColor} mb-0.5 sm:mb-1 truncate leading-tight`}>
              {kpi.value}
            </p>
            <p className="text-[9px] sm:text-xs text-gray-500 leading-tight truncate">{kpi.subtitle}</p>
          </div>
        )
      })}
    </div>
  )
}
