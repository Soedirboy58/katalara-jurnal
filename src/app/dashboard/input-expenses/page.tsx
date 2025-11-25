'use client'

// ============================================
// 🔴 EXPENSE INPUT - REDESIGNED (MVP)
// Pattern: Copy from Income Input (Professional Multi-Items)
// Theme: RED (vs Income: BLUE)
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProducts } from '@/hooks/useProducts'
import SupplierModal from '@/components/modals/SupplierModal'
import POPreviewModal from '@/components/expenses/POPreviewModal'

interface Product {
  id: string
  name: string
  price: number
  stock?: number
  unit?: string
}

interface Supplier {
  id: string
  name: string
  supplier_type: 'raw_materials' | 'finished_goods' | 'both' | 'services'
  phone?: string
  email?: string
  address?: string
  total_purchases?: number
  total_payables?: number
  is_active: boolean
}

interface LineItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit: string
  price_per_unit: number
  subtotal: number
  notes?: string
}

export const dynamic = 'force-dynamic'

// Utility: Format currency with thousand separators
const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num)
}

export default function InputExpensesPageRedesigned() {
  const supabase = createClient()
  
  // ============================================
  // 📋 STATE: TRANSACTION HEADER
  // ============================================
  const [poNumber, setPoNumber] = useState(`PO/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`)
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  
  // ============================================
  // 👤 STATE: SUPPLIER
  // ============================================
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  
  // ============================================
  // 📦 STATE: MULTI-ITEMS
  // ============================================
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    unit: 'pcs',
    price_per_unit: '',
    notes: ''
  })
  
  // ============================================
  // 💰 STATE: SUMMARY & CALCULATIONS
  // ============================================
  const [subtotal, setSubtotal] = useState(0)
  const [discountMode, setDiscountMode] = useState<'percent' | 'nominal'>('percent') // NEW: Toggle % or Rp
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [pphPercent, setPphPercent] = useState(0) // NEW: PPh percentage
  const [pphPreset, setPphPreset] = useState<'0' | '1' | '2' | '3' | 'custom'>('0') // NEW: PPh preset
  const [pphAmount, setPphAmount] = useState(0) // NEW: PPh amount
  const [showOtherFees, setShowOtherFees] = useState(false) // NEW: Toggle other fees section
  const [otherFeesItems, setOtherFeesItems] = useState<Array<{id: string, label: string, amount: number}>>([]) // NEW: Multiple fees
  const [grandTotal, setGrandTotal] = useState(0)
  
  // ============================================
  // 💳 STATE: PAYMENT
  // ============================================
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Tempo'>('Lunas')
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [downPayment, setDownPayment] = useState(0)
  const [remainingPayment, setRemainingPayment] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [tempoDays, setTempoDays] = useState(7)
  
  // ============================================
  // 🏷️ STATE: CATEGORY & TYPE
  // ============================================
  const [category, setCategory] = useState('')
  const [expenseType, setExpenseType] = useState<'operating' | 'investing' | 'financing'>('operating')
  
  // ============================================
  // 🏭 STATE: PRODUCTION OUTPUT (For Raw Materials → Finished Goods)
  // ============================================
  const [showProductionOutput, setShowProductionOutput] = useState(false)
  const [productionOutputProduct, setProductionOutputProduct] = useState('')
  const [productionOutputQuantity, setProductionOutputQuantity] = useState('')
  const [productionOutputUnit, setProductionOutputUnit] = useState('pcs')
  
  // ============================================
  // 🎛️ STATE: UI CONTROLS
  // ============================================
  const [submitting, setSubmitting] = useState(false)
  const [showEducationalModal, setShowEducationalModal] = useState(false)
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error' | 'warning', message: string}>({
    show: false,
    type: 'success',
    message: ''
  })
  const [showNotes, setShowNotes] = useState(false)
  
  // Quick Add Product Modal
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false)
  const [quickProductName, setQuickProductName] = useState('')
  const [quickProductPrice, setQuickProductPrice] = useState('')
  const [quickProductUnit, setQuickProductUnit] = useState('pcs')
  const [quickProductStock, setQuickProductStock] = useState('0')
  const [savingQuickProduct, setSavingQuickProduct] = useState(false)
  
  // Preview Modal (Old - for backward compatibility)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewExpense, setPreviewExpense] = useState<any>(null)
  
  // PO Preview Modal (New - Professional)
  const [showPOPreview, setShowPOPreview] = useState(false)
  const [businessName, setBusinessName] = useState('Bisnis Saya')
  
  // ============================================
  // 📊 STATE: KPI & TRANSACTIONS LIST
  // ============================================
  const [kpiStats, setKpiStats] = useState({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 }
  })
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterExpenseType, setFilterExpenseType] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // ============================================
  // 🔌 HOOKS: PRODUCTS
  // ============================================
  const { products, loading: loadingProducts } = useProducts()
  
  // ============================================
  // 🎯 EFFECTS: CALCULATIONS
  // ============================================
  
  // Calculate subtotal from line items
  useEffect(() => {
    const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
    setSubtotal(total)
  }, [lineItems])
  
  // Calculate discount based on mode
  useEffect(() => {
    if (discountMode === 'percent' && discountPercent > 0) {
      const discount = (subtotal * discountPercent) / 100
      setDiscountAmount(discount)
    } else if (discountMode === 'nominal') {
      // discountAmount already set directly by user
    } else {
      setDiscountAmount(0)
    }
  }, [subtotal, discountPercent, discountMode])
  
  // Calculate PPh amount
  useEffect(() => {
    if (pphPercent > 0) {
      const pph = (subtotal - discountAmount) * (pphPercent / 100)
      setPphAmount(pph)
    } else {
      setPphAmount(0)
    }
  }, [subtotal, discountAmount, pphPercent])

  // Calculate grand total with PPh and multiple other fees
  useEffect(() => {
    const otherFeesTotal = otherFeesItems.reduce((sum, item) => sum + item.amount, 0)
    const total = subtotal - discountAmount + taxAmount + pphAmount + otherFeesTotal
    setGrandTotal(total)
  }, [subtotal, discountAmount, taxAmount, pphAmount, otherFeesItems])
  
  // Calculate remaining payment
  useEffect(() => {
    const remaining = grandTotal - downPayment
    setRemainingPayment(remaining > 0 ? remaining : 0)
  }, [grandTotal, downPayment])
  
  // ============================================
  // 🎯 EFFECTS: LOAD DATA
  // ============================================
  
  useEffect(() => {
    const initPage = async () => {
      loadKpiStats()
      await loadExpenses()
      
      // Check if user has seen modal before (localStorage)
      const hasSeenModal = localStorage.getItem('katalara_expenses_education_seen_v3')
      if (!hasSeenModal) {
        setShowEducationalModal(true)
      }
    }
    initPage() // Call the function to execute
  }, [])
  
  // Reload when filters or pagination change
  useEffect(() => {
    loadExpenses()
  }, [currentPage, filterCategory, filterPaymentStatus, filterExpenseType, filterDateStart, filterDateEnd])
  
  // Load business name
  useEffect(() => {
    const loadBusinessName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', user.id)
          .single()
        if (data && data.business_name) {
          setBusinessName(data.business_name)
        }
      }
    }
    loadBusinessName()
  }, [])
  
  // ============================================
  // 📡 FUNCTIONS: DATA LOADING
  // ============================================
  
  const loadKpiStats = async () => {
    setLoadingKpi(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Today
      const { data: todayData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('owner_id', user.id)
        .eq('expense_date', today)
      
      // Week
      const { data: weekData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('owner_id', user.id)
        .gte('expense_date', weekAgo)
      
      // Month
      const { data: monthData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('owner_id', user.id)
        .gte('expense_date', monthStart)
      
      setKpiStats({
        today: {
          amount: todayData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          count: todayData?.length || 0
        },
        week: {
          amount: weekData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          count: weekData?.length || 0
        },
        month: {
          amount: monthData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
          count: monthData?.length || 0
        }
      })
    } catch (error) {
      console.error('Error loading KPI:', error)
    } finally {
      setLoadingKpi(false)
    }
  }
  
  const loadExpenses = async () => {
    setLoadingExpenses(true)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      
      // Build query params with filters
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        include_items: 'true'
      })
      
      if (filterCategory) params.append('category', filterCategory)
      if (filterPaymentStatus) params.append('payment_status', filterPaymentStatus)
      if (filterExpenseType) params.append('expense_type', filterExpenseType)
      if (filterDateStart) params.append('start_date', filterDateStart)
      if (filterDateEnd) params.append('end_date', filterDateEnd)
      
      const res = await fetch(`/api/expenses?${params.toString()}`)
      const json = await res.json()
      
      if (json.success) {
        setExpenses(json.data || [])
        setTotalItems(json.count || 0)
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoadingExpenses(false)
    }
  }
  
  // ============================================
  // 🎨 FUNCTIONS: LINE ITEMS MANAGEMENT
  // ============================================
  
  const handleAddItem = () => {
    // Validation
    if (!currentItem.product_name.trim()) {
      showToast('error', 'Nama produk wajib diisi')
      return
    }
    
    const qty = parseFloat(currentItem.quantity)
    const price = parseFloat(currentItem.price_per_unit)
    
    if (isNaN(qty) || qty <= 0) {
      showToast('error', 'Jumlah harus lebih dari 0')
      return
    }
    
    if (isNaN(price) || price < 0) {
      showToast('error', 'Harga tidak valid')
      return
    }
    
    const newItem: LineItem = {
      id: Date.now().toString(),
      product_id: currentItem.product_id || null,
      product_name: currentItem.product_name,
      quantity: qty,
      unit: currentItem.unit,
      price_per_unit: price,
      subtotal: qty * price,
      notes: currentItem.notes
    }
    
    setLineItems([...lineItems, newItem])
    
    // Reset form
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: '',
      unit: 'pcs',
      price_per_unit: '',
      notes: ''
    })
    
    showToast('success', 'Item ditambahkan')
  }
  
  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
    showToast('warning', 'Item dihapus')
  }
  
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setCurrentItem({
        ...currentItem,
        product_id: product.id,
        product_name: product.name,
        price_per_unit: product.price.toString(),
        unit: product.unit || 'pcs'
      })
    }
  }
  
  // ============================================
  // 💾 FUNCTIONS: SUBMIT EXPENSE
  // ============================================
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (lineItems.length === 0) {
      showToast('error', 'Minimal 1 item harus ditambahkan')
      return
    }
    
    if (paymentStatus === 'Tempo' && downPayment > grandTotal) {
      showToast('error', 'DP tidak boleh melebihi Total')
      return
    }
    
    if (paymentStatus === 'Tempo' && !dueDate) {
      showToast('error', 'Tanggal jatuh tempo wajib diisi untuk pembayaran tempo')
      return
    }
    
    setSubmitting(true)
    
    try {
      const expenseData = {
        expense_date: transactionDate,
        category,
        expense_type: expenseType,
        description: description || `Pembelian ${lineItems.length} item`,
        notes,
        payment_method: paymentMethod,
        payment_type: paymentStatus === 'Lunas' ? 'cash' : 'tempo',
        payment_status: paymentStatus,
        due_date: paymentStatus === 'Tempo' ? dueDate : null,
        
        // Multi-items data
        supplier_id: selectedSupplier?.id || null,
        line_items: lineItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.price_per_unit,
          subtotal: item.subtotal,
          notes: item.notes
        })),
        
        // Production output (for raw materials → finished goods)
        production_output: (category === 'Pembelian Bahan Baku' && showProductionOutput && productionOutputProduct && productionOutputQuantity) ? {
          product_id: productionOutputProduct,
          quantity: parseFloat(productionOutputQuantity),
          unit: productionOutputUnit
        } : null,
        
        // Financial breakdown
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        pph_percent: pphPercent,
        pph_amount: pphAmount,
        other_fees: otherFeesItems.reduce((sum, f) => sum + f.amount, 0),
        other_fees_details: JSON.stringify(otherFeesItems),
        down_payment: paymentStatus === 'Tempo' ? downPayment : 0,
        remaining_payment: paymentStatus === 'Tempo' ? remainingPayment : 0,
        grand_total: grandTotal
      }
      
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      })
      
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || `HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      
      if (json.success) {
        showToast('success', `✓ Pengeluaran berhasil disimpan! ${json.data?.purchase_order_number || ''}`)
        
        // Reset form
        setTimeout(() => {
          resetForm()
          loadKpiStats()
          loadExpenses()
        }, 500)
      } else {
        throw new Error(json.error || 'Gagal menyimpan pengeluaran')
      }
    } catch (error: any) {
      console.error('Error submitting expense:', error)
      showToast('error', `❌ ${error.message || 'Terjadi kesalahan saat menyimpan'}`)
    } finally {
      setSubmitting(false)
    }
  }
  
  const resetForm = () => {
    setLineItems([])
    setCurrentItem({
      product_id: '',
      product_name: '',
      quantity: '',
      unit: 'pcs',
      price_per_unit: '',
      notes: ''
    })
    setSelectedSupplier(null)
    setDescription('')
    setNotes('')
    setDiscountPercent(0)
    setDiscountAmount(0)
    setDiscountMode('percent')
    setTaxAmount(0)
    setPphPercent(0)
    setPphAmount(0)
    setPphPreset('0')
    setOtherFeesItems([])
    setShowOtherFees(false)
    setDownPayment(0)
    setPaymentStatus('Lunas')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setPoNumber(`PO/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`)
    
    // Reset production output
    setShowProductionOutput(false)
    setProductionOutputProduct('')
    setProductionOutputQuantity('')
    setProductionOutputUnit('pcs')
  }
  
  // ============================================
  // 🔔 FUNCTIONS: TOAST
  // ============================================
  
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type, message: '' }), 4000)
  }
  
  // ============================================
  // 🆕 FUNCTIONS: QUICK ADD PRODUCT
  // ============================================
  
  const handleQuickAddProduct = async () => {
    if (!quickProductName.trim()) {
      showToast('error', 'Nama produk wajib diisi')
      return
    }
    
    const price = parseFloat(quickProductPrice)
    if (isNaN(price) || price < 0) {
      showToast('error', 'Harga tidak valid')
      return
    }
    
    setSavingQuickProduct(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          owner_id: user.id,
          name: quickProductName,
          price: price,
          stock_quantity: parseFloat(quickProductStock) || 0,
          unit: quickProductUnit,
          product_type: 'physical'
        })
        .select()
        .single()
      
      if (error) throw error
      
      showToast('success', `✓ Produk "${quickProductName}" berhasil ditambahkan dan siap digunakan`)
      
      // Auto-fill form with new product
      setCurrentItem({
        ...currentItem,
        product_id: newProduct.id,
        product_name: newProduct.name,
        price_per_unit: newProduct.price.toString(),
        unit: newProduct.unit || 'pcs'
      })
      
      // Close modal and reset
      setShowQuickAddProduct(false)
      setQuickProductName('')
      setQuickProductPrice('')
      setQuickProductUnit('pcs')
      setQuickProductStock('0')
      
      // Refresh products list without reload (prevent modal restart)
      const { data: updatedProducts } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      
      if (updatedProducts) {
        // Update products state if available (Note: products comes from useProducts hook)
        // The new product is already filled in currentItem, so user can continue
      }
    } catch (error: any) {
      console.error('Error adding product:', error)
      showToast('error', error.message || 'Gagal menambahkan produk')
    } finally {
      setSavingQuickProduct(false)
    }
  }
  
  // ============================================
  // 🎨 RENDER: MAIN UI
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ============================================ */}
        {/* PAGE HEADER */}
        {/* ============================================ */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Input Pengeluaran</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Purchase Order dengan sistem multi-items
            </p>
          </div>
          <button
            onClick={() => setShowEducationalModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="hidden sm:inline">Panduan Kategori</span>
            <span className="sm:hidden">📚</span>
          </button>
        </div>

        {/* ============================================ */}
        {/* 📊 KPI STATS SECTION - Professional Design with Icons */}
        {/* ============================================ */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today */}
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Hari Ini</p>
                {loadingKpi ? (
                  <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    Rp {formatCurrency(kpiStats.today.amount)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{kpiStats.today.count} transaksi</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Week */}
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">7 Hari</p>
                {loadingKpi ? (
                  <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    Rp {formatCurrency(kpiStats.week.amount)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{kpiStats.week.count} transaksi</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Month */}
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Bulan Ini</p>
                {loadingKpi ? (
                  <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    Rp {formatCurrency(kpiStats.month.amount)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{kpiStats.month.count} transaksi</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* ============================================ */}
        {/* 📝 MAIN FORM SECTION */}
        {/* ============================================ */}
        <div className="space-y-6">
            
            {/* HEADER CARD (Gradient Red) */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl shadow-lg p-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* PO Number */}
                <div>
                  <label className="block text-sm font-medium text-red-100 mb-2">PO Number</label>
                  <input
                    type="text"
                    value={poNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-red-200 font-mono text-sm cursor-not-allowed"
                  />
                </div>
                
                {/* Supplier Button */}
                <div>
                  <label className="block text-sm font-medium text-red-100 mb-2">Supplier</label>
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium transition-colors text-left flex items-center gap-2"
                  >
                    {selectedSupplier ? (
                      <>
                        <span className="flex-1 truncate">{selectedSupplier.name}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">Pilih Supplier</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-red-100 mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white [color-scheme:dark]"
                  />
                </div>
                
                {/* Notes Toggle */}
                <div>
                  <label className="block text-sm font-medium text-red-100 mb-2">Catatan</label>
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="w-full px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showNotes ? "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                    {showNotes ? 'Sembunyikan' : 'Tambah'} Catatan
                  </button>
                </div>
              </div>
              
              {/* Expandable Notes Section */}
              {showNotes && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan (opsional)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-red-200 resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
              )}
              
              {/* Supplier Info (if selected) */}
              {selectedSupplier && (
                <div className="mt-4 bg-white/10 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSupplier.phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="truncate">{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{selectedSupplier.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* CATEGORY & TYPE SECTION */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🏷️ Kategori & Jenis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expense Type - PINDAH KE ATAS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pengeluaran <span className="text-red-600">*</span></label>
                  <select
                    value={expenseType}
                    onChange={(e) => {
                      setExpenseType(e.target.value as any)
                      setCategory('') // Reset kategori saat ganti jenis
                    }}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                  >
                    <option value="operating">🔄 Operating (Operasional Harian)</option>
                    <option value="investing">🏗️ Investing (Aset & Peralatan)</option>
                    <option value="financing">💳 Financing (Pembayaran Utang)</option>
                  </select>
                </div>
                
                {/* Category - DINAMIS BERDASARKAN JENIS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Pengeluaran <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {expenseType === 'operating' && (
                      <>
                        <option value="Pembelian Produk Jadi">Pembelian Produk Jadi (Reseller)</option>
                        <option value="Pembelian Bahan Baku">Pembelian Bahan Baku (Produksi)</option>
                        <option value="Gaji & Upah">Gaji & Upah</option>
                        <option value="Marketing & Iklan">Marketing & Iklan</option>
                        <option value="Operasional Toko">Operasional Toko</option>
                        <option value="Transportasi & Logistik">Transportasi & Logistik</option>
                        <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                        <option value="Utilitas">Utilitas (Listrik, Air, Internet)</option>
                        <option value="Pemeliharaan & Perbaikan">Pemeliharaan & Perbaikan</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </>
                    )}
                    {expenseType === 'investing' && (
                      <>
                        <option value="Pembelian Peralatan">Pembelian Peralatan</option>
                        <option value="Pembelian Kendaraan">Pembelian Kendaraan</option>
                        <option value="Renovasi Toko">Renovasi Toko</option>
                        <option value="Pembelian Properti">Pembelian Properti</option>
                        <option value="Software & Teknologi">Software & Teknologi</option>
                      </>
                    )}
                    {expenseType === 'financing' && (
                      <>
                        <option value="Bayar Utang Bank">Bayar Utang Bank</option>
                        <option value="Bayar Utang Supplier">Bayar Utang Supplier</option>
                        <option value="Bayar Cicilan">Bayar Cicilan</option>
                        <option value="Bayar Bunga Pinjaman">Bayar Bunga Pinjaman</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
            
            {/* PRODUCTION OUTPUT SECTION - Only for Raw Materials */}
            {category === 'Pembelian Bahan Baku' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 rounded-full p-2">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">🏭 Hasil Produksi</h2>
                      <p className="text-xs text-gray-600">Produk jadi yang dihasilkan dari bahan baku</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductionOutput(!showProductionOutput)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showProductionOutput 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-white text-green-600 border-2 border-green-600 hover:bg-green-50'
                    }`}
                  >
                    {showProductionOutput ? '✓ Aktif' : '+ Tambah Output'}
                  </button>
                </div>
                
                {showProductionOutput && (
                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Produk yang Dihasilkan */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Produk Jadi <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={productionOutputProduct}
                          onChange={(e) => {
                            setProductionOutputProduct(e.target.value)
                            const selected = products.find(p => p.id === e.target.value)
                            if (selected && selected.unit) {
                              setProductionOutputUnit(selected.unit)
                            }
                          }}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                        >
                          <option value="">-- Pilih produk yang diproduksi --</option>
                          {products.filter(p => p.name && p.name.trim() !== '').map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock_quantity || 0} {p.unit || 'pcs'})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Stok produk ini akan bertambah otomatis
                        </p>
                      </div>
                      
                      {/* Jumlah Output */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jumlah Output <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={productionOutputQuantity}
                          onChange={(e) => setProductionOutputQuantity(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      
                      {/* Satuan */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Satuan
                        </label>
                        <input
                          type="text"
                          value={productionOutputUnit}
                          onChange={(e) => setProductionOutputUnit(e.target.value)}
                          placeholder="pcs, kg, box"
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Preview Summary */}
                    {productionOutputProduct && productionOutputQuantity && (
                      <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-800">
                          ✓ Output Produksi: {productionOutputQuantity} {productionOutputUnit} {products.find(p => p.id === productionOutputProduct)?.name}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Stok akan bertambah dari {products.find(p => p.id === productionOutputProduct)?.stock_quantity || 0} → {(parseFloat(products.find(p => p.id === productionOutputProduct)?.stock_quantity?.toString() || '0') + parseFloat(productionOutputQuantity || '0')).toFixed(2)} {productionOutputUnit}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* MULTI-ITEMS TABLE SECTION - Hidden until category selected */}
            {(category && category.trim() !== '') && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Daftar Item Pembelian ({lineItems.length})
              </h2>
              
              {/* Add Item Form */}
              <div className="bg-red-50 border-2 border-red-100 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {/* Item/Deskripsi Input */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {(category === 'Pembelian Produk Jadi' || category === 'Pembelian Bahan Baku') ? 'Produk' : 'Item / Deskripsi'}
                    </label>
                    
                    {/* Show dropdown only for product purchase categories */}
                    {(category === 'Pembelian Produk Jadi' || category === 'Pembelian Bahan Baku') && (
                      <select
                        value={currentItem.product_id}
                        onChange={(e) => {
                          if (e.target.value === '__quick_add__') {
                            setShowQuickAddProduct(true)
                          } else {
                            handleProductSelect(e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm mb-2"
                      >
                        <option value="">Pilih dari inventory...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stok: {p.stock_quantity || 0})
                          </option>
                        ))}
                        <option disabled>──────────</option>
                        <option value="__quick_add__" className="font-bold text-green-600">+ Tambah Produk Baru</option>
                      </select>
                    )}
                    
                    {/* Manual input always available */}
                    <input
                      type="text"
                      placeholder={(category === 'Pembelian Produk Jadi' || category === 'Pembelian Bahan Baku') ? "Atau ketik manual..." : "Contoh: Gaji Karyawan, Biaya Iklan, dll"}
                      value={currentItem.product_name}
                      onChange={(e) => setCurrentItem({...currentItem, product_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Satuan</label>
                    <input
                      type="text"
                      value={currentItem.unit}
                      onChange={(e) => setCurrentItem({...currentItem, unit: e.target.value})}
                      placeholder="pcs, kg, liter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Harga/Unit</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={currentItem.price_per_unit}
                      onChange={(e) => setCurrentItem({...currentItem, price_per_unit: e.target.value})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Subtotal Preview */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subtotal</label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-bold text-red-600">
                      Rp {formatCurrency(parseFloat(currentItem.quantity || '0') * parseFloat(currentItem.price_per_unit || '0'))}
                    </div>
                  </div>
                </div>
                
                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-3 w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Tambah Item
                </button>
              </div>
              
              {/* Items List - Desktop Table */}
              {lineItems.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-bold text-gray-700">Produk</th>
                        <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Qty</th>
                        <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Satuan</th>
                        <th className="text-right py-3 px-2 text-sm font-bold text-gray-700">Harga</th>
                        <th className="text-right py-3 px-2 text-sm font-bold text-gray-700">Subtotal</th>
                        <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-sm">{idx + 1}.</span>
                              <span className="font-medium text-gray-800">{item.product_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-gray-700">{item.quantity}</td>
                          <td className="py-3 px-2 text-center text-gray-600 text-sm">{item.unit}</td>
                          <td className="py-3 px-2 text-right text-gray-700">
                            Rp {formatCurrency(item.price_per_unit)}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-red-600">
                            Rp {formatCurrency(item.subtotal)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Items List - Mobile Cards */}
              {lineItems.length > 0 && (
                <div className="md:hidden space-y-3">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-400 text-sm">{idx + 1}.</span>
                            <span className="font-bold text-gray-800">{item.product_name}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} {item.unit} × Rp {formatCurrency(item.price_per_unit)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                          <span className="text-lg font-bold text-red-600">
                            Rp {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Empty State */}
              {lineItems.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-6xl mb-3">📦</div>
                  <p className="font-medium">Belum ada item</p>
                  <p className="text-sm">Tambahkan item pembelian di form atas</p>
                </div>
              )}
            </div>
            )}
            
            {/* PAYMENT METHOD SECTION - Hidden until category selected */}
            {(category && category.trim() !== '') && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                Status Pembayaran
              </h2>
              
              {/* Visual Payment Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Lunas')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentStatus === 'Lunas'
                      ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="font-bold text-lg">LUNAS</div>
                  <div className="text-sm opacity-80">Dibayar Penuh</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Tempo')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paymentStatus === 'Tempo'
                      ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="font-bold text-lg">TEMPO</div>
                  <div className="text-sm opacity-80">Bayar Nanti (Hutang)</div>
                </button>
              </div>
              
              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="E-Wallet">E-Wallet (GoPay, OVO, Dana)</option>
                  <option value="Kartu Kredit">Kartu Kredit</option>
                  <option value="Kartu Debit">Kartu Debit</option>
                </select>
              </div>
              
              {/* Tempo Details (Expand when selected) */}
              {paymentStatus === 'Tempo' && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-bold text-orange-800 flex items-center gap-2">
                    Detail Pembayaran Tempo
                  </h3>
                  
                  {/* Tempo Preset Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jatuh Tempo</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setTempoDays(7)
                          const date = new Date()
                          date.setDate(date.getDate() + 7)
                          setDueDate(date.toISOString().split('T')[0])
                        }}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                          tempoDays === 7
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white border-2 border-orange-200 text-gray-700 hover:border-orange-400'
                        }`}
                      >
                        7 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempoDays(15)
                          const date = new Date()
                          date.setDate(date.getDate() + 15)
                          setDueDate(date.toISOString().split('T')[0])
                        }}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                          tempoDays === 15
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white border-2 border-orange-200 text-gray-700 hover:border-orange-400'
                        }`}
                      >
                        15 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempoDays(30)
                          const date = new Date()
                          date.setDate(date.getDate() + 30)
                          setDueDate(date.toISOString().split('T')[0])
                        }}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                          tempoDays === 30
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white border-2 border-orange-200 text-gray-700 hover:border-orange-400'
                        }`}
                      >
                        30 Hari
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Down Payment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Uang Muka (DP)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        step="1000"
                        value={downPayment}
                        onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    
                    {/* Remaining */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sisa Pembayaran</label>
                      <div className="px-4 py-2.5 bg-orange-100 border-2 border-orange-300 rounded-lg font-bold text-orange-700">
                        Rp {remainingPayment.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Jatuh Tempo</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  
                  {downPayment > grandTotal && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700">
                      ⚠️ Uang muka tidak boleh melebihi total pembayaran!
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
            
            {/* RINGKASAN PEMBAYARAN - Enhanced Design */}
            {(category && category.trim() !== '') && (
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-indigo-200">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Ringkasan Pembayaran
              </h2>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 space-y-3 shadow-inner">
                {/* Subtotal */}
                <div className="flex justify-between items-center pb-3">
                  <span className="text-gray-700 font-semibold">Subtotal</span>
                  <span className="text-xl font-bold text-gray-900">
                    Rp {formatCurrency(subtotal)}
                  </span>
                </div>
                
                <div className="border-t-2 border-gray-200 pt-3 space-y-3">
                  {/* Discount with Mode Toggle */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold text-sm">💸 Diskon</span>
                      {/* Toggle % or Rp */}
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountMode('percent')
                            setDiscountAmount(0)
                            setDiscountPercent(0)
                          }}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            discountMode === 'percent' 
                              ? 'bg-orange-500 text-white shadow' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountMode('nominal')
                            setDiscountPercent(0)
                            setDiscountAmount(0)
                          }}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            discountMode === 'nominal' 
                              ? 'bg-orange-500 text-white shadow' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          Rp
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {discountMode === 'percent' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            max="100"
                            value={discountPercent || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setDiscountPercent(Math.min(val, 100))
                            }}
                            placeholder="0"
                            className="w-20 px-3 py-2 border-2 border-orange-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                          <span className="text-gray-700 font-semibold">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-sm">Rp</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            step="1000"
                            max={subtotal}
                            value={discountAmount || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setDiscountAmount(Math.min(val, subtotal))
                            }}
                            placeholder="0"
                            className="w-32 px-3 py-2 border-2 border-orange-300 rounded-lg text-sm text-right font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      )}
                      
                      {discountAmount > 0 && (
                        <span className="text-red-600 font-bold text-sm">
                          - Rp {formatCurrency(discountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* PPN Checkbox */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={taxAmount > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const ppn11 = Math.round((subtotal - discountAmount) * 0.11)
                              setTaxAmount(ppn11)
                            } else {
                              setTaxAmount(0)
                            }
                          }}
                          className="w-5 h-5 rounded border-2 border-green-400 text-green-600 focus:ring-green-500 focus:ring-offset-0"
                        />
                        <div>
                          <span className="text-gray-700 font-semibold text-sm group-hover:text-green-700 transition-colors">✅ PPN 11%</span>
                          <p className="text-xs text-gray-500">Pajak Pertambahan Nilai</p>
                        </div>
                      </div>
                      {taxAmount > 0 && (
                        <span className="text-green-700 font-bold text-sm">
                          + Rp {formatCurrency(taxAmount)}
                        </span>
                      )}
                    </label>
                  </div>
                  
                  {/* PPh with Preset */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-semibold text-sm">📊 PPh</span>
                      <div className="flex items-center gap-1">
                        {(['0', '1', '2', '3', 'custom'] as const).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setPphPreset(preset)
                              if (preset !== 'custom') {
                                setPphPercent(parseInt(preset))
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                              pphPreset === preset
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                          >
                            {preset === 'custom' ? 'Custom' : `${preset}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {pphPreset === 'custom' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            max="100"
                            value={pphPercent || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setPphPercent(Math.min(val, 100))
                            }}
                            placeholder="0"
                            className="w-20 px-3 py-2 border-2 border-blue-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-700 font-semibold">%</span>
                        </div>
                        {pphAmount > 0 && (
                          <span className="text-blue-700 font-bold text-sm">
                            Rp {formatCurrency(pphAmount)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {pphPreset !== 'custom' && pphAmount > 0 && (
                      <div className="text-right text-blue-700 font-bold text-sm mt-1">
                        Rp {formatCurrency(pphAmount)}
                      </div>
                    )}
                  </div>
                  
                  {/* Other Fees - Collapsible with Multiple Items */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                    {!showOtherFees ? (
                      <button
                        type="button"
                        onClick={() => setShowOtherFees(true)}
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <span className="text-gray-700 font-semibold text-sm group-hover:text-purple-700 transition-colors">💼 Biaya Lain</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Ongkir, Packing, dll</span>
                          <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 font-semibold text-sm">💼 Biaya Lain</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOtherFees(false)
                              setOtherFeesItems([])
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Hapus Semua
                          </button>
                        </div>
                        
                        {otherFeesItems.map((fee) => (
                          <div key={fee.id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-purple-200">
                            <input
                              type="text"
                              value={fee.label}
                              onChange={(e) => {
                                setOtherFeesItems(prev => prev.map(f => 
                                  f.id === fee.id ? {...f, label: e.target.value} : f
                                ))
                              }}
                              placeholder="Nama biaya"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              step="1000"
                              value={fee.amount || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setOtherFeesItems(prev => prev.map(f => 
                                  f.id === fee.id ? {...f, amount: val} : f
                                ))
                              }}
                              placeholder="0"
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right font-semibold focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setOtherFeesItems(prev => prev.filter(f => f.id !== fee.id))
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setOtherFeesItems(prev => [...prev, {
                              id: Date.now().toString(),
                              label: '',
                              amount: 0
                            }])
                          }}
                          className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Tambah Biaya
                        </button>
                        
                        {otherFeesItems.length > 0 && (
                          <div className="text-right text-purple-700 font-bold text-sm pt-1 border-t border-purple-200">
                            Total: Rp {formatCurrency(otherFeesItems.reduce((sum, f) => sum + f.amount, 0))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Grand Total - Prominent Display */}
              <div className="mt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-wider block mb-1">Grand Total</span>
                    <span className="text-2xl font-bold text-white">
                      Rp {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Payment Status Info */}
              {paymentStatus === 'Tempo' && remainingPayment > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Dibayar (DP):</span>
                    <span className="font-medium">Rp {formatCurrency(downPayment)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-orange-700">
                    <span>Sisa Hutang:</span>
                    <span>Rp {formatCurrency(remainingPayment)}</span>
                  </div>
                </div>
              )}
              
              {/* Action Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                {lineItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>Auto-update inventory ({lineItems.filter(i => i.product_id).length} produk)</span>
                  </div>
                )}
                {selectedSupplier && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>Update hutang supplier</span>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* SUBMIT BUTTON - Hidden until category selected */}
            {(category && category.trim() !== '') && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || lineItems.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan Pengeluaran
                </>
              )}
            </button>
            )}
        </div>
        
        {/* ============================================ */}
        {/* 📜 TRANSACTIONS LIST */}
        {/* ============================================ */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Riwayat Pengeluaran</h2>
            <div className="flex gap-2">
              {selectedExpenses.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Aksi ({selectedExpenses.length})
                </button>
              )}
              <button
                onClick={loadExpenses}
                className="text-red-600 hover:text-red-700 font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 pb-4 border-b">
            <select
              value={filterExpenseType}
              onChange={(e) => {
                setFilterExpenseType(e.target.value)
                setFilterCategory('') // Reset category saat ganti jenis
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">Semua Jenis</option>
              <option value="operating">Operating</option>
              <option value="investing">Investing</option>
              <option value="financing">Financing</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              disabled={!filterExpenseType}
            >
              <option value="">
                {filterExpenseType ? 'Semua Kategori' : 'Pilih Jenis Dulu'}
              </option>
              {filterExpenseType === 'operating' && (
                <>
                  <option value="Pembelian Produk Jadi">Pembelian Produk Jadi</option>
                  <option value="Pembelian Bahan Baku">Pembelian Bahan Baku</option>
                  <option value="Gaji & Upah">Gaji & Upah</option>
                  <option value="Marketing & Iklan">Marketing & Iklan</option>
                  <option value="Operasional Toko">Operasional Toko</option>
                  <option value="Transportasi & Logistik">Transportasi & Logistik</option>
                  <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                  <option value="Utilitas">Utilitas (Listrik, Air, Internet)</option>
                  <option value="Pemeliharaan & Perbaikan">Pemeliharaan & Perbaikan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </>
              )}
              {filterExpenseType === 'investing' && (
                <>
                  <option value="Pembelian Peralatan">Pembelian Peralatan</option>
                  <option value="Pembelian Kendaraan">Pembelian Kendaraan</option>
                  <option value="Renovasi Toko">Renovasi Toko</option>
                  <option value="Pembelian Properti">Pembelian Properti</option>
                  <option value="Software & Teknologi">Software & Teknologi</option>
                </>
              )}
              {filterExpenseType === 'financing' && (
                <>
                  <option value="Bayar Utang Bank">Bayar Utang Bank</option>
                  <option value="Bayar Utang Supplier">Bayar Utang Supplier</option>
                  <option value="Bayar Cicilan">Bayar Cicilan</option>
                  <option value="Bayar Bunga Pinjaman">Bayar Bunga Pinjaman</option>
                </>
              )}
            </select>
            
            <select
              value={filterPaymentStatus}
              onChange={(e) => {
                setFilterPaymentStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Tempo">Tempo</option>
            </select>
            
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => {
                  setFilterDateStart(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => {
                  setFilterDateEnd(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          {/* Bulk Actions Bar */}
          {showBulkActions && selectedExpenses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {selectedExpenses.length} transaksi dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Hapus ${selectedExpenses.length} transaksi?`)) {
                      // TODO: Implement bulk delete
                      console.log('Bulk delete:', selectedExpenses)
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setSelectedExpenses([])}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
          
          {loadingExpenses ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="animate-spin w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p>Memuat data...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">Belum ada transaksi</p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 md:gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 mb-3">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExpenses(expenses.map(exp => exp.id))
                      } else {
                        setSelectedExpenses([])
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </div>
                <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tanggal / Kategori
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jumlah
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Supplier
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                  Status
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                  Aksi
                </div>
              </div>

              <div className="space-y-3">
                {expenses.map((exp) => (
                <div key={exp.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  {/* MOBILE: Layout Vertikal (< 768px) */}
                  <div className="block md:hidden">
                    {/* Baris 1: Checkbox + Judul + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(exp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExpenses([...selectedExpenses, exp.id])
                            } else {
                              setSelectedExpenses(selectedExpenses.filter(id => id !== exp.id))
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base truncate">{exp.category}</h3>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                        exp.payment_status === 'Lunas'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {exp.payment_status || 'Lunas'}
                      </span>
                    </div>
                    
                    {/* Baris 2: Total */}
                    <div className="mb-3 ml-8">
                      <div className="text-sm text-gray-500 mb-1">Total</div>
                      <div className="text-2xl font-bold text-red-600">
                        Rp {formatCurrency(exp.grand_total || exp.amount || 0)}
                      </div>
                    </div>
                    
                    {/* Baris 3: Tanggal */}
                    <div className="text-sm text-gray-600 mb-3 ml-8">
                      {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    
                    {/* Due Date for Tempo */}
                    {exp.payment_status === 'Tempo' && exp.due_date && (
                      <div className="flex items-center gap-2 text-sm mb-3 ml-8">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-orange-700 font-medium">
                          Jatuh tempo: {new Date(exp.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    
                    {/* Baris 4: Action Buttons */}
                    <div className="flex items-center gap-2 ml-8">
                      <button
                        onClick={() => {
                          setPreviewExpense(exp)
                          setShowPOPreview(true)
                        }}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                        title="Preview PO & Tracking"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          showToast('warning', '⚠️ Fitur Edit akan segera hadir! Untuk sementara, silakan hapus dan buat transaksi baru jika ada kesalahan.')
                        }}
                        className="p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus transaksi ${exp.purchase_order_number || exp.category}?\n\nData tidak dapat dikembalikan!`)) {
                            try {
                              const res = await fetch(`/api/expenses/${exp.id}`, { method: 'DELETE' })
                              if (res.ok) {
                                showToast('success', 'Transaksi dihapus')
                                loadExpenses()
                              } else {
                                showToast('error', 'Gagal menghapus')
                              }
                            } catch (error) {
                              showToast('error', 'Error: ' + error)
                            }
                          }
                        }}
                        className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* DESKTOP: Layout Horizontal (>= 768px) */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(exp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenses([...selectedExpenses, exp.id])
                          } else {
                            setSelectedExpenses(selectedExpenses.filter(id => id !== exp.id))
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </div>
                    
                    {/* Tanggal / Kategori */}
                    <div className="col-span-3">
                      <p className="text-xs text-gray-500">
                        {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <h3 className="font-semibold text-gray-900 text-sm mt-0.5">{exp.category}</h3>
                      {exp.payment_status === 'Tempo' && exp.due_date && (
                        <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(exp.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    
                    {/* Jumlah */}
                    <div className="col-span-2">
                      <div className="text-base font-bold text-red-600">
                        Rp {formatCurrency(exp.grand_total || exp.amount || 0)}
                      </div>
                    </div>
                    
                    {/* Supplier */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-700">
                        {exp.supplier?.name || '-'}
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        exp.payment_status === 'Lunas'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {exp.payment_status || 'Lunas'}
                      </span>
                    </div>
                    
                    {/* Aksi */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setPreviewExpense(exp)
                          setShowPOPreview(true)
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Preview PO & Tracking"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          showToast('warning', '⚠️ Fitur Edit akan segera hadir! Untuk sementara, silakan hapus dan buat transaksi baru jika ada kesalahan.')
                        }}
                        className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus transaksi ${exp.purchase_order_number || exp.category}?\n\nData tidak dapat dikembalikan!`)) {
                            try {
                              const res = await fetch(`/api/expenses/${exp.id}`, { method: 'DELETE' })
                              if (res.ok) {
                                showToast('success', 'Transaksi dihapus')
                                loadExpenses()
                              } else {
                                showToast('error', 'Gagal menghapus')
                              }
                            } catch (error) {
                              showToast('error', 'Error: ' + error)
                            }
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Menampilkan {expenses.length} dari {totalItems} transaksi
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="10">10 / halaman</option>
                    <option value="25">25 / halaman</option>
                    <option value="50">50 / halaman</option>
                    <option value="100">100 / halaman</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    « First
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    ‹ Prev
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                    {currentPage} / {Math.ceil(totalItems / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
                    disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(totalItems / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Last »
                  </button>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
      
      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}
      
      {/* Supplier Modal */}
      <SupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSelect={(supplier) => setSelectedSupplier(supplier)}
        selectedSupplier={selectedSupplier}
      />
      
      {/* Quick Add Product Modal */}
      {showQuickAddProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4">
              <h2 className="text-xl font-bold">+ Tambah Produk Baru</h2>
              <p className="text-sm text-green-100 mt-1">Data otomatis sinkron dengan harga dan satuan</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  placeholder="Contoh: Kaos Polos Putih"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  autoFocus
                />
              </div>
              
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Beli/Unit <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={quickProductPrice}
                  onChange={(e) => setQuickProductPrice(e.target.value)}
                  placeholder="15000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Satuan</label>
                  <select
                    value={quickProductUnit}
                    onChange={(e) => setQuickProductUnit(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Ml</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="lusin">Lusin</option>
                  </select>
                </div>
                
                {/* Initial Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok Awal</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={quickProductStock}
                    onChange={(e) => setQuickProductStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-gray-700">
                <strong>Info:</strong> Produk akan otomatis tersimpan di inventory dan langsung terisi di form pengeluaran ini.
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuickAddProduct(false)
                    setQuickProductName('')
                    setQuickProductPrice('')
                    setQuickProductUnit('pcs')
                    setQuickProductStock('0')
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleQuickAddProduct}
                  disabled={savingQuickProduct || !quickProductName.trim() || !quickProductPrice}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingQuickProduct ? (
                    <>
                      <svg className="animate-spin w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan & Gunakan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Educational Modal */}
      {showEducationalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
              <h2 className="text-2xl font-bold">Panduan Input Pengeluaran</h2>
              <p className="text-red-100 text-sm mt-1">Pahami kategori dan fitur untuk pencatatan belanja bisnis yang akurat</p>
            </div>
            <div className="p-6 space-y-4">
              
              {/* FITUR YANG TERSEDIA */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-red-900 mb-3">Fitur yang Tersedia:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Beli banyak barang sekaligus (1 nota)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Stok barang otomatis bertambah</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Catat hutang ke supplier</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Bayar tempo dengan DP (cicilan)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Hitung diskon & pajak otomatis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Reminder WhatsApp jatuh tempo</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Riwayat belanja lengkap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>Filter & cari transaksi mudah</span>
                  </div>
                </div>
              </div>

              {/* KATEGORI PENGELUARAN */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Kategori Pengeluaran:</h3>
                
                {/* PEMBELIAN BARANG JADI */}
                <div className="border-l-4 border-blue-500 pl-4 py-2 mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">1. PEMBELIAN BARANG JADI (Reseller)</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Beli barang yang langsung bisa dijual kembali.
                  </p>
                  <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                    <strong>Contoh:</strong> Beli ke supplier → 10 baju + 5 celana → Total Rp 500rb → Stok otomatis +10 baju & +5 celana → Siap dijual ke customer.
                  </p>
                </div>

                {/* PEMBELIAN BAHAN BAKU */}
                <div className="border-l-4 border-green-500 pl-4 py-2 mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">2. PEMBELIAN BAHAN BAKU (Produksi)</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Beli bahan mentah untuk diolah jadi produk.
                  </p>
                  <p className="text-xs text-gray-600 bg-green-50 p-2 rounded">
                    <strong>Contoh:</strong> Beli 5kg tepung + 2kg gula + 1kg telur → Diolah jadi kue → Stok bahan baku terupdate → Hitung biaya produksi per kue.
                  </p>
                </div>

                {/* OPERASIONAL BISNIS */}
                <div className="border-l-4 border-orange-500 pl-4 py-2 mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">3. OPERASIONAL BISNIS</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Biaya rutin menjalankan bisnis sehari-hari.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-2">
                    <li>• <strong>Listrik & Air:</strong> Bayar tagihan bulanan toko/pabrik</li>
                    <li>• <strong>Sewa Tempat:</strong> Sewa toko, kios, atau gudang</li>
                    <li>• <strong>Gaji Karyawan:</strong> Bayar upah pegawai</li>
                    <li>• <strong>Transport:</strong> Ongkos kirim, bensin, parkir</li>
                  </ul>
                </div>

                {/* INVESTASI ASET */}
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">4. INVESTASI ASET</h4>
                  <p className="text-sm text-gray-700 mb-2">
                    Beli barang untuk keperluan jangka panjang.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-2">
                    <li>• <strong>Mesin Produksi:</strong> Mesin jahit, oven, mixer</li>
                    <li>• <strong>Kendaraan:</strong> Motor, mobil untuk operasional</li>
                    <li>• <strong>Peralatan:</strong> Etalase, rak, meja kasir</li>
                  </ul>
                </div>
              </div>

              {/* CARA PAKAI PEMBAYARAN TEMPO */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <h3 className="font-bold text-amber-900 mb-2">Cara Pakai Pembayaran Tempo:</h3>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>Skenario:</strong> Belanja ke supplier total Rp 2 juta, tapi uang Anda hanya Rp 500 ribu.
                </p>
                <p className="text-xs text-gray-700 bg-white rounded p-2">
                  <strong>Solusi:</strong> Bayar DP Rp 500rb dulu → Sisanya Rp 1,5jt jadi hutang → Pilih tempo 30 hari → Sistem catat hutang otomatis → Dapat reminder WhatsApp sebelum jatuh tempo → Bayar lunas nanti saat ada uang.
                </p>
              </div>

              {/* TIPS PENTING */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Tips Penting:</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ <strong>Simpan nota belanja</strong> untuk bukti transaksi</li>
                  <li>✓ <strong>Input setiap hari</strong> agar tidak lupa detail belanjaan</li>
                  <li>✓ <strong>Cek hutang supplier</strong> sebelum belanja lagi</li>
                  <li>✓ <strong>Manfaatkan diskon</strong> dari supplier untuk hemat biaya</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem('katalara_expenses_education_seen_v3', 'true')
                    } else {
                      localStorage.removeItem('katalara_expenses_education_seen_v3')
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="dontShowAgain" className="text-sm text-gray-600 cursor-pointer">
                  Jangan tampilkan panduan ini lagi
                </label>
              </div>
              <button
                onClick={() => setShowEducationalModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Mengerti, Mulai Input!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {showPreviewModal && previewExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Detail Pengeluaran</h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewExpense(null)
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">PO Number</div>
                  <div className="font-mono font-medium">{previewExpense.purchase_order_number || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tanggal</div>
                  <div className="font-medium">{new Date(previewExpense.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Supplier</div>
                  <div className="font-medium">{previewExpense.supplier?.name || 'Tanpa Supplier'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Kategori</div>
                  <div className="font-medium">{previewExpense.category}</div>
                </div>
              </div>
              
              {/* Items List */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">Daftar Item</h3>
                <div className="space-y-2">
                  {previewExpense.items && previewExpense.items.length > 0 ? (
                    previewExpense.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.product_name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} {item.unit} × Rp {formatCurrency(item.price_per_unit)}
                          </div>
                        </div>
                        <div className="font-bold text-red-600">
                          Rp {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">Tidak ada item</div>
                  )}
                </div>
              </div>
              
              {/* Financial Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp {formatCurrency(previewExpense.subtotal || 0)}</span>
                </div>
                {previewExpense.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon</span>
                    <span className="font-medium text-red-600">- Rp {formatCurrency(previewExpense.discount_amount)}</span>
                  </div>
                )}
                {previewExpense.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-medium">Rp {formatCurrency(previewExpense.tax_amount)}</span>
                  </div>
                )}
                {previewExpense.other_fees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Lain</span>
                    <span className="font-medium">Rp {formatCurrency(previewExpense.other_fees)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">TOTAL</span>
                  <span className="font-bold text-red-600 text-xl">Rp {formatCurrency(previewExpense.grand_total || previewExpense.amount || 0)}</span>
                </div>
              </div>
              
              {/* Payment Status */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Status Pembayaran</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    previewExpense.payment_status === 'Lunas'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {previewExpense.payment_status || 'Lunas'}
                  </span>
                  {previewExpense.payment_status === 'Tempo' && previewExpense.due_date && (
                    <span className="text-sm text-gray-600">
                      Jatuh Tempo: {new Date(previewExpense.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {previewExpense.payment_status === 'Tempo' && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Dibayar (DP):</span>
                      <span className="font-medium">Rp {formatCurrency(previewExpense.down_payment || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-orange-700">
                      <span>Sisa Hutang:</span>
                      <span>Rp {formatCurrency(previewExpense.remaining_payment || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    showToast('warning', 'Fitur cetak PDF segera hadir')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Cetak / Download PDF
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewExpense(null)
                  }}
                  className="px-8 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PO Preview Modal (New Professional Version) */}
      <POPreviewModal
        isOpen={showPOPreview}
        onClose={() => {
          setShowPOPreview(false)
          setPreviewExpense(null)
        }}
        expenseData={previewExpense}
        businessName={businessName}
      />
      
      {/* Toast Notification - Matching Income Style */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in-down">
          <div className={`
            flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border-2
            ${toast.type === 'success' ? 'bg-green-500/95 border-green-400 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-500/95 border-red-400 text-white' : ''}
            ${toast.type === 'warning' ? 'bg-orange-500/95 border-orange-400 text-white' : ''}
          `}>
            <div className="text-2xl">
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'warning' && '⚠️'}
            </div>
            <div className="font-semibold text-base">{toast.message}</div>
            <button 
              onClick={() => setToast({ ...toast, show: false })}
              className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
