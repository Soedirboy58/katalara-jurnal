'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface LoanFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InstallmentPreview {
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
}

export function LoanForm({ isOpen, onClose, onSuccess }: LoanFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    loan_amount: '',
    interest_rate: '',
    loan_term_months: '',
    loan_date: new Date().toISOString().split('T')[0],
    first_payment_date: '',
    lender_name: '',
    lender_contact: '',
    purpose: '',
    notes: ''
  })
  const [preview, setPreview] = useState<InstallmentPreview[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Calculate installment preview
  const calculatePreview = () => {
    const P = parseFloat(formData.loan_amount)
    const rate = parseFloat(formData.interest_rate)
    const n = parseInt(formData.loan_term_months)

    if (!P || !n || P <= 0 || n <= 0) {
      alert('Masukkan jumlah pinjaman dan jangka waktu yang valid')
      return
    }

    const monthlyRate = rate / 100 / 12
    let installmentAmount: number

    if (monthlyRate === 0) {
      installmentAmount = P / n
    } else {
      installmentAmount = P * (monthlyRate * Math.pow(1 + monthlyRate, n)) / 
                         (Math.pow(1 + monthlyRate, n) - 1)
    }

    installmentAmount = Math.round(installmentAmount * 100) / 100

    // Generate preview
    const installments: InstallmentPreview[] = []
    let remainingPrincipal = P
    const firstDate = new Date(formData.first_payment_date || formData.loan_date)

    for (let i = 1; i <= n; i++) {
      const dueDate = new Date(firstDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      const interestAmount = remainingPrincipal * monthlyRate
      const principalAmount = installmentAmount - interestAmount

      const isLast = i === n
      const adjustedPrincipal = isLast ? remainingPrincipal : principalAmount
      const adjustedInterest = isLast ? (installmentAmount - adjustedPrincipal) : interestAmount

      installments.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal_amount: Math.round(adjustedPrincipal * 100) / 100,
        interest_amount: Math.round(adjustedInterest * 100) / 100,
        total_amount: Math.round((adjustedPrincipal + adjustedInterest) * 100) / 100
      })

      remainingPrincipal -= adjustedPrincipal
    }

    setPreview(installments)
    setShowPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Validate
      if (!formData.loan_amount || !formData.interest_rate || !formData.loan_term_months) {
        throw new Error('Lengkapi field yang wajib diisi')
      }

      if (!formData.first_payment_date) {
        throw new Error('Tanggal pembayaran pertama wajib diisi')
      }

      const payload = {
        loan_amount: parseFloat(formData.loan_amount),
        interest_rate: parseFloat(formData.interest_rate),
        loan_term_months: parseInt(formData.loan_term_months),
        loan_date: formData.loan_date,
        first_payment_date: formData.first_payment_date,
        lender_name: formData.lender_name,
        lender_contact: formData.lender_contact || null,
        purpose: formData.purpose || null,
        notes: formData.notes || null
      }

      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat pinjaman')
      }

      alert('Pinjaman berhasil dibuat dengan ' + data.loan.loan_installments.length + ' cicilan!')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        loan_amount: '',
        interest_rate: '',
        loan_term_months: '',
        loan_date: new Date().toISOString().split('T')[0],
        first_payment_date: '',
        lender_name: '',
        lender_contact: '',
        purpose: '',
        notes: ''
      })
      setPreview([])
      setShowPreview(false)

    } catch (error: any) {
      console.error('Error creating loan:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Pinjaman Baru"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Jumlah Pinjaman *"
            type="number"
            value={formData.loan_amount}
            onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
            required
            placeholder="50000000"
          />

          <Input
            label="Suku Bunga (% per tahun) *"
            type="number"
            step="0.1"
            value={formData.interest_rate}
            onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
            required
            placeholder="12.0"
          />

          <Input
            label="Jangka Waktu (bulan) *"
            type="number"
            value={formData.loan_term_months}
            onChange={(e) => setFormData({ ...formData, loan_term_months: e.target.value })}
            required
            placeholder="12"
          />

          <Input
            label="Tanggal Pinjaman *"
            type="date"
            value={formData.loan_date}
            onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
            required
          />

          <Input
            label="Tanggal Bayar Pertama *"
            type="date"
            value={formData.first_payment_date}
            onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
            required
          />
        </div>

        {/* Lender Info */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Pemberi Pinjaman</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Pemberi Pinjaman *"
              value={formData.lender_name}
              onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
              required
              placeholder="Bank BCA / PT Investor ABC"
            />

            <Input
              label="Kontak"
              value={formData.lender_contact}
              onChange={(e) => setFormData({ ...formData, lender_contact: e.target.value })}
              placeholder="021-xxx / email@example.com"
            />
          </div>
        </div>

        {/* Purpose & Notes */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tujuan Pinjaman
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Modal kerja / Ekspansi usaha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Catatan tambahan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Preview Calculator */}
        <div className="border-t pt-4">
          <Button
            type="button"
            onClick={calculatePreview}
            variant="secondary"
            className="w-full md:w-auto"
          >
            🧮 Hitung Preview Cicilan
          </Button>

          {showPreview && preview.length > 0 && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">
                📊 Preview Jadwal Cicilan ({preview.length} bulan)
              </h4>
              
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600 text-xs">Total Pinjaman</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(parseFloat(formData.loan_amount))}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600 text-xs">Cicilan per Bulan</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(preview[0].total_amount)}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600 text-xs">Total Bayar</div>
                  <div className="font-bold text-gray-900">
                    {formatCurrency(preview.reduce((sum, p) => sum + p.total_amount, 0))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-xs bg-white rounded">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Jatuh Tempo</th>
                      <th className="p-2 text-right">Pokok</th>
                      <th className="p-2 text-right">Bunga</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((inst) => (
                      <tr key={inst.installment_number} className="border-t">
                        <td className="p-2">{inst.installment_number}</td>
                        <td className="p-2">{inst.due_date}</td>
                        <td className="p-2 text-right">{formatCurrency(inst.principal_amount)}</td>
                        <td className="p-2 text-right">{formatCurrency(inst.interest_amount)}</td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(inst.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end border-t pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : '💾 Simpan Pinjaman'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
