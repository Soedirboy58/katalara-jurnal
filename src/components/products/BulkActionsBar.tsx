'use client'

import { 
  XMarkIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkCategory: () => void
  onBulkAdjustStock: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkCategory,
  onBulkAdjustStock,
  onBulkExport,
  onBulkDelete
}: BulkActionsBarProps) {
  
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-full shadow-2xl border border-gray-700">
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Selected Count */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium">dipilih</span>
          </div>

          <div className="w-px h-6 bg-gray-700"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkCategory}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              title="Ubah Kategori"
            >
              <TagIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Kategori</span>
            </button>

            <button
              onClick={onBulkAdjustStock}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              title="Adjust Stok"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Stok</span>
            </button>

            <button
              onClick={onBulkExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
              title="Export"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
              title="Hapus"
            >
              <TrashIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-700"></div>

          {/* Clear Button */}
          <button
            onClick={onClearSelection}
            className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
            title="Clear Selection"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
