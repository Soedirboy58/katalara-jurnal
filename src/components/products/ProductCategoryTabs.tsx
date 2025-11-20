'use client'

interface CategoryTab {
  id: string
  label: string
  icon: string
  count: number
  color: string
}

interface ProductCategoryTabsProps {
  tabs: CategoryTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function ProductCategoryTabs({ tabs, activeTab, onTabChange }: ProductCategoryTabsProps) {
  return (
    <div className="mb-6">
      {/* Desktop Tabs */}
      <div className="hidden sm:flex justify-center">
        <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? `${tab.color} text-white shadow-md`
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {/* Mobile Select */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.label} ({tab.count})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
