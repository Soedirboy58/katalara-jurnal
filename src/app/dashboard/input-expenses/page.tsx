'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TablePagination } from '@/components/ui/TablePagination'
import { BulkActionsBar } from '@/components/ui/BulkActionsBar'
// import { ReceiptScanner } from '@/components/expenses/ReceiptScanner' // FUTURE: AI Receipt Scanner

export const dynamic = 'force-dynamic'

export default function InputExpensesPage() {
  const supabase = createClient()
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [tempoType, setTempoType] = useState('7')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [expenseType, setExpenseType] = useState<'operating' | 'investing' | 'financing'>('operating')
  const [assetCategory, setAssetCategory] = useState('')
  const [showBatchPurchase, setShowBatchPurchase] = useState(false)
  const [batchOutputs, setBatchOutputs] = useState<Array<{productId: string, productName: string, units: number}>>([])
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Educational modal & help states
  const [showEducationalModal, setShowEducationalModal] = useState(false)
  const [showHelpDrawer, setShowHelpDrawer] = useState(false)
  const [userQuestion, setUserQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [askingAI, setAskingAI] = useState(false)
  
  // Toast notification state
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error' | 'warning', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }
  
  // KPI stats state
  const [kpiStats, setKpiStats] = useState({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 }
  })
  const [loadingKpi, setLoadingKpi] = useState(true)
  
  // Expenses list & pagination
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Bulk selection
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  
  // Expense limit settings
  const [dailyExpenseLimit, setDailyExpenseLimit] = useState<number | null>(null)
  const [notificationThreshold, setNotificationThreshold] = useState(80)
  const [enableNotifications, setEnableNotifications] = useState(true)

  // Check if user has seen educational modal
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('katalara_expenses_education_seen')
    if (!hasSeenModal) {
      setShowEducationalModal(true)
    }
    loadSettings()
  }, [])
  
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success && result.data) {
        setDailyExpenseLimit(result.data.daily_expense_limit)
        setNotificationThreshold(result.data.notification_threshold || 80)
        setEnableNotifications(result.data.enable_expense_notifications ?? true)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }
  
  const checkExpenseLimit = (newAmount: number) => {
    if (!dailyExpenseLimit || !enableNotifications) return
    
    const totalToday = kpiStats.today.amount + newAmount
    const percentage = (totalToday / dailyExpenseLimit) * 100
    
    if (percentage >= notificationThreshold && percentage < 100) {
      showToast('warning', `⚠️ Peringatan: Pengeluaran hari ini sudah mencapai ${percentage.toFixed(0)}% dari limit (Rp ${totalToday.toLocaleString('id-ID')} / Rp ${dailyExpenseLimit.toLocaleString('id-ID')})`)
    } else if (percentage >= 100) {
      showToast('error', `🚨 OVER LIMIT! Pengeluaran hari ini (Rp ${totalToday.toLocaleString('id-ID')}) melebihi limit harian (Rp ${dailyExpenseLimit.toLocaleString('id-ID')})`)
    }
  }
  
  // Fetch KPI stats and expenses
  useEffect(() => {
    fetchKpiStats()
    fetchExpenses()
  }, [currentPage, itemsPerPage])
  
  const fetchKpiStats = async () => {
    try {
      setLoadingKpi(true)
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      
      // Fetch today
      const todayRes = await fetch(`/api/expenses?start_date=${today}&end_date=${today}`)
      const todayData = await todayRes.json()
      
      // Fetch week
      const weekRes = await fetch(`/api/expenses?start_date=${weekAgo}&end_date=${today}`)
      const weekData = await weekRes.json()
      
      // Fetch month
      const monthRes = await fetch(`/api/expenses?start_date=${monthStart}&end_date=${today}`)
      const monthData = await monthRes.json()
      
      setKpiStats({
        today: {
          amount: todayData.data?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0,
          count: todayData.data?.length || 0
        },
        week: {
          amount: weekData.data?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0,
          count: weekData.data?.length || 0
        },
        month: {
          amount: monthData.data?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0,
          count: monthData.data?.length || 0
        }
      })
    } catch (error) {
      console.error('Failed to fetch KPI:', error)
    } finally {
      setLoadingKpi(false)
    }
  }
  
  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true)
      const offset = (currentPage - 1) * itemsPerPage
      const response = await fetch(`/api/expenses?limit=${itemsPerPage}&offset=${offset}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setExpenses(result.data)
        setTotalItems(result.count || result.data.length)
        setTotalPages(Math.ceil((result.count || result.data.length) / itemsPerPage))
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoadingExpenses(false)
    }
  }

  const closeEducationalModal = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('katalara_expenses_education_seen', 'true')
    }
    setShowEducationalModal(false)
  }

  // Format number with thousand separator
  const formatNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Handle number input
  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    setter(formatNumber(value))
  }

  // Calculate due date based on transaction date and tempo days
  const calculateDueDate = (txnDate: string, days: number) => {
    const date = new Date(txnDate)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  // Update due date when transaction date or tempo type changes
  const handleTransactionDateChange = (date: string) => {
    setTransactionDate(date)
    if (paymentMethod === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(date, parseInt(tempoType)))
    }
  }

  const handleTempoTypeChange = (days: string) => {
    setTempoType(days)
    if (paymentMethod === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(transactionDate, parseInt(days)))
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
    if (method === 'Tempo/Hutang') {
      setDueDate(calculateDueDate(transactionDate, parseInt(tempoType)))
    } else {
      setDueDate('')
    }
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    // Show batch purchase untuk raw_materials (bahan baku produksi) dan finished_goods (produk jadi reseller)
    setShowBatchPurchase(cat === 'raw_materials' || cat === 'finished_goods')
    if (cat !== 'raw_materials' && cat !== 'finished_goods') {
      setBatchOutputs([])
    }
  }

  const addBatchOutput = () => {
    setBatchOutputs([...batchOutputs, { productId: '', productName: '', units: 0 }])
  }

  const removeBatchOutput = (index: number) => {
    setBatchOutputs(batchOutputs.filter((_, i) => i !== index))
  }

  const updateBatchOutput = (index: number, field: string, value: string | number) => {
    const updated = [...batchOutputs]
    updated[index] = { ...updated[index], [field]: value }
    setBatchOutputs(updated)
  }

  const calculateCostPerUnit = () => {
    if (!amount || batchOutputs.length === 0) return 0
    const totalUnits = batchOutputs.reduce((sum, output) => sum + (output.units || 0), 0)
    if (totalUnits === 0) return 0
    const numAmount = parseFloat(amount.replace(/\./g, ''))
    return Math.round(numAmount / totalUnits)
  }

  const handleAutoStock = async (outputs: Array<{productId: string, productName: string, units: number}>, totalCost: number) => {
    try {
      const costPerUnit = totalCost / outputs.reduce((sum, o) => sum + o.units, 0)
      
      for (const output of outputs) {
        if (!output.productName || output.units <= 0) continue
        
        // Check if product already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('*')
          .eq('name', output.productName)
          .single()
        
        if (existingProduct) {
          // Update existing product - add to stock
          await supabase
            .from('products')
            .update({
              stock_quantity: existingProduct.stock_quantity + output.units,
              buy_price: costPerUnit, // Update with latest cost
              last_restock_date: new Date().toISOString()
            })
            .eq('id', existingProduct.id)
        } else {
          // Create new product
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            await supabase
              .from('products')
              .insert({
                owner_id: userData.user.id,
                name: output.productName,
                category: 'finished_goods',
                stock_quantity: output.units,
                stock_unit: 'pcs',
                buy_price: costPerUnit,
                sell_price: costPerUnit * 1.3, // Default 30% markup
                min_stock_alert: 10,
                track_inventory: true,
                last_restock_date: new Date().toISOString()
              })
          }
        }
      }
      
      console.log('✅ Auto-stock berhasil: produk ditambahkan ke inventory')
    } catch (error) {
      console.error('Auto-stock error:', error)
      // Don't show error to user, as the expense was saved successfully
    }
  }

  // Bulk actions handlers
  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  const handleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([])
    } else {
      setSelectedExpenses(expenses.map(e => e.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return
    
    const confirmMsg = `Hapus ${selectedExpenses.length} pengeluaran yang dipilih?`
    if (!confirm(confirmMsg)) return

    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedExpenses })
      })

      const result = await response.json()
      
      if (result.success) {
        showToast('success', `✅ ${selectedExpenses.length} pengeluaran berhasil dihapus`)
        setSelectedExpenses([])
        fetchExpenses()
        fetchKpiStats()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      showToast('error', `❌ Gagal menghapus: ${error.message}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !category || !paymentMethod) {
      showToast('warning', '⚠️ Mohon lengkapi semua field yang wajib diisi')
      return
    }

    setSubmitting(true)

    try {
      const numAmount = parseFloat(amount.replace(/\./g, ''))
      
      // Check expense limit before submitting
      checkExpenseLimit(numAmount)
      
      // Determine payment type
      let paymentType = 'cash'
      if (paymentMethod === 'Tempo/Hutang') {
        paymentType = `tempo_${tempoType}`
      }

      const payload = {
        expense_date: transactionDate,
        amount: numAmount,
        category,
        expense_type: expenseType,
        asset_category: expenseType === 'investing' ? category : null,
        is_capital_expenditure: expenseType === 'investing',
        description: description || null,
        notes: notes || null,
        payment_method: paymentMethod,
        payment_type: paymentType,
        payment_status: paymentMethod === 'Tempo/Hutang' ? 'Pending' : 'Lunas',
        due_date: paymentMethod === 'Tempo/Hutang' ? dueDate : null
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Auto-add batch production outputs to products/stock
        if (category === 'Beli Bahan Baku' && batchOutputs.length > 0) {
          await handleAutoStock(batchOutputs, numAmount)
        }
        
        showToast('success', '✅ Pengeluaran berhasil disimpan!')
        
        // Reset form
        setAmount('')
        setCategory('')
        setDescription('')
        setNotes('')
        setBatchOutputs([])
        setShowBatchPurchase(false)
        setPaymentMethod('Tunai')
        setTransactionDate(new Date().toISOString().split('T')[0])
        
        // Refresh KPI stats and expenses list
        fetchKpiStats()
        fetchExpenses()
      } else {
        throw new Error(result.error || 'Failed to save expense')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      showToast('error', '❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setAmount('')
    setCategory('')
    setDescription('')
    setNotes('')
    setBatchOutputs([])
    setShowBatchPurchase(false)
    setPaymentMethod('Tunai')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setDueDate('')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Pengeluaran</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Catat setiap pengeluaran untuk kontrol keuangan yang lebih baik
          </p>
        </div>
        <button
          onClick={() => setShowEducationalModal(true)}
          className="flex items-center gap-2 bg-[#1088ff] hover:bg-[#0d6ecc] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="hidden sm:inline">Panduan Kategori</span>
          <span className="sm:hidden">📚</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Hari Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-red-600">
              Rp {kpiStats.today.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.today.count} transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Minggu Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-orange-600">
              Rp {kpiStats.week.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.week.count} transaksi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Bulan Ini</div>
          {loadingKpi ? (
            <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <div className="text-2xl font-bold text-yellow-600">
              Rp {kpiStats.month.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.month.count} transaksi</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pengeluaran
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => handleTransactionDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Transaksi
            </label>
            <select
              value={expenseType}
              onChange={(e) => {
                setExpenseType(e.target.value as 'operating' | 'investing' | 'financing')
                setCategory('') // Reset category when type changes
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            >
              <option value="operating">Operasional</option>
              <option value="investing">Investasi</option>
              <option value="financing">Pendanaan</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {expenseType === 'operating' && 'Pengeluaran rutin bisnis sehari-hari'}
              {expenseType === 'investing' && 'Pembelian aset atau peralatan jangka panjang'}
              {expenseType === 'financing' && 'Pembayaran pinjaman atau penarikan modal'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Pengeluaran
            </label>
            <select 
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
            >
              <option value="">Pilih kategori...</option>
              
              {expenseType === 'operating' && (
                <>
                  <optgroup label="Pembelian Stok">
                    <option value="raw_materials">Bahan Baku</option>
                    <option value="finished_goods">Produk Jadi</option>
                  </optgroup>
                  
                  <optgroup label="Operasional">
                    <option value="salary">Gaji Karyawan</option>
                    <option value="rent">Sewa Tempat</option>
                    <option value="utilities">Listrik & Air</option>
                    <option value="communication">Internet & Komunikasi</option>
                    <option value="transportation">Transportasi</option>
                    <option value="maintenance">Perawatan & Maintenance</option>
                    <option value="marketing">Marketing & Promosi</option>
                    <option value="tax">Pajak & Perizinan</option>
                    <option value="other">Lain-lain</option>
                  </optgroup>
                </>
              )}
              
              {expenseType === 'investing' && (
                <optgroup label="Investasi Aset">
                  <option value="office_equipment">Peralatan Kantor</option>
                  <option value="production_equipment">Alat Produksi</option>
                  <option value="vehicle">Kendaraan Operasional</option>
                  <option value="building_renovation">Renovasi Bangunan</option>
                  <option value="other_assets">Peralatan Lainnya</option>
                </optgroup>
              )}
              
              {expenseType === 'financing' && (
                <optgroup label="Pendanaan">
                  <option value="loan_principal">Pembayaran Pokok Pinjaman</option>
                  <option value="loan_interest">Pembayaran Bunga Pinjaman</option>
                  <option value="owner_withdrawal">Prive Pemilik</option>
                </optgroup>
              )}
            </select>
          </div>

          {/* Dynamic Info Box for Prive */}
          {category === 'prive' && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">Apa itu Prive?</h4>
                  <p className="text-xs text-purple-800 mb-2">
                    <strong>Prive</strong> adalah uang bisnis yang Anda ambil untuk keperluan pribadi (belanja bulanan, biaya sekolah, dll).
                  </p>
                  <p className="text-xs text-purple-700">
                    ⚠️ <strong>Penting:</strong> Prive <strong>BUKAN pengeluaran bisnis</strong>, tapi pengambilan modal. Catat terpisah agar laporan keuangan akurat!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Pengeluaran
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                placeholder="0"
                value={amount}
                onChange={(e) => handleNumberInput(e.target.value, setAmount)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {amount && (
              <p className="text-xs text-gray-500 mt-1">Rp {amount}</p>
            )}
          </div>

          {/* FUTURE FEATURE: AI Receipt Scanner 
          {showBatchPurchase && (
            <div className="mb-6">
              <ReceiptScanner 
                onDataExtracted={(data) => {
                  setAmount(data.total.toLocaleString('id-ID'))
                  setNotes(data.notes)
                }}
              />
            </div>
          )}
          */}

          {/* Batch Purchase Section - Show when category is raw_materials or finished_goods */}
          {showBatchPurchase && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Smart Learning System</h3>
                  <p className="text-xs text-gray-600">
                    {category === 'raw_materials' 
                      ? 'Belanjaan bahan baku ini menghasilkan berapa unit produk? Sistem akan hitung cost per unit otomatis!'
                      : 'Beli produk jadi untuk dijual lagi? Input jumlah unit yang dibeli, sistem akan hitung harga modal per unit!'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Catatan Belanjaan
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    category === 'raw_materials' 
                      ? "Contoh: Beli beras 5kg, telur 2kg, mie 4 bungkus, bumbu-bumbu"
                      : category === 'finished_goods'
                      ? "Contoh: Beli 50 kaos polos ukuran M dari supplier Tanah Abang"
                      : "Catatan tambahan..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {category === 'raw_materials' ? '🎯 Output Produksi' : '📦 Produk yang Dibeli'}
                  </label>
                  <button
                    type="button"
                    onClick={addBatchOutput}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + Tambah Produk
                  </button>
                </div>

                {batchOutputs.length === 0 ? (
                  <div className="text-center py-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">
                      {category === 'raw_materials' 
                        ? 'Klik "Tambah Produk" untuk input hasil produksi' 
                        : 'Klik "Tambah Produk" untuk input produk yang dibeli'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {batchOutputs.map((output, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex gap-2 items-start">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder={
                              category === 'raw_materials'
                                ? "Nama produk hasil produksi (ex: Nasi Goreng)"
                                : "Nama produk yang dibeli (ex: Kaos Polos Putih M)"
                            }
                            value={output.productName}
                            onChange={(e) => updateBatchOutput(index, 'productName', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="Jumlah unit"
                              value={output.units || ''}
                              onChange={(e) => updateBatchOutput(index, 'units', parseInt(e.target.value) || 0)}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">unit</span>
                          </div>
                          {output.units > 0 && amount && (
                            <p className="text-xs text-green-600 font-medium">
                              💰 Cost per Unit: Rp {calculateCostPerUnit().toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBatchOutput(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {batchOutputs.length > 0 && amount && (
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Total Belanja:</p>
                        <p className="font-bold text-gray-900">Rp {amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Total Unit:</p>
                        <p className="font-bold text-gray-900">
                          {batchOutputs.reduce((sum, o) => sum + (o.units || 0), 0)} unit
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 text-xs">Rata-rata Cost/Unit:</p>
                        <p className="font-bold text-green-600 text-lg">
                          Rp {calculateCostPerUnit().toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-lg">💡</span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">Sistem akan otomatis:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                      <li>✅ Hitung cost per unit produk</li>
                      <li>✅ Belajar pattern belanja Anda</li>
                      <li>✅ Suggest restock optimal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penerima / Vendor (Opsional)
            </label>
            <input
              type="text"
              placeholder="Nama penerima atau toko"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <select 
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option>Tunai</option>
              <option>Transfer Bank</option>
              <option>E-Wallet</option>
              <option>Kartu Kredit/Debit</option>
              <option>Tempo/Hutang</option>
            </select>
          </div>

          {/* Tempo Options - Show when payment method is Tempo/Hutang */}
          {paymentMethod === 'Tempo/Hutang' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jangka Waktu Tempo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('7')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '7'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('14')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '14'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    14 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('30')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '30'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTempoTypeChange('60')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempoType === '60'
                        ? 'bg-red-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    60 Hari
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-600 mt-1">
                  💡 Tanggal otomatis dihitung berdasarkan jangka waktu tempo. Anda bisa edit manual jika perlu.
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-orange-300">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hutang Aktif</p>
                    <p className="text-xs text-gray-600">
                      Transaksi ini akan masuk ke daftar hutang dan sistem akan mengirim reminder mendekati jatuh tempo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showBatchPurchase && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan pengeluaran ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Bukti (Opsional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, PDF (Max 5MB)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Expenses Table with Pagination */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Rincian Pengeluaran</h2>
          <span className="text-sm text-gray-500">{expenses.length} total transaksi</span>
        </div>
        
        {loadingExpenses ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Belum ada pengeluaran tercatat</p>
            <p className="text-sm mt-1">Mulai catat pengeluaran pertama Anda di atas</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Deskripsi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Pembayaran</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => handleSelectExpense(expense.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(expense.expense_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          expense.expense_type === 'operating' ? 'bg-blue-50 text-blue-700' :
                          expense.expense_type === 'investing' ? 'bg-purple-50 text-purple-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {expense.expense_type === 'operating' ? 'Operasional' :
                           expense.expense_type === 'investing' ? 'Investasi' : 'Pendanaan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {expense.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {expense.payment_method}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                        Rp {parseFloat(expense.amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => handleSelectExpense(expense.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {expense.description || 'Pengeluaran'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(expense.expense_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-red-600">
                          Rp {parseFloat(expense.amount).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          expense.expense_type === 'operating' ? 'bg-blue-50 text-blue-700' :
                          expense.expense_type === 'investing' ? 'bg-purple-50 text-purple-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {expense.expense_type === 'operating' ? 'Operasional' :
                           expense.expense_type === 'investing' ? 'Investasi' : 'Pendanaan'}
                        </span>
                        <span className="text-xs text-gray-500">{expense.payment_method}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedExpenses.length}
        onPreview={() => setShowPreviewModal(true)}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedExpenses([])}
      />

      {/* Help Button - Floating */}
      <button
        onClick={() => setShowHelpDrawer(true)}
        className="fixed bottom-6 right-6 bg-[#1088ff] hover:bg-[#0d6ecc] text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-40"
        title="Butuh bantuan?"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Educational Modal - First Time Only */}
      {showEducationalModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#1088ff] text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎓</span>
                <div>
                  <h2 className="text-2xl font-bold">Panduan Kategori Pengeluaran</h2>
                  <p className="text-blue-100 text-sm">Pahami setiap kategori untuk pencatatan yang akurat</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Pembelian Stok */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-1">📦 Pembelian Stok</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Uang yang dikeluarkan untuk membeli barang yang akan dijual atau diproduksi.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Bahan Baku:</strong> Tepung, gula, bumbu (untuk produksi)</li>
                  <li>• <strong>Produk Jadi:</strong> Beli barang jadi untuk dijual lagi (reseller)</li>
                </ul>
              </div>

              {/* Operasional */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-1">💼 Operasional</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Biaya rutin untuk menjalankan bisnis sehari-hari.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• Gaji karyawan, sewa tempat, listrik & air</li>
                  <li>• Internet, transportasi, maintenance</li>
                </ul>
              </div>

              {/* Marketing */}
              <div className="border-l-4 border-amber-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-1">📢 Marketing & Lainnya</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Biaya promosi dan administrasi bisnis.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• Iklan, promosi, pajak, perizinan</li>
                </ul>
              </div>

              {/* Prive - HIGHLIGHTED */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-3xl">🏦</span>
                  <div>
                    <h3 className="font-bold text-purple-900 mb-2">💰 Prive (Ambil Pribadi)</h3>
                    <p className="text-sm text-purple-800 font-medium mb-2">
                      <strong>PENTING:</strong> Prive adalah uang bisnis yang Anda ambil untuk keperluan pribadi.
                    </p>
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-800 mb-2">
                        <strong>Contoh Prive:</strong>
                      </p>
                      <ul className="text-xs text-gray-700 space-y-1 ml-4">
                        <li>✓ Belanja bulanan keluarga</li>
                        <li>✓ Biaya sekolah anak</li>
                        <li>✓ Bayar cicilan rumah pribadi</li>
                        <li>✓ Jalan-jalan keluarga</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-800">
                        ⚠️ <strong>Prive BUKAN pengeluaran bisnis!</strong> Ini adalah pengambilan modal owner. Pisahkan agar profit bisnis terlihat jelas.
                      </p>
                    </div>
                    <div className="mt-3 text-xs text-purple-700">
                      💡 <strong>Kenapa penting?</strong> Dengan memisahkan Prive, Anda bisa tahu profit sebenarnya dan membuat keputusan bisnis yang lebih baik.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat Feature */}
            <div className="bg-blue-50 border-t-2 border-[#1088ff] p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1088ff] text-sm mb-1">Asisten Kategori Katalara</h3>
                  <p className="text-xs text-gray-700 mb-3">
                    Ketik pengeluaran Anda, sistem akan sarankan kategori yang tepat
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && userQuestion.trim()) {
                            setAskingAI(true)
                            setTimeout(() => {
                              const q = userQuestion.toLowerCase()
                              let response = ''
                              let category = ''
                              
                              // KEYWORD DICTIONARY - Comprehensive expense categorization
                              
                              // PRIVE (Ambil Pribadi) - Personal withdrawals
                              const priveKeywords = ['belanja bulanan', 'belanja keluarga', 'belanja pribadi', 'sekolah anak', 
                                'uang sekolah', 'spp', 'cicilan rumah pribadi', 'cicilan motor pribadi', 'jalan-jalan', 
                                'liburan keluarga', 'ambil pribadi', 'untuk sendiri', 'keperluan pribadi', 'bayar utang pribadi',
                                'beli hp pribadi', 'beli laptop pribadi', 'renovasi rumah pribadi']
                              
                              // BAHAN BAKU (Raw Materials) - Production inputs
                              const bahanBakuKeywords = ['tepung', 'gula', 'garam', 'bumbu', 'rempah', 'beras', 'minyak goreng',
                                'telur', 'susu', 'coklat', 'keju', 'daging', 'ayam', 'ikan', 'sayur', 'buah untuk jus',
                                'kain', 'benang', 'cat', 'kayu', 'paku', 'lem', 'plastik kemasan', 'kardus', 'kertas',
                                'bahan produksi', 'bahan mentah', 'bahan baku']
                              
                              // PRODUK JADI (Finished Goods) - Reseller inventory
                              const produkJadiKeywords = ['beli produk jadi', 'stock reseller', 'barang dagangan', 
                                'produk supplier', 'produk grosir', 'barang titipan', 'ready stock']
                              
                              // GAJI KARYAWAN (Salary)
                              const gajiKeywords = ['gaji', 'upah', 'karyawan', 'pegawai', 'staff', 'thr', 'bonus karyawan',
                                'lembur', 'insentif']
                              
                              // SEWA TEMPAT (Rent)
                              const sewaKeywords = ['sewa toko', 'sewa ruko', 'sewa kios', 'sewa tempat', 'sewa gudang',
                                'kontrak tempat', 'sewa lapak', 'biaya sewa']
                              
                              // LISTRIK & AIR (Utilities)
                              const utilitiesKeywords = ['listrik', 'pln', 'token listrik', 'air', 'pdam', 'rekening air']
                              
                              // INTERNET & KOMUNIKASI (Communication)
                              const komunikasiKeywords = ['internet', 'wifi', 'paket data', 'pulsa', 'telepon', 'kuota',
                                'indihome', 'first media', 'biznet']
                              
                              // TRANSPORTASI (Transportation)
                              const transportasiKeywords = ['bensin', 'bbm', 'pertamax', 'pertalite', 'solar', 'ongkir',
                                'ongkos kirim', 'grab', 'gojek', 'ojek online', 'ekspedisi', 'jne', 'jnt', 'sicepat',
                                'parkir', 'tol', 'servis motor', 'servis mobil', 'ganti oli', 'ban', 'sparepart']
                              
                              // MAINTENANCE (Perawatan)
                              const maintenanceKeywords = ['maintenance', 'perawatan', 'perbaikan', 'service', 'reparasi',
                                'renovasi toko', 'cat ulang', 'ganti atap']
                              
                              // MARKETING & PROMOSI
                              const marketingKeywords = ['iklan', 'ads', 'facebook ads', 'google ads', 'instagram ads',
                                'promosi', 'marketing', 'brosur', 'spanduk', 'banner', 'poster', 'flyer', 'katalog',
                                'endorse', 'influencer', 'sponsor', 'sampling']
                              
                              // PAJAK & PERIZINAN (Tax & Permits)
                              const pajakKeywords = ['pajak', 'ppn', 'pph', 'izin usaha', 'siup', 'npwp', 'perizinan',
                                'retribusi', 'bpjs', 'jamsostek']
                              
                              // Check keywords
                              if (priveKeywords.some(keyword => q.includes(keyword))) {
                                category = 'prive'
                                response = '💰 **Prive (Ambil Pribadi)**\n\n⚠️ Ini BUKAN pengeluaran bisnis! Uang untuk keperluan pribadi/keluarga harus dicatat terpisah agar profit bisnis terlihat jelas.'
                              } else if (bahanBakuKeywords.some(keyword => q.includes(keyword))) {
                                category = 'raw_materials'
                                response = '📦 **Pembelian Stok → Bahan Baku**\n\nBahan untuk produksi. Sistem akan tracking cost per produk otomatis!'
                              } else if (produkJadiKeywords.some(keyword => q.includes(keyword))) {
                                category = 'finished_goods'
                                response = '📦 **Pembelian Stok → Produk Jadi**\n\nBarang ready untuk dijual lagi (reseller). Catat harga modal per unit!'
                              } else if (gajiKeywords.some(keyword => q.includes(keyword))) {
                                category = 'salary'
                                response = '💼 **Operasional → Gaji Karyawan**\n\nBiaya rutin untuk pegawai/karyawan Anda.'
                              } else if (sewaKeywords.some(keyword => q.includes(keyword))) {
                                category = 'rent'
                                response = '💼 **Operasional → Sewa Tempat**\n\nBiaya sewa toko/ruko/kios untuk operasional bisnis.'
                              } else if (utilitiesKeywords.some(keyword => q.includes(keyword))) {
                                category = 'utilities'
                                response = '💼 **Operasional → Listrik & Air**\n\nTagihan listrik (PLN/token) dan air (PDAM) untuk bisnis.'
                              } else if (komunikasiKeywords.some(keyword => q.includes(keyword))) {
                                category = 'communication'
                                response = '💼 **Operasional → Internet & Komunikasi**\n\nBiaya internet, WiFi, pulsa, atau paket data untuk bisnis.'
                              } else if (transportasiKeywords.some(keyword => q.includes(keyword))) {
                                category = 'transportation'
                                response = '💼 **Operasional → Transportasi**\n\nBBM, ongkir, ekspedisi, servis kendaraan operasional, parkir, tol.'
                              } else if (maintenanceKeywords.some(keyword => q.includes(keyword))) {
                                category = 'maintenance'
                                response = '💼 **Operasional → Perawatan & Maintenance**\n\nBiaya perbaikan, perawatan rutin, atau renovasi tempat usaha.'
                              } else if (marketingKeywords.some(keyword => q.includes(keyword))) {
                                category = 'marketing'
                                response = '📢 **Marketing & Promosi**\n\nBiaya iklan online/offline, promosi, atau endorsement untuk meningkatkan penjualan.'
                              } else if (pajakKeywords.some(keyword => q.includes(keyword))) {
                                category = 'tax'
                                response = '📢 **Marketing & Lainnya → Pajak & Perizinan**\n\nPajak usaha, NPWP, SIUP, retribusi, atau izin operasional lainnya.'
                              } else {
                                response = '🤔 **Tidak ditemukan kategori yang cocok**\n\nCoba lebih spesifik, contoh:\n• "Bensin untuk delivery"\n• "Beli tepung 10kg"\n• "Gaji karyawan bulan ini"\n• "Belanja bulanan keluarga"'
                              }
                              
                              setAiResponse(response)
                              setAskingAI(false)
                            }, 800)
                          }
                        }}
                        placeholder="Contoh: Beli tepung untuk bikin kue"
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={askingAI}
                      />
                      <button
                        onClick={() => {
                          if (!userQuestion.trim()) return
                          setAskingAI(true)
                          setTimeout(() => {
                            const q = userQuestion.toLowerCase()
                            let response = ''
                            
                            const priveKeywords = ['belanja bulanan', 'belanja keluarga', 'belanja pribadi', 'sekolah anak', 
                              'uang sekolah', 'spp', 'cicilan rumah pribadi', 'cicilan motor pribadi', 'jalan-jalan', 
                              'liburan keluarga', 'ambil pribadi', 'untuk sendiri', 'keperluan pribadi', 'bayar utang pribadi',
                              'beli hp pribadi', 'beli laptop pribadi', 'renovasi rumah pribadi']
                            const bahanBakuKeywords = ['tepung', 'gula', 'garam', 'bumbu', 'rempah', 'beras', 'minyak goreng',
                              'telur', 'susu', 'coklat', 'keju', 'daging', 'ayam', 'ikan', 'sayur', 'buah untuk jus',
                              'kain', 'benang', 'cat', 'kayu', 'paku', 'lem', 'plastik kemasan', 'kardus', 'kertas',
                              'bahan produksi', 'bahan mentah', 'bahan baku']
                            const produkJadiKeywords = ['beli produk jadi', 'stock reseller', 'barang dagangan', 
                              'produk supplier', 'produk grosir', 'barang titipan', 'ready stock']
                            const gajiKeywords = ['gaji', 'upah', 'karyawan', 'pegawai', 'staff', 'thr', 'bonus karyawan', 'lembur', 'insentif']
                            const sewaKeywords = ['sewa toko', 'sewa ruko', 'sewa kios', 'sewa tempat', 'sewa gudang', 'kontrak tempat', 'sewa lapak', 'biaya sewa']
                            const utilitiesKeywords = ['listrik', 'pln', 'token listrik', 'air', 'pdam', 'rekening air']
                            const komunikasiKeywords = ['internet', 'wifi', 'paket data', 'pulsa', 'telepon', 'kuota', 'indihome', 'first media', 'biznet']
                            const transportasiKeywords = ['bensin', 'bbm', 'pertamax', 'pertalite', 'solar', 'ongkir', 'ongkos kirim', 'grab', 'gojek', 'ojek online', 'ekspedisi', 'jne', 'jnt', 'sicepat', 'parkir', 'tol', 'servis motor', 'servis mobil', 'ganti oli', 'ban', 'sparepart']
                            const maintenanceKeywords = ['maintenance', 'perawatan', 'perbaikan', 'service', 'reparasi', 'renovasi toko', 'cat ulang', 'ganti atap']
                            const marketingKeywords = ['iklan', 'ads', 'facebook ads', 'google ads', 'instagram ads', 'promosi', 'marketing', 'brosur', 'spanduk', 'banner', 'poster', 'flyer', 'katalog', 'endorse', 'influencer', 'sponsor', 'sampling']
                            const pajakKeywords = ['pajak', 'ppn', 'pph', 'izin usaha', 'siup', 'npwp', 'perizinan', 'retribusi', 'bpjs', 'jamsostek']
                            
                            if (priveKeywords.some(keyword => q.includes(keyword))) {
                              response = '💰 **Prive (Ambil Pribadi)**\n\n⚠️ Ini BUKAN pengeluaran bisnis! Uang untuk keperluan pribadi/keluarga harus dicatat terpisah agar profit bisnis terlihat jelas.'
                            } else if (bahanBakuKeywords.some(keyword => q.includes(keyword))) {
                              response = '📦 **Pembelian Stok → Bahan Baku**\n\nBahan untuk produksi. Sistem akan tracking cost per produk otomatis!'
                            } else if (produkJadiKeywords.some(keyword => q.includes(keyword))) {
                              response = '📦 **Pembelian Stok → Produk Jadi**\n\nBarang ready untuk dijual lagi (reseller). Catat harga modal per unit!'
                            } else if (gajiKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Gaji Karyawan**\n\nBiaya rutin untuk pegawai/karyawan Anda.'
                            } else if (sewaKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Sewa Tempat**\n\nBiaya sewa toko/ruko/kios untuk operasional bisnis.'
                            } else if (utilitiesKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Listrik & Air**\n\nTagihan listrik (PLN/token) dan air (PDAM) untuk bisnis.'
                            } else if (komunikasiKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Internet & Komunikasi**\n\nBiaya internet, WiFi, pulsa, atau paket data untuk bisnis.'
                            } else if (transportasiKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Transportasi**\n\nBBM, ongkir, ekspedisi, servis kendaraan operasional, parkir, tol.'
                            } else if (maintenanceKeywords.some(keyword => q.includes(keyword))) {
                              response = '💼 **Operasional → Perawatan & Maintenance**\n\nBiaya perbaikan, perawatan rutin, atau renovasi tempat usaha.'
                            } else if (marketingKeywords.some(keyword => q.includes(keyword))) {
                              response = '📢 **Marketing & Promosi**\n\nBiaya iklan online/offline, promosi, atau endorsement untuk meningkatkan penjualan.'
                            } else if (pajakKeywords.some(keyword => q.includes(keyword))) {
                              response = '📢 **Marketing & Lainnya → Pajak & Perizinan**\n\nPajak usaha, NPWP, SIUP, retribusi, atau izin operasional lainnya.'
                            } else {
                              response = '🤔 **Tidak ditemukan kategori yang cocok**\n\nCoba lebih spesifik, contoh:\n• "Bensin untuk delivery"\n• "Beli tepung 10kg"\n• "Gaji karyawan bulan ini"\n• "Belanja bulanan keluarga"'
                            }
                            
                            setAiResponse(response)
                            setAskingAI(false)
                          }, 800)
                        }}
                        disabled={askingAI || !userQuestion.trim()}
                        className="bg-[#1088ff] hover:bg-[#0d6ecc] disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                      >
                        {askingAI ? '⏳' : '🔍'}
                      </button>
                    </div>
                    {aiResponse && (
                      <div className="bg-white border-2 border-[#1088ff] rounded-lg p-3 animate-fade-in">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">✅</span>
                          <p className="text-sm text-gray-800 flex-1 whitespace-pre-line">{aiResponse}</p>
                          <button
                            onClick={() => {
                              setAiResponse('')
                              setUserQuestion('')
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-2xl flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Jangan tampilkan lagi</span>
              </label>
              <button
                onClick={() => {
                  const checkbox = document.getElementById('dontShowAgain') as HTMLInputElement
                  closeEducationalModal(checkbox?.checked || false)
                  setAiResponse('')
                  setUserQuestion('')
                }}
                className="bg-[#1088ff] hover:bg-[#0d6ecc] text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                Mengerti, Mulai Input!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Drawer */}
      {showHelpDrawer && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-xl flex items-center justify-center z-50 p-4" onClick={() => setShowHelpDrawer(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#1088ff] text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💡</span>
                  <h2 className="text-xl font-bold">Bantuan Cepat</h2>
                </div>
                <button onClick={() => setShowHelpDrawer(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📦</span> Pembelian Stok
                </h3>
                <p className="text-sm text-gray-700">Beli barang untuk produksi atau dijual lagi</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💼</span> Operasional
                </h3>
                <p className="text-sm text-gray-700">Biaya rutin bisnis: gaji, sewa, listrik, dll</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <span>💰</span> Prive
                </h3>
                <p className="text-sm text-purple-800 mb-2">
                  Uang bisnis yang diambil untuk <strong>keperluan pribadi</strong>
                </p>
                <p className="text-xs text-purple-700">
                  ⚠️ Bukan pengeluaran bisnis! Pisahkan agar profit jelas.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ Catat setiap pengeluaran sesegera mungkin</li>
                  <li>✓ Simpan nota/kwitansi sebagai bukti</li>
                  <li>✓ Pisahkan Prive dari pengeluaran bisnis</li>
                  <li>✓ Review pengeluaran rutin setiap bulan</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowHelpDrawer(false)}
                className="w-full bg-[#1088ff] hover:bg-[#0d6ecc] text-white py-2 rounded-lg font-medium transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Preview {selectedExpenses.length} Pengeluaran</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Tanggal</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Tipe</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Kategori</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses
                    .filter(e => selectedExpenses.includes(e.id))
                    .map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            expense.expense_type === 'operating' ? 'bg-blue-50 text-blue-700' :
                            expense.expense_type === 'investing' ? 'bg-purple-50 text-purple-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {expense.expense_type === 'operating' ? 'Operasional' :
                             expense.expense_type === 'investing' ? 'Investasi' : 'Pendanaan'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{expense.category}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-red-600 text-right">
                          Rp {parseFloat(expense.amount).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-gray-900">Total:</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      Rp {expenses
                        .filter(e => selectedExpenses.includes(e.id))
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                        .toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className={`
            rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md
            flex items-start gap-3 border-l-4
            ${
              toast.type === 'success' ? 'bg-green-50 border-green-500' :
              toast.type === 'error' ? 'bg-red-50 border-red-500' :
              'bg-amber-50 border-amber-500'
            }
          `}>
            <span className="text-2xl flex-shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
            </span>
            <div className="flex-1">
              <p className={`
                text-sm font-medium
                ${
                  toast.type === 'success' ? 'text-green-900' :
                  toast.type === 'error' ? 'text-red-900' :
                  'text-amber-900'
                }
              `}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast({ ...toast, show: false })}
              className={`
                flex-shrink-0 rounded-full p-1 transition-colors
                ${
                  toast.type === 'success' ? 'hover:bg-green-200' :
                  toast.type === 'error' ? 'hover:bg-red-200' :
                  'hover:bg-amber-200'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
