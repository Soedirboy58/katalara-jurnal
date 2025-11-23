'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { use } from 'react'

interface Installment {
  id: string
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
  status: string
  paid_date: string | null
  paid_amount: number | null
}

interface Loan {
  id: string
  loan_amount: number
  interest_rate: number
  loan_term_months: number
  installment_amount: number
  loan_date: string
  lender_name: string
  purpose: string
  status: string
  total_paid: number
  remaining_balance: number
  loan_installments: Installment[]
}

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [paying, setPaying] = useState(false)
  const [paymentData, setPaymentData] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    paid_amount: '',
    payment_method: 'transfer',
    notes: ''
  })

  const loadLoan = async () => {
    try {
      const response = await fetch(`/api/loans/${resolvedParams.id}`)
      const data = await response.json()

      if (response.ok) {
        setLoan(data.loan)
      } else {
        alert('Gagal memuat data pinjaman')
        window.location.href = '/dashboard/finance/loans'
      }
    } catch (error) {
      console.error('Error loading loan:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLoan()
  }, [resolvedParams.id])

  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstallment) return

    setPaying(true)

    try {
      const response = await fetch('/api/loans/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installment_id: selectedInstallment.id,
          paid_date: paymentData.paid_date,
          paid_amount: parseFloat(paymentData.paid_amount),
          payment_method: paymentData.payment_method,
          notes: paymentData.notes || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses pembayaran')
      }

      alert('✅ Pembayaran berhasil dicatat!')
      setShowPayModal(false)
      setSelectedInstallment(null)
      setPaymentData({
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: '',
        payment_method: 'transfer',
        notes: ''
      })
      loadLoan()

    } catch (error: any) {
      console.error('Error paying installment:', error)
      alert('Error: ' + error.message)
    } finally {
      setPaying(false)
    }
  }

  const openPayModal = (installment: Installment) => {
    setSelectedInstallment(installment)
    setPaymentData({
      ...paymentData,
      paid_amount: installment.total_amount.toString()
    })
    setShowPayModal(true)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!loan) return null

  const paidCount = loan.loan_installments.filter(i => i.status === 'paid').length
  const progressPercent = (paidCount / loan.loan_installments.length) * 100

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/dashboard/finance/loans'}
        className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
      >
        ← Kembali ke Daftar Pinjaman
      </button>

      {/* Loan Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {loan.lender_name}
            </h1>
            {loan.purpose && (
              <p className="text-gray-600">{loan.purpose}</p>
            )}
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded ${
            loan.status === 'active' ? 'bg-green-100 text-green-700' :
            loan.status === 'paid_off' ? 'bg-blue-100 text-blue-700' :
            'bg-red-100 text-red-700'
          }`}>
            {loan.status === 'active' ? 'Aktif' : loan.status === 'paid_off' ? 'Lunas' : 'Default'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Pinjaman</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(loan.loan_amount)}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Sudah Dibayar</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(loan.total_paid)}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Sisa Hutang</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(loan.remaining_balance)}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Cicilan/Bulan</div>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(loan.installment_amount)}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Suku Bunga</div>
            <div className="text-xl font-bold text-gray-900">
              {loan.interest_rate}%
            </div>
            <div className="text-xs text-gray-500">per tahun</div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress Cicilan</span>
            <span>{paidCount} dari {loan.loan_installments.length} cicilan ({Math.round(progressPercent)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Installments Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-xl font-bold">📋 Jadwal Cicilan</h2>
          <p className="text-blue-100 text-sm">Daftar lengkap jadwal pembayaran cicilan</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cicilan #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jatuh Tempo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Pokok
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Bunga
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loan.loan_installments.map((inst) => (
                <tr key={inst.id} className={inst.status === 'paid' ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{inst.installment_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(inst.due_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(inst.principal_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatCurrency(inst.interest_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(inst.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(inst.status)}`}>
                      {inst.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                    </span>
                    {inst.paid_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(inst.paid_date).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {inst.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => openPayModal(inst)}
                      >
                        💳 Bayar
                      </Button>
                    )}
                    {inst.status === 'paid' && (
                      <span className="text-green-600 text-2xl">✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">
                  {formatCurrency(loan.loan_installments.reduce((sum, i) => sum + i.principal_amount, 0))}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">
                  {formatCurrency(loan.loan_installments.reduce((sum, i) => sum + i.interest_amount, 0))}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">
                  {formatCurrency(loan.loan_installments.reduce((sum, i) => sum + i.total_amount, 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false)
          setSelectedInstallment(null)
        }}
        title="💳 Bayar Cicilan"
        size="md"
      >
        {selectedInstallment && (
          <form onSubmit={handlePayInstallment} className="space-y-4">
            {/* Installment Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Cicilan #{selectedInstallment.installment_number}</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(selectedInstallment.total_amount)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Jatuh tempo: {new Date(selectedInstallment.due_date).toLocaleDateString('id-ID')}
              </div>
            </div>

            <Input
              label="Tanggal Pembayaran *"
              type="date"
              value={paymentData.paid_date}
              onChange={(e) => setPaymentData({ ...paymentData, paid_date: e.target.value })}
              required
            />

            <Input
              label="Jumlah Bayar *"
              type="number"
              value={paymentData.paid_amount}
              onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran *
              </label>
              <select
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="debit">Debit Card</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan pembayaran..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPayModal(false)}
                disabled={paying}
              >
                Batal
              </Button>
              <Button type="submit" disabled={paying}>
                {paying ? 'Memproses...' : '✅ Konfirmasi Pembayaran'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
