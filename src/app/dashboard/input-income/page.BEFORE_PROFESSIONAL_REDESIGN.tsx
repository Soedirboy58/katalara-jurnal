'use client'

// ============================================
// 🔵 PART 1: IMPORTS & TYPE DEFINITIONS
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProducts } from '@/hooks/useProducts'
import { TransactionsTable } from '@/components/income/TransactionsTable'

interface Product {
  id: string
  name: string
  price: number
  product_type?: 'physical' | 'service'
  service_duration?: number
}

export const dynamic = 'force-dynamic'

export default function InputIncomePage() {
  const supabase = createClient()
  
  // ============================================
  // 🔵 PART 1: STATE VARIABLES - EXISTING
  // ============================================
  const [incomeType, setIncomeType] = useState<'operating' | 'investing' | 'financing'>('operating')
  const [category, setCategory] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  
  // Product sales specific
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customUnit, setCustomUnit] = useState('') // User-defined unit
  
  // ============================================
  // 🟢 PART 1: STATE VARIABLES - NEW (Payment & Tempo Tracking)
  // Search keyword: "NEW STATE PAYMENT"
  // ============================================
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [paymentType, setPaymentType] = useState<'cash' | 'tempo'>('cash')
  const [tempoDays, setTempoDays] = useState(7)
  const [dueDate, setDueDate] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // ============================================
  // 🟢 PART 1: STATE VARIABLES - NEW (Transactions Table)
  // Search keyword: "NEW STATE TRANSACTIONS"
  // ============================================
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [businessName, setBusinessName] = useState('Bisnis Saya')
  
  // UI states
  const [submitting, setSubmitting] = useState(false)
  const [showEducationalModal, setShowEducationalModal] = useState(false)
  
  // ============================================
  // 🟢 NEW: Quick Add Product Modal
  // ============================================
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'physical' | 'service'>('physical')
  const [quickProductName, setQuickProductName] = useState('')
  const [quickProductPrice, setQuickProductPrice] = useState('')
  const [quickProductDuration, setQuickProductDuration] = useState('')
  const [savingQuickProduct, setSavingQuickProduct] = useState(false)
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error' | 'warning', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })
  
  // KPI stats
  const [kpiStats, setKpiStats] = useState({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 }
  })
  const [loadingKpi, setLoadingKpi] = useState(true)

  // ============================================
  // 🟢 PART 1: HOOKS - UPDATED (Single hook with memoized filter)
  // Search keyword: "UPDATED USEPRODUCTS"
  // ============================================
  // Memoize filter to prevent infinite re-renders
  const productFilter = useMemo(() => {
    if (category === 'service_income') {
      return { productType: 'service' as const }
    }
    if (category === 'product_sales') {
      return { productType: 'physical' as const }
    }
    return undefined
  }, [category])
  
  const { products, loading: loadingProducts, refresh: refreshProducts } = useProducts(productFilter)

  // ============================================
  // EXISTING: useEffect - Educational Modal & KPI
  // ============================================
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('katalara_income_education_seen')
    if (!hasSeenModal) {
      setShowEducationalModal(true)
    }
    fetchKpiStats()
  }, [])

  // ============================================
  // 🟢 PART 4: NEW useEffect - Fetch Transactions on Mount
  // Search keyword: "NEW USEEFFECT TRANSACTIONS"
  // ============================================
  useEffect(() => {
    fetchTransactions()
  }, [])

  // ============================================
  // EXISTING: Helper Functions
  // ============================================
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }

  const closeEducationalModal = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('katalara_income_education_seen', 'true')
    }
    setShowEducationalModal(false)
  }

  const fetchKpiStats = async () => {
    try {
      setLoadingKpi(true)
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      
      // Fetch from API
      const [todayRes, weekRes, monthRes] = await Promise.all([
        fetch(`/api/income?start_date=${today}&end_date=${today}`),
        fetch(`/api/income?start_date=${weekAgo}`),
        fetch(`/api/income?start_date=${monthStart}`)
      ])

      const [todayData, weekData, monthData] = await Promise.all([
        todayRes.json(),
        weekRes.json(),
        monthRes.json()
      ])

      const calculateStats = (data: any) => ({
        amount: data.data?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
        count: data.data?.length || 0
      })

      setKpiStats({
        today: calculateStats(todayData),
        week: calculateStats(weekData),
        month: calculateStats(monthData)
      })
    } catch (error) {
      console.error('Failed to fetch KPI:', error)
      setKpiStats({
        today: { amount: 0, count: 0 },
        week: { amount: 0, count: 0 },
        month: { amount: 0, count: 0 }
      })
    } finally {
      setLoadingKpi(false)
    }
  }

  // ============================================
  // 🟢 PART 4: NEW FUNCTION - Fetch Recent Transactions
  // Search keyword: "NEW FUNCTION FETCH TRANSACTIONS"
  // ============================================
  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const response = await fetch('/api/income?limit=10&offset=0')
      const result = await response.json()
      
      if (result.success) {
        setTransactions(result.data || [])
      } else {
        console.error('Failed to fetch transactions:', result.error)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // ============================================
  // 🟢 NEW FUNCTION: Quick Add Product
  // ============================================
  const handleQuickAddProduct = async () => {
    if (!quickProductName.trim() || !quickProductPrice) {
      showToast('warning', '⚠️ Mohon lengkapi nama dan harga')
      return
    }

    // Duration is optional for services (flexibility for unpredictable work)

    setSavingQuickProduct(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const productData = {
        owner_id: user.id,
        name: quickProductName.trim(),
        category: quickAddType === 'physical' ? 'product' : 'service',
        product_type: quickAddType,
        sell_price: parseFloat(quickProductPrice.replace(/\./g, '')),
        service_duration: quickAddType === 'service' && quickProductDuration ? parseInt(quickProductDuration) : null,
        track_inventory: quickAddType === 'physical',
        is_active: true,
        stock_quantity: quickAddType === 'physical' ? 0 : null,
        min_stock_alert: quickAddType === 'physical' ? 5 : null
      }

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error

      // Reset form
      setQuickProductName('')
      setQuickProductPrice('')
      setQuickProductDuration('')
      setShowQuickAddModal(false)

      // Auto-select the new product
      if (data) {
        setSelectedProductId(data.id)
        setPricePerUnit(data.sell_price.toString())
      }

      // Refresh product list without page reload
      await refreshProducts()
      
      showToast('success', `✅ ${quickAddType === 'physical' ? 'Produk' : 'Layanan'} berhasil ditambahkan!`)

    } catch (error: any) {
      console.error('Error adding product:', error)
      showToast('error', `❌ Gagal menambahkan: ${error.message}`)
    } finally {
      setSavingQuickProduct(false)
    }
  }

  // Format number with thousand separator
  const formatNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Handle number input
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    setter(formatNumber(e.target.value))
  }

  // Reset category when income type changes
  const handleIncomeTypeChange = (type: 'operating' | 'investing' | 'financing') => {
    setIncomeType(type)
    setCategory('')
    // Reset product sales fields
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomerName('')
  }

  // Handle category change
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    
    // If not product_sales or service_income, clear product-specific fields
    if (!['product_sales', 'service_income'].includes(cat)) {
      setSelectedProductId('')
      setQuantity('')
      setPricePerUnit('')
      setCustomerName('')
      setCustomUnit('')
    } else {
      // Clear simple amount for product/service sales
      setAmount('')
      // Set default unit based on new category
      setCustomUnit(cat === 'product_sales' ? 'pcs' : 'jam')
    }
  }

  // Calculate total for product/service sales
  const calculateTotal = () => {
    if (!quantity || !pricePerUnit) return 0
    const qtyNum = parseInt(quantity.replace(/\./g, ''))
    const priceNum = parseInt(pricePerUnit.replace(/\./g, ''))
    return qtyNum * priceNum
  }

  // ============================================
  // 🟢 PART 4: UPDATED FUNCTION - handleSubmit (with Payment Tracking)
  // Search keyword: "UPDATED HANDLESUBMIT"
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (['product_sales', 'service_income'].includes(category)) {
      if (!selectedProductId || !quantity || !pricePerUnit) {
        showToast('warning', '⚠️ Mohon lengkapi produk/layanan, jumlah, dan harga')
        return
      }
    } else {
      if (!amount) {
        showToast('warning', '⚠️ Mohon masukkan jumlah pendapatan')
        return
      }
    }

    // 🟢 NEW: Validate tempo payment requirements
    if (paymentType === 'tempo') {
      if (!dueDate) {
        showToast('warning', '⚠️ Mohon pilih tanggal jatuh tempo untuk pembayaran tempo')
        return
      }
      if (!customerPhone) {
        showToast('warning', '⚠️ Mohon masukkan nomor WhatsApp customer untuk pembayaran tempo')
        return
      }
    }

    setSubmitting(true)

    try {
      const finalAmount = ['product_sales', 'service_income'].includes(category)
        ? calculateTotal()
        : parseFloat(amount.replace(/\./g, ''))

      // 🟢 NEW: Get service duration if applicable
      let serviceDuration = null
      if (category === 'service_income' && selectedProductId) {
        const product = products.find((p: Product) => p.id === selectedProductId) as any
        serviceDuration = product?.service_duration || null
      }

      const payload = {
        income_date: transactionDate,
        income_type: incomeType,
        category,
        amount: finalAmount,
        description: description || null,
        notes: notes || null,
        payment_method: paymentMethod,
        // 🟢 NEW: Payment tracking fields
        payment_type: paymentType,
        payment_status: paymentType === 'tempo' ? 'Pending' : 'Lunas',
        due_date: paymentType === 'tempo' ? dueDate : null,
        customer_phone: paymentType === 'tempo' ? (customerPhone || null) : null,
        // Product/Service specific
        product_id: ['product_sales', 'service_income'].includes(category) ? selectedProductId : null,
        quantity: ['product_sales', 'service_income'].includes(category) ? parseInt(quantity.replace(/\./g, '')) : null,
        price_per_unit: ['product_sales', 'service_income'].includes(category) ? parseInt(pricePerUnit.replace(/\./g, '')) : null,
        service_duration: serviceDuration,
        customer_name: customerName || null
      }

      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showToast('success', '✅ Pendapatan berhasil disimpan!')
        
        // Reset form
        resetForm()
        
        // 🟢 NEW: Refresh data including transactions table
        fetchKpiStats()
        fetchTransactions()
      } else {
        showToast('error', '❌ Gagal menyimpan: ' + (result.error || 'Unknown error'))
      }
      
    } catch (error: any) {
      console.error('Submit error:', error)
      showToast('error', '❌ Gagal menyimpan: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================
  // 🟢 PART 4: UPDATED FUNCTION - resetForm (with Payment Fields)
  // Search keyword: "UPDATED RESETFORM"
  // ============================================
  const resetForm = () => {
    setCategory('')
    setAmount('')
    setDescription('')
    setNotes('')
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomerName('')
    setPaymentMethod('Tunai')
    // 🟢 NEW: Reset payment tracking fields
    setPaymentType('cash')
    setTempoDays(7)
    setDueDate('')
    setCustomerPhone('')
    setTransactionDate(new Date().toISOString().split('T')[0])
  }

  // Category options based on income type
  const getCategoryOptions = () => {
    const options = {
      operating: [
        { value: 'product_sales', label: '💰 Penjualan Produk' },
        { value: 'service_income', label: '🛠️ Pendapatan Jasa' },
        { value: 'other_income', label: '📊 Pendapatan Lain' }
      ],
      investing: [
        { value: 'asset_sales', label: '🏢 Jual Aset' },
        { value: 'investment_return', label: '📈 Return Investasi' },
        { value: 'interest_income', label: '💸 Bunga Bank' }
      ],
      financing: [
        { value: 'owner_capital', label: '💵 Modal Masuk' },
        { value: 'loan_received', label: '🏦 Pinjaman Diterima' },
        { value: 'investor_funding', label: '🤝 Dana Investor' }
      ]
    }
    return options[incomeType] || []
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Pendapatan</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Catat semua pendapatan bisnis untuk tracking yang akurat
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
            <div className="text-2xl font-bold text-green-600">
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
            <div className="text-2xl font-bold text-blue-600">
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
            <div className="text-2xl font-bold text-purple-600">
              Rp {kpiStats.month.amount.toLocaleString('id-ID')}
            </div>
          )}
          <div className="text-xs text-gray-500">{kpiStats.month.count} transaksi</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pendapatan Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Pendapatan
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Transaksi
            </label>
            <select
              value={incomeType}
              onChange={(e) => handleIncomeTypeChange(e.target.value as 'operating' | 'investing' | 'financing')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="operating">Operasional</option>
              <option value="investing">Investasi</option>
              <option value="financing">Pendanaan</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {incomeType === 'operating' && 'Pendapatan dari aktivitas bisnis utama'}
              {incomeType === 'investing' && 'Pendapatan dari investasi aset atau instrumen keuangan'}
              {incomeType === 'financing' && 'Pendapatan dari modal atau pinjaman'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Pendapatan
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="">-- Pilih Kategori --</option>
              {getCategoryOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* ============================================
              🟢 PART 3: PRODUCT/SERVICE SELECTOR (UNIFIED)
              Search keyword: "PART3 UNIFIED SELECTOR"
              ============================================ */}
          {['product_sales', 'service_income'].includes(category) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {category === 'product_sales' ? (
                    <>Pilih Produk <span className="text-red-500">*</span></>
                  ) : (
                    <>Pilih Layanan Jasa <span className="text-red-500">*</span></>
                  )}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      setQuickAddType(category === 'product_sales' ? 'physical' : 'service')
                      setShowQuickAddModal(true)
                      return
                    }
                    setSelectedProductId(e.target.value)
                    const product = products.find((p: Product) => p.id === e.target.value)
                    if (product) {
                      setPricePerUnit(product.price.toString())
                    }
                    // Set default unit based on category
                    if (!customUnit) {
                      setCustomUnit(category === 'product_sales' ? 'pcs' : 'jam')
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="">
                    {category === 'product_sales' ? '-- Pilih Produk --' : '-- Pilih Layanan --'}
                  </option>
                  <option value="__ADD_NEW__" className="text-green-600 font-medium">
                    ➕ {category === 'product_sales' ? 'Tambah Produk Baru' : 'Tambah Layanan Baru'}
                  </option>
                  <option disabled>────────────────</option>
                  {products.map((product: Product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rp {product.price.toLocaleString('id-ID')}
                      {category === 'service_income' && product.service_duration && 
                        ` (${product.service_duration} menit)`
                      }
                    </option>
                  ))}
                </select>
                {loadingProducts && (
                  <p className="text-xs text-gray-500 mt-1 animate-pulse">
                    Loading {category === 'product_sales' ? 'produk' : 'layanan'}...
                  </p>
                )}
                {!loadingProducts && products.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Belum ada {category === 'product_sales' ? 'produk' : 'layanan'} tersedia. 
                    <a href="/dashboard/products" className="underline ml-1">Tambah dulu yuk!</a>
                  </p>
                )}
              </div>

              {selectedProductId && (
                <>
                  {/* Quantity, Unit, and Price - Professional Layout */}
                  <div className="space-y-4">
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => handleNumberInput(e, setQuantity)}
                        placeholder="1"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    {/* Unit Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Satuan <span className="text-gray-400 text-xs">(opsional)</span>
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      >
                        {category === 'product_sales' ? (
                          <>
                            <option value="pcs">pcs (pieces/satuan)</option>
                            <option value="unit">unit</option>
                            <option value="pasang">pasang</option>
                            <option value="lusin">lusin (12 pcs)</option>
                            <option value="box">box/kotak</option>
                            <option value="kg">kg (kilogram)</option>
                            <option value="gram">gram</option>
                            <option value="liter">liter</option>
                            <option value="meter">meter</option>
                            <option value="roll">roll/gulungan</option>
                          </>
                        ) : (
                          <>
                            <option value="jam">jam</option>
                            <option value="hari">hari</option>
                            <option value="minggu">minggu</option>
                            <option value="bulan">bulan</option>
                            <option value="proyek">proyek</option>
                            <option value="paket">paket</option>
                            <option value="orang">orang</option>
                            <option value="kali">kali/sesi</option>
                            <option value="kunjungan">kunjungan</option>
                          </>
                        )}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Pilih satuan yang sesuai untuk bisnis Anda
                      </p>
                    </div>

                    {/* Price per Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga per {customUnit || 'unit'} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                        <input
                          type="text"
                          value={formatNumber(pricePerUnit)}
                          onChange={(e) => handleNumberInput(e, setPricePerUnit)}
                          placeholder="75.000"
                          required
                          className="w-full pl-12 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          /{customUnit || 'unit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 NEW: Service Duration Info (for service_income only) */}
                  {category === 'service_income' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">⏱️</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {(() => {
                              const product = products.find((p: Product) => p.id === selectedProductId) as any
                              const duration = product?.service_duration || 0
                              const hours = Math.floor(duration / 60)
                              const minutes = duration % 60
                              
                              if (hours > 0 && minutes > 0) {
                                return `Durasi: ${hours} jam ${minutes} menit per sesi`
                              } else if (hours > 0) {
                                return `Durasi: ${hours} jam per sesi`
                              } else {
                                return `Durasi: ${minutes} menit per sesi`
                              }
                            })()}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Total waktu: {(() => {
                              const product = products.find((p: Product) => p.id === selectedProductId) as any
                              const duration = (product?.service_duration || 0) * (parseInt(quantity.replace(/\./g, '')) || 1)
                              const hours = Math.floor(duration / 60)
                              const minutes = duration % 60
                              
                              if (hours > 0 && minutes > 0) {
                                return `${hours} jam ${minutes} menit`
                              } else if (hours > 0) {
                                return `${hours} jam`
                              } else {
                                return `${minutes} menit`
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Customer {category === 'service_income' && <span className="text-gray-400">(opsional)</span>}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Ibu Siti"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  {/* Total Calculation */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Total {category === 'product_sales' ? 'Penjualan' : 'Pendapatan'}:
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          {quantity.replace(/\./g, '') || '0'} {category === 'product_sales' ? 'unit' : 'sesi'} × Rp {formatNumber(pricePerUnit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-700">
                          Rp {calculateTotal().toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {/* END PART 3 */}

          {/* Simple amount input for other categories */}
          {category && !['product_sales', 'service_income'].includes(category) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pendapatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={formatNumber(amount)}
                    onChange={(e) => handleNumberInput(e, setAmount)}
                    placeholder="0"
                    required
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Bunga deposito November 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
            </>
          )}

          {/* Notes (Optional for all) */}
          {category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan <span className="text-gray-400 text-xs">(opsional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahan informasi atau catatan khusus..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none"
              />
            </div>
          )}

          {/* ============================================
              🟢 PART 2: PAYMENT METHOD & TEMPO UI
              Search keyword: "PART2 PAYMENT TEMPO"
              ============================================ */}
          {category && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="Tunai">💵 Tunai</option>
                  <option value="Transfer">🏦 Transfer Bank</option>
                  <option value="QRIS">📱 QRIS</option>
                  <option value="E-Wallet">💳 E-Wallet (GoPay, OVO, Dana)</option>
                  <option value="Kartu Kredit">💳 Kartu Kredit/Debit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('cash')
                      setDueDate('')
                      setCustomerPhone('')
                    }}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentType === 'cash'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">💵</div>
                      <div className="font-semibold text-gray-900">Lunas</div>
                      <div className="text-xs text-gray-500 mt-1">Bayar langsung</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentType('tempo')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentType === 'tempo'
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">📅</div>
                      <div className="font-semibold text-gray-900">Kredit/Tempo</div>
                      <div className="text-xs text-gray-500 mt-1">Bayar nanti (Piutang)</div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentType === 'tempo' && (
                <>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-1">
                          Pembayaran Tempo (Piutang)
                        </h4>
                        <p className="text-sm text-orange-800">
                          Transaksi ini akan dicatat sebagai <strong>piutang</strong> yang perlu ditagih.
                          Sistem akan mencatat jatuh tempo dan status pembayaran untuk memudahkan penagihan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jangka Waktu Tempo
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[7, 14, 30, 60].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            setTempoDays(days)
                            const due = new Date(transactionDate)
                            due.setDate(due.getDate() + days)
                            setDueDate(due.toISOString().split('T')[0])
                          }}
                          className={`px-4 py-3 border-2 rounded-lg font-semibold transition-all ${
                            tempoDays === days
                              ? 'border-orange-500 bg-orange-100 text-orange-900 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-lg font-bold">{days}</div>
                          <div className="text-xs">Hari</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Pilih jangka waktu standar atau set manual di bawah
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={transactionDate}
                      required={paymentType === 'tempo'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    />
                    {dueDate && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          📅 <strong>Jatuh tempo:</strong> {new Date(dueDate).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          ({Math.ceil((new Date(dueDate).getTime() - new Date(transactionDate).getTime()) / (1000 * 60 * 60 * 24))} hari dari transaksi)
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor WhatsApp Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="08123456789"
                        pattern="[0-9]{10,15}"
                        required={paymentType === 'tempo'}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      📱 Untuk reminder otomatis dan kirim invoice via WhatsApp
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          {/* END PART 2 */}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || !category}
              className="w-full bg-[#1088ff] hover:bg-[#0d6ecc] text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                '💾 Simpan Pendapatan'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Educational Modal */}
      {showEducationalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1088ff] to-[#0d6ecc] p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">📚 Panduan Kategori Pendapatan</h2>
                  <p className="text-blue-100 text-sm">
                    Pahami perbedaan setiap kategori untuk pencatatan yang akurat
                  </p>
                </div>
                <button
                  onClick={() => closeEducationalModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* OPERASIONAL */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💰</span> 1. OPERASIONAL
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pendapatan dari aktivitas bisnis utama sehari-hari.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Penjualan Produk:</strong> Jual barang dagangan (baju, makanan, elektronik, dll)</li>
                  <li>• <strong>Pendapatan Jasa:</strong> Salon, bengkel, konsultan, desain grafis, dll</li>
                  <li>• <strong>Pendapatan Lain:</strong> Komisi, cashback, diskon supplier, dll</li>
                </ul>
              </div>

              {/* INVESTASI */}
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📈</span> 2. INVESTASI
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pendapatan dari aset investasi atau instrumen keuangan.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Bunga Deposito:</strong> Bunga dari tabungan/deposito bank</li>
                  <li>• <strong>Dividen Saham:</strong> Bagi hasil dari kepemilikan saham</li>
                  <li>• <strong>Capital Gain:</strong> Untung jual aset (tanah, emas, saham)</li>
                </ul>
              </div>

              {/* PENDANAAN */}
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>💰</span> 3. PENDANAAN
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Transaksi terkait modal pemilik dan pinjaman.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• <strong>Modal Masuk:</strong> Setor uang pribadi ke bisnis</li>
                  <li>• <strong>Pinjaman Diterima:</strong> KUR, P2P lending, pinjaman bank</li>
                  <li>• <strong>Hibah/Grant:</strong> Bantuan modal dari pemerintah/lembaga</li>
                </ul>
              </div>

              {/* Modal Masuk - SPECIAL HIGHLIGHT */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Modal Masuk vs Penjualan</h3>
                    <div className="bg-white rounded-lg p-3 mb-2">
                      <p className="text-xs text-gray-800 font-semibold mb-1">Modal Masuk:</p>
                      <p className="text-xs text-gray-700">
                        Uang <strong>pribadi</strong> yang Anda setor ke bisnis. Bukan pendapatan usaha, tapi penambahan modal owner.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-800 font-semibold mb-1">Penjualan Produk:</p>
                      <p className="text-xs text-gray-700">
                        Uang dari <strong>customer</strong> yang beli produk/jasa Anda. Ini pendapatan bisnis yang sebenarnya!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-2xl flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  id="dontShowAgainIncome"
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Jangan tampilkan lagi</span>
              </label>
              <button
                onClick={() => {
                  const checkbox = document.getElementById('dontShowAgainIncome') as HTMLInputElement
                  closeEducationalModal(checkbox?.checked || false)
                }}
                className="bg-[#1088ff] hover:bg-[#0d6ecc] text-white px-6 py-2 rounded-lg font-medium transition-all"
              >
                Mengerti, Mulai Input!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-in">
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

      {/* ============================================
          🟢 PART 5: RECENT TRANSACTIONS TABLE
          Search keyword: "PART5 TRANSACTIONS TABLE"
          ============================================ */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transaksi Terakhir</h2>
          <button
            onClick={() => fetchTransactions()}
            disabled={loadingTransactions}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${loadingTransactions ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span>{loadingTransactions ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
        
        {loadingTransactions ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Memuat transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">Belum ada transaksi tercatat</p>
            <p className="text-gray-400 text-sm mt-1">Mulai catat pendapatan pertama Anda di atas! 🚀</p>
          </div>
        ) : (
          <TransactionsTable
            transactions={transactions}
            businessName={businessName}
            onRefresh={fetchTransactions}
          />
        )}
      </div>
      {/* END PART 5 */}

      {/* ============================================
          🟢 NEW: Quick Add Product Modal
          ============================================ */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                ⚡ Tambah {quickAddType === 'physical' ? 'Produk' : 'Layanan'} Cepat
              </h3>
              <button
                onClick={() => {
                  setShowQuickAddModal(false)
                  setQuickProductName('')
                  setQuickProductPrice('')
                  setQuickProductDuration('')
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama {quickAddType === 'physical' ? 'Produk' : 'Layanan'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  placeholder={quickAddType === 'physical' ? 'Contoh: Baju Kemeja' : 'Contoh: Potong Rambut'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                  <input
                    type="text"
                    value={quickProductPrice}
                    onChange={(e) => handleNumberInput(e, setQuickProductPrice)}
                    placeholder="50.000"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {quickAddType === 'service' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durasi (menit) <span className="text-gray-400 text-xs">(opsional)</span>
                  </label>
                  <input
                    type="number"
                    value={quickProductDuration}
                    onChange={(e) => setQuickProductDuration(e.target.value)}
                    placeholder="30"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Kosongkan jika waktu tidak pasti (troubleshooting, dll)</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowQuickAddModal(false)
                    setQuickProductName('')
                    setQuickProductPrice('')
                    setQuickProductDuration('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleQuickAddProduct}
                  disabled={savingQuickProduct}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingQuickProduct ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>✅ Simpan</>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              💡 Tip: Anda bisa lengkapi detail produk nanti di menu Produk
            </p>
          </div>
        </div>
      )}
      {/* END Quick Add Modal */}
    </div>
  )
}
