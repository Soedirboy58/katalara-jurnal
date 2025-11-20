'use client'

interface BulkActionsBarProps {
  selectedCount: number
  onPreview: () => void
  onDelete: () => void
  onClearSelection: () => void
}

export function BulkActionsBar({
  selectedCount,
  onPreview,
  onDelete,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Selection info */}
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedCount} item terpilih</span>
            <button
              onClick={onClearSelection}
              className="text-sm underline hover:no-underline"
            >
              Batalkan
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
