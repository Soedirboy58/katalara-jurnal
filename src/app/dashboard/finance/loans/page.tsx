'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoanForm } from '@/components/finance/LoanForm'
import { Button } from '@/components/ui/Button'

interface Loan {
  id: string
  loan_amount: number
  interest_rate: number
  loan_term_months: number
  installment_amount: number
  loan_date: string
  first_payment_date: string
  lender_name: string
  purpose: string
  status: string
  total_paid: number
  remaining_balance: number
  loan_installments: Array<{ count: number }>
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'paid_off'>('all')

  const loadLoans = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/login'
        return
      }

      const url = filter === 'all' 
        ? '/api/loans' 
        : `/api/loans?status=${filter}`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setLoans(data.loans || [])
      }
    } catch (error) {
      console.error('Error loading loans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLoans()
  }, [filter])

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      paid_off: 'bg-blue-100 text-blue-700',
      defaulted: 'bg-red-100 text-red-700'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'
  }

  const totalStats = {
    total_borrowed: loans.reduce((sum, loan) => sum + loan.loan_amount, 0),
    total_paid: loans.reduce((sum, loan) => sum + loan.total_paid, 0),
    remaining: loans.reduce((sum, loan) => sum + loan.remaining_balance, 0),
    active_count: loans.filter(l => l.status === 'active').length
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Manajemen Pinjaman</h1>
          <p className="text-sm text-gray-600">Kelola pinjaman dan cicilan Anda</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          ➕ Tambah Pinjaman
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Total Pinjaman</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(totalStats.total_borrowed)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{loans.length} pinjaman</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Sudah Dibayar</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totalStats.total_paid)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.total_borrowed > 0 
              ? Math.round((totalStats.total_paid / totalStats.total_borrowed) * 100) + '%'
              : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600">Sisa Hutang</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {formatCurrency(totalStats.remaining)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.total_borrowed > 0
              ? Math.round((totalStats.remaining / totalStats.total_borrowed) * 100) + '%'
              : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600">Pinjaman Aktif</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {totalStats.active_count}
          </div>
          <div className="text-xs text-gray-500 mt-1">sedang berjalan</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({loans.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Aktif ({loans.filter(l => l.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('paid_off')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'paid_off'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Lunas ({loans.filter(l => l.status === 'paid_off').length})
          </button>
        </div>
      </div>

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum ada pinjaman
          </h3>
          <p className="text-gray-600 mb-6">
            Tambahkan pinjaman pertama Anda untuk mulai tracking cicilan
          </p>
          <Button onClick={() => setShowForm(true)}>
            ➕ Tambah Pinjaman
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {loan.lender_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(loan.status)}`}>
                        {loan.status === 'active' ? 'Aktif' : loan.status === 'paid_off' ? 'Lunas' : 'Default'}
                      </span>
                    </div>
                    {loan.purpose && (
                      <p className="text-sm text-gray-600">{loan.purpose}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(loan.loan_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {loan.interest_rate}% / {loan.loan_term_months} bulan
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress Pembayaran</span>
                    <span>
                      {loan.loan_amount > 0 
                        ? Math.round((loan.total_paid / loan.loan_amount) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${loan.loan_amount > 0 ? (loan.total_paid / loan.loan_amount) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Cicilan/Bulan</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(loan.installment_amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Sudah Dibayar</div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(loan.total_paid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Sisa Hutang</div>
                    <div className="font-semibold text-orange-600">
                      {formatCurrency(loan.remaining_balance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Tanggal Pinjaman</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(loan.loan_date).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = `/dashboard/finance/loans/${loan.id}`}
                  >
                    📋 Detail & Cicilan
                  </Button>
                  {loan.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/finance/loans/${loan.id}?action=pay`}
                    >
                      💳 Bayar Cicilan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loan Form Modal */}
      <LoanForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadLoans}
      />
    </div>
  )
}
