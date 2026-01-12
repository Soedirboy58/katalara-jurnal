'use client'

import { useMemo, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { ProductModal } from '@/components/products/ProductModal'
import { Plus, Trash2, RefreshCcw, Factory, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

type ToastState = {
  show: boolean
  type: 'success' | 'error' | 'warning'
  message: string
}

type ComponentRow = {
  rowId: string
  product_id: string
  qty: number
}

const toNumber = (v: any): number => {
  const n = typeof v === 'number' ? v : Number((v ?? '').toString().replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const getStockQty = (p: any): number | undefined => {
  if (!p) return undefined
  if (p.stock !== null && p.stock !== undefined) return toNumber(p.stock)
  if (p.stock_quantity !== null && p.stock_quantity !== undefined) return toNumber(p.stock_quantity)
  return undefined
}

const newRowId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

export default function ProductionPage() {
  const { products, loading: productsLoading, refresh: refreshProducts } = useProducts()

  const [finishedProductId, setFinishedProductId] = useState('')
  const [outputQty, setOutputQty] = useState(1)
  const [notes, setNotes] = useState('')

  const [rows, setRows] = useState<ComponentRow[]>([{ rowId: newRowId(), product_id: '', qty: 1 }])

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, type: 'success', message: '' })

  const [showProductModal, setShowProductModal] = useState(false)

  const productsById = useMemo(() => {
    const map = new Map<string, any>()
    for (const p of products || []) map.set((p as any).id, p)
    return map
  }, [products])

  const finishedProduct = finishedProductId ? productsById.get(finishedProductId) : null
  const finishedTrackInventory = finishedProduct ? (finishedProduct as any).track_inventory !== false : true

  const componentPayload = useMemo(() => {
    const normalized = rows
      .map((r) => ({ product_id: (r.product_id || '').toString(), qty: toNumber(r.qty) }))
      .filter((r) => r.product_id && r.qty > 0)

    // Merge by product_id
    const byId = new Map<string, number>()
    for (const r of normalized) byId.set(r.product_id, (byId.get(r.product_id) || 0) + r.qty)

    return Array.from(byId.entries()).map(([product_id, qty]) => ({ product_id, qty }))
  }, [rows])

  const stockIssues = useMemo(() => {
    const issues: Array<{ product_id: string; name?: string; available?: number; requested: number }> = []

    for (const c of componentPayload) {
      if (!c.product_id) continue
      const p = productsById.get(c.product_id)
      if (!p) continue
      if ((p as any).track_inventory === false) continue

      const available = getStockQty(p)
      if (typeof available !== 'number') continue
      if (available < c.qty) {
        issues.push({ product_id: c.product_id, name: (p as any).name, available, requested: c.qty })
      }
    }

    return issues
  }, [componentPayload, productsById])

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  const addRow = () => {
    setRows((prev) => [...prev, { rowId: newRowId(), product_id: '', qty: 1 }])
  }

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.rowId !== rowId)
      return next.length ? next : [{ rowId: newRowId(), product_id: '', qty: 1 }]
    })
  }

  const updateRow = (rowId: string, patch: Partial<ComponentRow>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  const resetForm = () => {
    setFinishedProductId('')
    setOutputQty(1)
    setNotes('')
    setRows([{ rowId: newRowId(), product_id: '', qty: 1 }])
  }

  const canSubmit =
    !saving &&
    !!finishedProductId &&
    outputQty > 0 &&
    componentPayload.length > 0 &&
    !stockIssues.length &&
    finishedTrackInventory

  const handleSubmit = async () => {
    if (!finishedProductId) return showToast('warning', 'Pilih produk jadi terlebih dahulu.')
    if (!finishedTrackInventory) {
      return showToast('error', 'Produk jadi harus mengaktifkan tracking stok (Produk Saya → edit produk).')
    }

    if (!outputQty || outputQty <= 0) return showToast('warning', 'Jumlah produksi harus lebih dari 0.')
    if (!componentPayload.length) return showToast('warning', 'Tambahkan minimal 1 komponen/bahan.')

    if (componentPayload.some((c) => c.product_id === finishedProductId)) {
      return showToast('error', 'Produk jadi tidak boleh menjadi komponen/bahan.')
    }

    if (stockIssues.length) {
      return showToast('error', 'Stok bahan/komponen tidak cukup. Silakan cek stok terlebih dahulu.')
    }

    try {
      setSaving(true)

      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finished_product_id: finishedProductId,
          output_qty: outputQty,
          components: componentPayload,
          notes: notes || undefined
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        const message = (json?.error || 'Gagal memproses produksi').toString()
        return showToast('error', `❌ ${message}`)
      }

      showToast('success', '✅ Produksi berhasil! Stok sudah ter-update.')
      await refreshProducts()
      resetForm()
    } catch (e: any) {
      showToast('error', '❌ ' + (e?.message || 'Terjadi kesalahan'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-in">
          <div
            className={`rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md flex items-start gap-3 border-l-4 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-500'
                : toast.type === 'error'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-amber-50 border-amber-500'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-900'
                    : toast.type === 'error'
                      ? 'text-red-900'
                      : 'text-amber-900'
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast((t) => ({ ...t, show: false }))}
              className={`flex-shrink-0 rounded-full p-1 transition-colors ${
                toast.type === 'success'
                  ? 'hover:bg-green-200'
                  : toast.type === 'error'
                    ? 'hover:bg-red-200'
                    : 'hover:bg-amber-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-7 h-7" /> Produksi / Perakitan
          </h1>
          <p className="text-sm text-gray-600 mt-1">Rakit produk jadi dari komponen/bahan, stok otomatis berkurang/bertambah.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await refreshProducts()
              showToast('success', '🔄 Data produk diperbarui')
            }}
            disabled={productsLoading || saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Buat Produk
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-700 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">Cara pakai singkat</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Pilih <b>Produk Jadi</b> dan isi <b>Jumlah Produksi</b></li>
              <li>Tambahkan <b>Komponen/Bahan</b> beserta qty pemakaian</li>
              <li>Tekan <b>Proses Produksi</b> → stok komponen berkurang, stok produk jadi bertambah</li>
            </ul>
            <p className="mt-2 text-xs text-blue-800/80">Catatan: komponen dengan tracking stok OFF tidak akan mengurangi stok.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-3">1) Produk Jadi</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Produk jadi</label>
                <select
                  value={finishedProductId}
                  onChange={(e) => setFinishedProductId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="">-- Pilih produk --</option>
                  {(products || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.track_inventory === false ? ' (tracking OFF)' : ''}
                    </option>
                  ))}
                </select>
                {!!finishedProduct && !finishedTrackInventory && (
                  <p className="text-xs text-red-600 mt-1">Produk jadi harus tracking stok ON agar bisa diproduksi.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah produksi</label>
                <input
                  type="number"
                  min={1}
                  value={outputQty}
                  onChange={(e) => setOutputQty(toNumber(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="Contoh: Produksi panel box ukuran 40x60 (batch pagi)"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-gray-900">2) Komponen / Bahan</h2>
              <button
                onClick={addRow}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm"
              >
                <Plus className="w-4 h-4" /> Tambah Baris
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((r) => {
                const p = r.product_id ? productsById.get(r.product_id) : null
                const available = p ? getStockQty(p) : undefined
                const tracked = p ? (p as any).track_inventory !== false : true
                const requested = toNumber(r.qty)
                const insufficient = tracked && typeof available === 'number' ? available < requested : false

                return (
                  <div key={r.rowId} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border border-gray-200 rounded-lg p-3">
                    <div className="md:col-span-7">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Komponen</label>
                      <select
                        value={r.product_id}
                        onChange={(e) => updateRow(r.rowId, { product_id: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white"
                      >
                        <option value="">-- Pilih komponen --</option>
                        {(products || [])
                          .filter((p: any) => p.id !== finishedProductId)
                          .map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.track_inventory === false ? ' (tracking OFF)' : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min={0}
                        value={r.qty}
                        onChange={(e) => updateRow(r.rowId, { qty: toNumber(e.target.value) || 0 })}
                        className="w-full h-10 px-3 rounded-lg border border-gray-300"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stok</label>
                      <div
                        className={`h-10 px-3 rounded-lg border flex items-center text-sm ${
                          !p
                            ? 'border-gray-200 text-gray-400'
                            : !tracked
                              ? 'border-gray-200 text-gray-600'
                              : insufficient
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-green-300 bg-green-50 text-green-700'
                        }`}
                      >
                        {!p ? (
                          <span>-</span>
                        ) : !tracked ? (
                          <span>Tracking OFF</span>
                        ) : typeof available === 'number' ? (
                          <span>{available}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      {!!p && tracked && insufficient && (
                        <p className="text-xs text-red-600 mt-1">Stok tidak cukup</p>
                      )}
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeRow(r.rowId)}
                        className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {stockIssues.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-800">Stok komponen tidak cukup</p>
                <ul className="text-xs text-red-800 mt-1 list-disc ml-5 space-y-1">
                  {stockIssues.map((it) => (
                    <li key={it.product_id}>
                      {(it.name || 'Produk').toString()}: butuh {it.requested}, tersedia {it.available}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={resetForm}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-lg text-sm text-white ${
                canSubmit ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {saving ? 'Memproses...' : 'Proses Produksi'}
            </button>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Ringkasan</h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Produk jadi</span>
                <span className="font-medium text-gray-900">
                  {finishedProduct ? (finishedProduct as any).name : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Jumlah produksi</span>
                <span className="font-medium text-gray-900">{outputQty || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Jumlah komponen</span>
                <span className="font-medium text-gray-900">{componentPayload.length}</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">Yang akan terjadi:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Stok komponen berkurang sesuai qty pemakaian</li>
                <li>Stok produk jadi bertambah sesuai jumlah produksi</li>
                <li>Jika ada error, perubahan dibatalkan (rollback)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Tips</h2>
            <p className="text-sm text-gray-600">
              Kalau Anda punya BOM/recipe tetap, nanti kita bisa lanjut Phase berikutnya untuk otomatis menarik komponen dari resep.
            </p>
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={null}
        onSuccess={async () => {
          await refreshProducts()
          setShowProductModal(false)
        }}
        onCreated={(p) => {
          // Prefer setting as finished product if empty, otherwise leave it.
          if (!finishedProductId) setFinishedProductId(p.id)
        }}
      />
    </div>
  )
}
