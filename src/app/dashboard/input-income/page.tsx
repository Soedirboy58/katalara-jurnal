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
  // 🟢 NEW: Quick Add Product Modal (FIXED: Full Fields)
  // ============================================
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'physical' | 'service'>('physical')
  const [quickProductName, setQuickProductName] = useState('')
  const [quickProductBuyPrice, setQuickProductBuyPrice] = useState('')
  const [quickProductPrice, setQuickProductPrice] = useState('')
  const [quickProductUnit, setQuickProductUnit] = useState('')
  const [quickProductDuration, setQuickProductDuration] = useState('')
  const [savingQuickProduct, setSavingQuickProduct] = useState(false)
  
  // ============================================
  // 🆕 Customer Management
  // ============================================
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  // Quick add customer
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false)
  const [quickCustomerName, setQuickCustomerName] = useState('')
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('')
  const [quickCustomerAddress, setQuickCustomerAddress] = useState('')
  const [quickCustomerEmail, setQuickCustomerEmail] = useState('')
  const [savingCustomer, setSavingCustomer] = useState(false)
  
  // ============================================
  // 🆕 Custom Unit Input
  // ============================================
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false)
  const [customUnitValue, setCustomUnitValue] = useState('')
  
  // ============================================
  // 💰 NEW: Loan Information Fields
  // ============================================
  const [loanLenderName, setLoanLenderName] = useState('')
  const [loanInterestRate, setLoanInterestRate] = useState('')
  const [loanTermMonths, setLoanTermMonths] = useState('')
  const [loanFirstPaymentDate, setLoanFirstPaymentDate] = useState('')
  const [loanInstallmentPreview, setLoanInstallmentPreview] = useState<any[]>([])
  const [showLoanPreview, setShowLoanPreview] = useState(false)
  const [enableLoanReminder, setEnableLoanReminder] = useState(true)
  const [loanLenderContact, setLoanLenderContact] = useState('')
  
  // ============================================
  // 🤝 NEW: Investor Funding Fields
  // ============================================
  const [investorName, setInvestorName] = useState('')
  const [investorContact, setInvestorContact] = useState('')
  const [profitSharePercentage, setProfitSharePercentage] = useState('')
  const [profitShareFrequency, setProfitShareFrequency] = useState<'monthly' | 'quarterly' | 'annually'>('monthly')
  const [investmentStartDate, setInvestmentStartDate] = useState('')
  const [investmentEndDate, setInvestmentEndDate] = useState('')
  const [enableProfitShareReminder, setEnableProfitShareReminder] = useState(true)
  const [profitSharePreview, setProfitSharePreview] = useState<any>(null)
  
  // ============================================
  // 🎯 NEW: Multi-Items Professional State
  // ============================================
  interface LineItem {
    id: string
    product_id: string
    product_name: string
    quantity: number
    unit: string
    price: number
    subtotal: number
    service_duration?: number
  }
  
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [transactionNumber, setTransactionNumber] = useState(`TR/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`)
  
  // Summary & Tax
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxPPN, setTaxPPN] = useState(11) // PPN 11%
  const [taxPPh, setTaxPPh] = useState(0) // PPh custom
  const [otherFees, setOtherFees] = useState(0) // Biaya pengiriman, dll
  const [includeTax, setIncludeTax] = useState(false) // Toggle harga termasuk pajak
  const [downPayment, setDownPayment] = useState(0) // Uang muka
  
  // Collapsible
  const [showNotes, setShowNotes] = useState(false)
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
  // 🆕 Edit Transaction Mode
  // ============================================
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)

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

  // 🆕 Fetch Customers Function
  const fetchCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      showToast('error', '❌ Gagal memuat data pelanggan')
    } finally {
      setLoadingCustomers(false)
    }
  }

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
  // 🆕 FUNCTION: Edit Transaction
  // ============================================
  const handleEditTransaction = (transaction: any) => {
    // Parse line items if stored as JSON string
    let parsedLineItems = []
    try {
      parsedLineItems = typeof transaction.line_items === 'string' 
        ? JSON.parse(transaction.line_items) 
        : (transaction.line_items || [])
    } catch (e) {
      parsedLineItems = []
    }

    // Populate form with transaction data
    setIsEditMode(true)
    setEditingTransactionId(transaction.id)
    setTransactionDate(transaction.income_date.split('T')[0])
    setIncomeType(transaction.income_type)
    setCategory(transaction.category)
    setCustomerName(transaction.customer_name || '')
    setDescription(transaction.description || '')
    setNotes(transaction.notes || '')
    setPaymentMethod(transaction.payment_method)
    setPaymentType(transaction.payment_type || 'cash')
    setDueDate(transaction.due_date ? transaction.due_date.split('T')[0] : '')
    setSelectedCustomerId(transaction.customer_id || '')
    
    // Set line items if multi-item transaction
    if (parsedLineItems.length > 0) {
      setLineItems(parsedLineItems)
      setDiscountAmount(transaction.discount || 0)
      setTaxPPN(transaction.tax_ppn || 0)
      setTaxPPh(transaction.tax_pph || 0)
      setOtherFees(transaction.other_fees || 0)
      setDownPayment(transaction.down_payment || 0)
    } else {
      // Simple transaction
      setAmount(transaction.amount)
    }

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast('success', '✏️ Mode Edit - Ubah data dan klik Simpan')
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    setEditingTransactionId(null)
    // Reset to default state
    setTransactionDate(new Date().toISOString().split('T')[0])
    setLineItems([])
    setCustomerName('')
    setSelectedCustomerId('')
    setIsAnonymous(false)
    showToast('warning', '❌ Edit dibatalkan')
  }

  // ============================================
  // 🟢 NEW FUNCTION: Quick Add Product (FIXED: Conditional validation)
  // ============================================
  const handleQuickAddProduct = async () => {
    // Get final unit value
    const finalUnit = quickProductUnit === '__CUSTOM__' ? customUnitValue : quickProductUnit
    
    // Validation: nama, unit, harga jual always required
    if (!quickProductName.trim() || !finalUnit || !quickProductPrice) {
      showToast('warning', '⚠️ Mohon lengkapi nama, satuan, dan harga')
      return
    }
    
    // Validation: harga beli only for physical products
    if (quickAddType === 'physical' && !quickProductBuyPrice) {
      showToast('warning', '⚠️ Mohon lengkapi harga beli produk')
      return
    }

    setSavingQuickProduct(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const buyPrice = quickAddType === 'physical' ? parseFloat(quickProductBuyPrice.replace(/\./g, '')) : 0
      const sellPrice = parseFloat(quickProductPrice.replace(/\./g, ''))

      const productData = {
        owner_id: user.id,
        name: quickProductName.trim(),
        category: quickAddType === 'physical' ? 'product' : 'service',
        product_type: quickAddType,
        unit: finalUnit, // FIXED: Save unit to database
        price: buyPrice,
        sell_price: sellPrice,
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
      setQuickProductBuyPrice('')
      setQuickProductUnit('')
      setCustomUnitValue('')
      setQuickProductDuration('')
      setShowQuickAddModal(false)

      // Refresh product list
      await refreshProducts()

      // Auto-select & populate form with new product
      if (data) {
        setSelectedProductId(data.id)
        setPricePerUnit(data.sell_price.toString())
        setCustomUnit(finalUnit) // Use final unit (custom or dropdown)
        setQuantity('1') // Auto set qty to 1
      }
      
      showToast('success', `✅ ${quickAddType === 'physical' ? 'Produk' : 'Layanan'} berhasil ditambahkan! Atur qty lalu klik Tambah.`)

    } catch (error: any) {
      console.error('Error adding product:', error)
      showToast('error', `❌ Gagal menambahkan: ${error.message}`)
    } finally {
      setSavingQuickProduct(false)
    }
  }

  // ============================================
  // 🎯 NEW: Professional Calculations
  // ============================================
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  }
  
  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    return discountPercent > 0 ? (subtotal * discountPercent) / 100 : discountAmount
  }
  
  const calculatePPN = () => {
    // FIXED: Only calculate PPN if includeTax checkbox is checked
    if (!includeTax || !taxPPN) return 0
    const subtotal = calculateSubtotal()
    const afterDiscount = subtotal - calculateDiscount()
    return (afterDiscount * taxPPN) / 100
  }
  
  const calculatePPh = () => {
    if (!taxPPh) return 0
    const subtotal = calculateSubtotal()
    const afterDiscount = subtotal - calculateDiscount()
    return (afterDiscount * taxPPh) / 100
  }
  
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    const ppn = calculatePPN()
    const pph = calculatePPh()
    return subtotal - discount + ppn + pph + otherFees
  }
  
  const calculateRemaining = () => {
    return calculateGrandTotal() - downPayment
  }
  
  // Add item to list
  const handleAddItem = () => {
    if (!selectedProductId || !quantity || !pricePerUnit || !customUnit) {
      showToast('warning', '⚠️ Mohon lengkapi produk, jumlah, satuan, dan harga')
      return
    }
    
    const product = products.find((p: Product) => p.id === selectedProductId)
    if (!product) return
    
    const qty = parseInt(quantity.replace(/\./g, ''))
    const price = parseFloat(pricePerUnit.replace(/\./g, ''))
    const subtotal = qty * price
    
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      product_id: selectedProductId,
      product_name: product.name,
      quantity: qty,
      unit: customUnit,
      price: price,
      subtotal: subtotal,
      service_duration: (product as any).service_duration
    }
    
    setLineItems([...lineItems, newItem])
    
    // Reset selection
    setSelectedProductId('')
    setQuantity('')
    setPricePerUnit('')
    setCustomUnit(category === 'product_sales' ? 'pcs' : 'jam')
    
    showToast('success', '✅ Item ditambahkan')
  }
  
  // Remove item from list
  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
    showToast('success', '✅ Item dihapus')
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

  // ============================================
  // 💰 Calculate Loan Installment Preview
  // ============================================
  const calculateLoanPreview = () => {
    const principal = parseFloat(amount.replace(/\./g, ''))
    const rate = parseFloat(loanInterestRate)
    const months = parseInt(loanTermMonths)

    if (!principal || !rate || !months || !loanFirstPaymentDate) {
      showToast('warning', '⚠️ Mohon lengkapi semua field pinjaman')
      return
    }

    const monthlyRate = rate / 100 / 12
    let installmentAmount: number

    // Anuitas formula
    if (monthlyRate === 0) {
      installmentAmount = principal / months
    } else {
      installmentAmount = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                         (Math.pow(1 + monthlyRate, months) - 1)
    }

    // Generate installment schedule
    const schedule = []
    let remainingBalance = principal
    const firstDate = new Date(loanFirstPaymentDate)

    for (let i = 1; i <= months; i++) {
      const interestAmount = remainingBalance * monthlyRate
      let principalAmount = installmentAmount - interestAmount
      
      // Last installment adjustment
      if (i === months) {
        principalAmount = remainingBalance
        installmentAmount = principalAmount + interestAmount
      }

      const dueDate = new Date(firstDate)
      dueDate.setMonth(firstDate.getMonth() + (i - 1))

      schedule.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        principal_amount: Math.round(principalAmount),
        interest_amount: Math.round(interestAmount),
        installment_amount: Math.round(installmentAmount),
        remaining_balance: Math.round(remainingBalance - principalAmount)
      })

      remainingBalance -= principalAmount
    }

    setLoanInstallmentPreview(schedule)
    setShowLoanPreview(true)
    showToast('success', `✅ Preview ${months} cicilan berhasil dihitung`)
  }

  // ============================================
  // 🤝 Calculate Profit Share Preview
  // ============================================
  const calculateProfitSharePreview = () => {
    const investmentAmount = parseFloat(amount.replace(/\./g, ''))
    const sharePercent = parseFloat(profitSharePercentage)

    if (!investmentAmount || !sharePercent || !investorName || !investmentStartDate) {
      showToast('warning', '⚠️ Mohon lengkapi semua field investor')
      return
    }

    if (sharePercent < 1 || sharePercent > 100) {
      showToast('warning', '⚠️ Persentase profit sharing harus 1-100%')
      return
    }

    // Calculate expected frequency
    const frequencyMap = {
      monthly: 12,
      quarterly: 4,
      annually: 1
    }
    
    const periodsPerYear = frequencyMap[profitShareFrequency]
    const frequencyLabel = {
      monthly: 'per bulan',
      quarterly: 'per 3 bulan',
      annually: 'per tahun'
    }

    // Example calculation with assumed profit
    const exampleMonthlyRevenue = 10000000 // 10 juta contoh
    const exampleMonthlyExpense = 6000000 // 6 juta contoh
    const exampleNetProfit = exampleMonthlyRevenue - exampleMonthlyExpense

    let profitPerPeriod = exampleNetProfit
    if (profitShareFrequency === 'quarterly') {
      profitPerPeriod = exampleNetProfit * 3
    } else if (profitShareFrequency === 'annually') {
      profitPerPeriod = exampleNetProfit * 12
    }

    const investorShareAmount = profitPerPeriod * (sharePercent / 100)

    setProfitSharePreview({
      investmentAmount,
      sharePercent,
      frequency: profitShareFrequency,
      frequencyLabel: frequencyLabel[profitShareFrequency],
      periodsPerYear,
      exampleNetProfit: profitPerPeriod,
      investorShareAmount,
      businessShareAmount: profitPerPeriod - investorShareAmount
    })

    showToast('success', '✅ Preview profit sharing berhasil dihitung')
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
  // 🎯 PROFESSIONAL: handleSubmit with Multi-Items
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for multi-items (product_sales/service_income)
    if (['product_sales', 'service_income'].includes(category)) {
      if (lineItems.length === 0) {
        showToast('warning', '⚠️ Mohon tambahkan minimal 1 item')
        return
      }
      if (!isAnonymous && !customerName.trim()) {
        showToast('warning', '⚠️ Mohon masukkan nama pelanggan')
        return
      }
    } else {
      // Simple income validation
      if (!amount) {
        showToast('warning', '⚠️ Mohon masukkan jumlah pendapatan')
        return
      }
    }

    // Validate tempo payment
    if (paymentType === 'tempo') {
      if (!dueDate) {
        showToast('warning', '⚠️ Mohon pilih tanggal jatuh tempo')
        return
      }
      if (!customerPhone) {
        showToast('warning', '⚠️ Mohon masukkan nomor WhatsApp customer')
        return
      }
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // For multi-items transactions
      if (['product_sales', 'service_income'].includes(category) && lineItems.length > 0) {
        const grandTotal = calculateGrandTotal()
        const remaining = calculateRemaining()
        
        // Save main transaction
        const payload = {
          user_id: user.id,
          income_date: transactionDate,
          income_type: incomeType,
          category: category,
          amount: grandTotal,
          description: `${transactionNumber} - ${lineItems.map(i => i.product_name).join(', ')}`,
          notes: notes,
          payment_method: paymentMethod,
          payment_type: paymentType,
          payment_status: paymentType === 'cash' ? 'Lunas' : 'Pending',
          due_date: paymentType === 'tempo' ? dueDate : null,
          customer_id: isAnonymous ? null : (selectedCustomerId || null),
          // Store line items as JSON in notes for now (or create separate table)
          line_items: JSON.stringify(lineItems),
          subtotal: calculateSubtotal(),
          discount: calculateDiscount(),
          tax_ppn: calculatePPN(),
          tax_pph: calculatePPh(),
          other_fees: otherFees,
          down_payment: downPayment,
          remaining: remaining
        }
        
        const response = await fetch('/api/income', {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEditMode ? { id: editingTransactionId, ...payload } : payload)
        })
        
        const result = await response.json()
        
        if (!result.success) throw new Error(result.error)
        
        showToast('success', isEditMode ? '✅ Transaksi berhasil diupdate!' : '✅ Transaksi berhasil disimpan!')
        
        // Reset form and edit mode
        setIsEditMode(false)
        setEditingTransactionId(null)
        setLineItems([])
        setSelectedCustomerId('')
        setCustomerName('')
        setCustomerPhone('')
        setIsAnonymous(false)
        setDiscountPercent(0)
        setDiscountAmount(0)
        setOtherFees(0)
        setDownPayment(0)
        setNotes('')
        setTransactionNumber(`TR/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`)
        
        // Refresh transactions
        await fetchTransactions()
        await fetchKpiStats()
        
      } else {
        // Simple income (non-product/service)
        const finalAmount = parseFloat(amount.replace(/\./g, ''))
        
        const payload = {
          user_id: user.id,
          income_date: transactionDate,
          income_type: incomeType,
          category,
          amount: finalAmount,
          description: description || null,
          notes: notes || null,
          payment_method: paymentMethod,
          payment_type: 'cash',
          payment_status: 'Lunas'
        }

        const response = await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const result = await response.json()
        
        if (!result.success) throw new Error(result.error)
        
        showToast('success', '✅ Pendapatan berhasil disimpan!')
        
        // Reset simple form
        setAmount('')
        setDescription('')
        setNotes('')
        
        await fetchTransactions()
        await fetchKpiStats()
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
    // 💰 NEW: Reset loan fields
    setLoanLenderName('')
    setLoanInterestRate('')
    setLoanTermMonths('')
    setLoanFirstPaymentDate('')
    setLoanInstallmentPreview([])
    setShowLoanPreview(false)
    setEnableLoanReminder(true)
    setLoanLenderContact('')
    // 🤝 NEW: Reset investor fields
    setInvestorName('')
    setInvestorContact('')
    setProfitSharePercentage('')
    setProfitShareFrequency('monthly')
    setInvestmentStartDate('')
    setInvestmentEndDate('')
    setEnableProfitShareReminder(true)
    setProfitSharePreview(null)
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

      {/* KPI Stats - Professional Design */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {/* Today */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Hari Ini</p>
              {loadingKpi ? (
                <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  Rp {kpiStats.today.amount.toLocaleString('id-ID')}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{kpiStats.today.count} transaksi</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Week */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Minggu Ini</p>
              {loadingKpi ? (
                <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  Rp {kpiStats.week.amount.toLocaleString('id-ID')}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{kpiStats.week.count} transaksi</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Month */}
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Bulan Ini</p>
              {loadingKpi ? (
                <p className="text-2xl font-bold text-gray-400 mt-1 animate-pulse">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  Rp {kpiStats.month.amount.toLocaleString('id-ID')}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{kpiStats.month.count} transaksi</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* � EDIT MODE BANNER */}
      {isEditMode && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <p className="font-bold text-amber-900">🔧 Mode Edit Transaksi</p>
                <p className="text-sm text-amber-700">Anda sedang mengedit transaksi. Ubah data dan klik Simpan untuk update.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal Edit
            </button>
          </div>
        </div>
      )}

      {/* �🎯 PROFESSIONAL INPUT FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ============================================
            HEADER CARD - Blue Gradient (Like Reference)
            ============================================ */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Number */}
            <div>
              <label className="block text-xs text-blue-100 mb-1">📋 Nomor Transaksi</label>
              <input
                type="text"
                value={transactionNumber}
                readOnly
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 text-sm font-mono"
              />
            </div>

            {/* Customer Selection Button */}
            <div className="relative z-10">
              <label className="block text-xs text-blue-100 mb-1">👤 Pelanggan</label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Button clicked!')
                  console.log('showCustomerModal before:', showCustomerModal)
                  setShowCustomerModal(true)
                  console.log('setShowCustomerModal(true) called')
                  fetchCustomers()
                }}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 focus:outline-none text-left flex items-center justify-between cursor-pointer"
              >
                <span>{isAnonymous ? '🚶 Anonymous' : (customerName || 'Pilih Pelanggan')}</span>
                <span>▼</span>
              </button>
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block text-xs text-blue-100 mb-1">📅 Tanggal Transaksi</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:bg-white/30 focus:outline-none"
              />
            </div>

            {/* Notes/Description */}
            <div className="md:col-span-2">
              <label className="block text-xs text-blue-100 mb-1">📝 Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transaksi (opsional)"
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ============================================
            CATEGORY & TYPE SELECTION
            ============================================ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Kategori Pendapatan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Type */}
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
                {incomeType === 'investing' && 'Pendapatan dari investasi aset'}
                {incomeType === 'financing' && 'Pendapatan dari modal atau pinjaman'}
              </p>
            </div>

            {/* Category */}
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
          </div>
        </div>

        {/* ============================================
            PRODUCT/SERVICE SELECTION (MULTI-ITEMS)
            ============================================ */}
        {['product_sales', 'service_income'].includes(category) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {category === 'product_sales' ? 'Tambah Produk' : 'Tambah Layanan'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Product Selector */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {category === 'product_sales' ? 'Pilih Produk' : 'Pilih Layanan'}
                  <span className="text-red-500 ml-1">*</span>
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
                      // FIXED: Set unit from product database
                      setCustomUnit((product as any).unit || (category === 'product_sales' ? 'pcs' : 'jam'))
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
              </div>

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
                  disabled={!selectedProductId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-50"
                />
              </div>

              {/* Unit Selector - LOCKED after product selected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan {selectedProductId && <span className="text-xs text-gray-500">(dari database)</span>}
                </label>
                <input
                  type="text"
                  value={customUnit}
                  readOnly
                  disabled={!selectedProductId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed"
                  placeholder="Pilih produk dulu"
                />
                {selectedProductId && (
                  <p className="text-xs text-blue-600 mt-1">
                    🔒 Satuan otomatis dari data produk. Edit di menu Produk jika perlu ubah.
                  </p>
                )}
              </div>
            </div>

            {/* Price and Add Button Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga per {customUnit || 'unit'} <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                  <input
                    type="text"
                    value={formatNumber(pricePerUnit)}
                    onChange={(e) => handleNumberInput(e, setPricePerUnit)}
                    placeholder="0"
                    required
                    disabled={!selectedProductId}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Add Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId || !quantity || !pricePerUnit}
                  className="w-full h-[42px] bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Service Duration Info */}
            {category === 'service_income' && selectedProductId && (
              <>
                {(() => {
                  const product = products.find((p: Product) => p.id === selectedProductId) as any
                  const duration = product?.service_duration || 0
                  if (duration === 0) return null

                  const hours = Math.floor(duration / 60)
                  const minutes = duration % 60
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">⏱️</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            Durasi: {hours > 0 && `${hours} jam `}{minutes > 0 && `${minutes} menit`} per sesi
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        )}

        {/* ============================================
            MULTI-ITEMS TABLE
            ============================================ */}
        {['product_sales', 'service_income'].includes(category) && lineItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Daftar Item</h3>
            
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-600 py-2 px-2">Produk/Layanan</th>
                    <th className="text-right text-xs font-semibold text-gray-600 py-2 px-2">Qty</th>
                    <th className="text-center text-xs font-semibold text-gray-600 py-2 px-2">Satuan</th>
                    <th className="text-right text-xs font-semibold text-gray-600 py-2 px-2">Harga</th>
                    <th className="text-right text-xs font-semibold text-gray-600 py-2 px-2">Subtotal</th>
                    <th className="text-center text-xs font-semibold text-gray-600 py-2 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="text-sm text-gray-900 py-3 px-2">{item.product_name}</td>
                      <td className="text-sm text-gray-900 py-3 px-2 text-right">{item.quantity.toLocaleString('id-ID')}</td>
                      <td className="text-sm text-gray-600 py-3 px-2 text-center">{item.unit}</td>
                      <td className="text-sm text-gray-900 py-3 px-2 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="text-sm font-semibold text-gray-900 py-3 px-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      <td className="text-center py-3 px-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card-based */}
            <div className="md:hidden space-y-3">
              {lineItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.product_name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.quantity.toLocaleString('id-ID')} {item.unit} × Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600">Subtotal:</span>
                    <span className="text-sm font-bold text-blue-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          {/* END PART 3 */}

        {/* ============================================
            💰 LOAN INPUT (SPECIAL FOR LOAN_RECEIVED)
            ============================================ */}
        {category === 'loan_received' && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md border-2 border-blue-300 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🏦</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Informasi Pinjaman & Cicilan</h3>
            </div>
            
            <div className="space-y-4">
              {/* Jumlah Pinjaman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pinjaman yang Diterima <span className="text-red-500">*</span>
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
                    className="w-full pl-12 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Pemberi Pinjaman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pemberi Pinjaman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={loanLenderName}
                  onChange={(e) => setLoanLenderName(e.target.value)}
                  placeholder="Contoh: Bank BCA / PT. ABC / Bpk. John"
                  required
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Row: Bunga & Jangka Waktu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bunga (% per tahun) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loanInterestRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        setLoanInterestRate(val)
                      }}
                      placeholder="12"
                      required
                      className="w-full px-4 pr-10 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Contoh: 12 (untuk 12% per tahun)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jangka Waktu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loanTermMonths}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setLoanTermMonths(val)
                      }}
                      placeholder="12"
                      required
                      className="w-full px-4 pr-20 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">bulan</span>
                  </div>
                </div>
              </div>

              {/* Tanggal Bayar Pertama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Bayar Cicilan Pertama <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={loanFirstPaymentDate}
                  onChange={(e) => setLoanFirstPaymentDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Kontak Pemberi Pinjaman (untuk reminder) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontak Pemberi Pinjaman (Opsional)
                </label>
                <input
                  type="text"
                  value={loanLenderContact}
                  onChange={(e) => setLoanLenderContact(e.target.value)}
                  placeholder="WhatsApp / Email (untuk reminder)"
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              {/* Reminder Toggle */}
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLoanReminder}
                    onChange={(e) => setEnableLoanReminder(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">🔔 Aktifkan Pengingat Pembayaran Cicilan</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Sistem akan mengirim notifikasi setiap bulan untuk mengingatkan pembayaran cicilan.
                      Anda akan diingatkan 3 hari sebelum tanggal jatuh tempo.
                    </p>
                  </div>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={calculateLoanPreview}
                disabled={!amount || !loanInterestRate || !loanTermMonths || !loanFirstPaymentDate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🧮</span>
                <span>Hitung Preview Cicilan</span>
              </button>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan / Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pinjaman modal usaha untuk beli mesin"
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            💰 LOAN PREVIEW TABLE
            ============================================ */}
        {category === 'loan_received' && showLoanPreview && loanInstallmentPreview.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border-2 border-green-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-lg font-bold text-gray-800">Preview Jadwal Cicilan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoanPreview(false)}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Summary Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Total Pinjaman</p>
                <p className="text-sm font-bold text-blue-700">
                  Rp {parseInt(amount.replace(/\./g, '')).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Cicilan/Bulan</p>
                <p className="text-sm font-bold text-green-700">
                  Rp {loanInstallmentPreview[0]?.installment_amount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">Total Bayar</p>
                <p className="text-sm font-bold text-orange-700">
                  Rp {loanInstallmentPreview.reduce((sum, inst) => sum + inst.installment_amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Total Bunga</p>
                <p className="text-sm font-bold text-purple-700">
                  Rp {loanInstallmentPreview.reduce((sum, inst) => sum + inst.interest_amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Installment Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Tgl Jatuh Tempo</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 border-b">Pokok</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 border-b">Bunga</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 border-b">Total Cicilan</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 border-b">Sisa Hutang</th>
                  </tr>
                </thead>
                <tbody>
                  {loanInstallmentPreview.map((inst, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-900">{inst.installment_number}</td>
                      <td className="px-3 py-2 text-gray-900">{new Date(inst.due_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-2 text-right text-gray-900">Rp {inst.principal_amount.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2 text-right text-orange-600">Rp {inst.interest_amount.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700">Rp {inst.installment_amount.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2 text-right text-gray-600">Rp {inst.remaining_balance.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold sticky bottom-0">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-gray-900">TOTAL</td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      Rp {loanInstallmentPreview.reduce((sum, inst) => sum + inst.principal_amount, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      Rp {loanInstallmentPreview.reduce((sum, inst) => sum + inst.interest_amount, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-right text-blue-700">
                      Rp {loanInstallmentPreview.reduce((sum, inst) => sum + inst.installment_amount, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <span>💡</span>
                <span>
                  <strong>Catatan:</strong> Preview ini menggunakan metode Anuitas (cicilan tetap setiap bulan). 
                  Data cicilan ini TIDAK otomatis tersimpan, hanya sebagai referensi untuk Anda. 
                  {enableLoanReminder && (
                    <span className="block mt-2">
                      <strong>✅ Reminder Aktif:</strong> Sistem akan mengirim notifikasi setiap bulan 
                      (3 hari sebelum jatuh tempo) untuk mengingatkan Anda bayar cicilan.
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ============================================
            🤝 INVESTOR FUNDING INPUT
            ============================================ */}
        {category === 'investor_funding' && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md border-2 border-purple-300 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🤝</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Informasi Investor & Profit Sharing</h3>
            </div>
            
            <div className="space-y-4">
              {/* Jumlah Investasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Dana Investasi <span className="text-red-500">*</span>
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
                    className="w-full pl-12 pr-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Row: Investor Name & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Investor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    placeholder="Contoh: PT. Venture Capital / Bpk. Andi"
                    required
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontak (WhatsApp/Email) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={investorContact}
                    onChange={(e) => setInvestorContact(e.target.value)}
                    placeholder="0812xxx / email@domain.com"
                    required
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Row: Profit Share % & Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persentase Profit Sharing <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profitSharePercentage}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        setProfitSharePercentage(val)
                      }}
                      placeholder="20"
                      required
                      className="w-full px-4 pr-10 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Contoh: 20 (investor dapat 20% dari profit)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frekuensi Pembagian <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profitShareFrequency}
                    onChange={(e) => setProfitShareFrequency(e.target.value as 'monthly' | 'quarterly' | 'annually')}
                    required
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  >
                    <option value="monthly">📅 Bulanan</option>
                    <option value="quarterly">📅 Per 3 Bulan (Quarterly)</option>
                    <option value="annually">📅 Tahunan</option>
                  </select>
                </div>
              </div>

              {/* Row: Start & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai Investasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={investmentStartDate}
                    onChange={(e) => setInvestmentStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="date"
                    value={investmentEndDate}
                    onChange={(e) => setInvestmentEndDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-600 mt-1">Kosongkan jika tanpa batas waktu</p>
                </div>
              </div>

              {/* Reminder Toggle */}
              <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableProfitShareReminder}
                    onChange={(e) => setEnableProfitShareReminder(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-purple-400 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">🔔 Aktifkan Pengingat Profit Sharing</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Sistem akan mengirim notifikasi sesuai jadwal pembagian profit (bulanan/quarterly/tahunan).
                      Anda akan diingatkan untuk menghitung dan membayarkan profit share ke investor.
                    </p>
                  </div>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={calculateProfitSharePreview}
                disabled={!amount || !profitSharePercentage || !investorName || !investmentStartDate}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🧮</span>
                <span>Hitung Preview Profit Sharing</span>
              </button>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan / Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Investasi untuk ekspansi cabang baru"
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            🤝 PROFIT SHARE PREVIEW
            ============================================ */}
        {category === 'investor_funding' && profitSharePreview && (
          <div className="bg-white rounded-lg shadow-md border-2 border-green-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-lg font-bold text-gray-800">Preview Profit Sharing</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfitSharePreview(null)}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Investasi</p>
                <p className="text-xl font-bold text-purple-700">
                  Rp {profitSharePreview.investmentAmount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Persentase Investor</p>
                <p className="text-xl font-bold text-blue-700">
                  {profitSharePreview.sharePercent}%
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Frekuensi</p>
                <p className="text-base font-bold text-green-700">
                  {profitSharePreview.periodsPerYear}x setahun ({profitSharePreview.frequencyLabel})
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">Periode Bagi Hasil</p>
                <p className="text-base font-bold text-orange-700">
                  {profitShareFrequency === 'monthly' ? 'Setiap Bulan' : 
                   profitShareFrequency === 'quarterly' ? 'Setiap 3 Bulan' : 
                   'Setiap Tahun'}
                </p>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Contoh Perhitungan (Asumsi)</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Profit Bersih {profitSharePreview.frequencyLabel}:</span>
                  <span className="font-semibold text-gray-900">
                    Rp {profitSharePreview.exampleNetProfit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border-t border-yellow-300 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Bagian Investor ({profitSharePreview.sharePercent}%):</span>
                  <span className="font-semibold text-purple-700">
                    Rp {profitSharePreview.investorShareAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Bagian Bisnis:</span>
                  <span className="font-semibold text-green-700">
                    Rp {profitSharePreview.businessShareAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <span>ℹ️</span>
                <span>
                  <strong>Catatan Penting:</strong>
                  <ul className="mt-2 ml-4 space-y-1 list-disc">
                    <li>Preview ini menggunakan angka <strong>contoh</strong> untuk profit bersih (Revenue - Expense)</li>
                    <li>Profit sharing <strong>aktual</strong> dihitung dari profit bersih periode berjalan</li>
                    <li>Sistem akan menyimpan <strong>agreement</strong> ini dan mengaktifkan pengingat otomatis</li>
                    <li>Anda akan dapat <strong>notifikasi</strong> sesuai jadwal untuk bayar profit share</li>
                    <li>Pembayaran profit share dicatat di menu <strong>"Pengeluaran"</strong> dengan link ke investor ini</li>
                  </ul>
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ============================================
            SIMPLE INCOME INPUT (NON-PRODUCT/SERVICE)
            ============================================ */}
        {category && !['product_sales', 'service_income', 'loan_received', 'investor_funding'].includes(category) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Detail Pendapatan</h3>
            <div className="space-y-4">
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
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Bunga deposito November 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            SUMMARY CARD (FOR MULTI-ITEMS)
            ============================================ */}
        {['product_sales', 'service_income'].includes(category) && lineItems.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Ringkasan Pembayaran</h3>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold text-lg">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
              </div>

              {/* Discount Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Diskon:</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discountPercent}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setDiscountPercent(Math.min(100, Math.max(0, val)))
                      }}
                      className="w-20 px-3 py-2 text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                      placeholder="0"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Jumlah Diskon:</span>
                  <span>- Rp {calculateDiscount().toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Tax Section */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                {/* PPN Checkbox */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeTax}
                        onChange={(e) => setIncludeTax(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer transition-all"
                      />
                      <span className="font-medium text-gray-700 group-hover:text-red-600 transition-colors">PPN 11%</span>
                    </label>
                    {includeTax && (
                      <span className="text-red-600 font-bold text-lg">
                        + Rp {calculatePPN().toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 ml-8 mt-1">Pajak Pertambahan Nilai</p>
                </div>

                {/* PPh */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">PPh:</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={taxPPh}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        setTaxPPh(Math.min(100, Math.max(0, val)))
                      }}
                      className="w-20 px-3 py-2 text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-400 transition-all"
                      placeholder="0"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                    {taxPPh > 0 && (
                      <span className="text-red-600 font-bold ml-2">
                        + Rp {calculatePPh().toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Other Fees */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Biaya Lain:</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumber(otherFees.toString())}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\./g, '')
                        setOtherFees(parseInt(val) || 0)
                      }}
                      className="w-40 pl-9 pr-3 py-2 text-right border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-400 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">TOTAL:</span>
                  <span className="text-3xl font-bold text-red-600">
                    Rp {calculateGrandTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                {lineItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span>Auto-update inventory ({lineItems.filter(i => i.product_id).length} produk)</span>
                  </div>
                )}
                {paymentType === 'tempo' && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    <span>Reminder WhatsApp aktif untuk piutang</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            PAYMENT SECTION
            ============================================ */}
        {category && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Pembayaran</h3>
            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="Tunai">💵 Tunai</option>
                  <option value="Transfer">🏦 Transfer Bank</option>
                  <option value="QRIS">📱 QRIS</option>
                  <option value="E-Wallet">💳 E-Wallet</option>
                  <option value="Kartu Kredit">💳 Kartu Kredit</option>
                </select>
              </div>

              {/* Payment Type Buttons */}
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
                      setDownPayment(0)
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
                      <div className="text-xs text-gray-500 mt-1">Bayar nanti</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tempo Fields */}
              {paymentType === 'tempo' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-orange-800">
                    ⚠️ Transaksi ini akan dicatat sebagai <strong>piutang</strong>
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jangka Waktu Tempo
                    </label>
                    <div className="grid grid-cols-4 gap-2">
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
                      Nomor WhatsApp Customer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08123456789"
                      pattern="[0-9]{10,15}"
                      required={paymentType === 'tempo'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📱 Untuk reminder dan invoice via WhatsApp
                    </p>
                  </div>

                  {/* Down Payment for multi-items with tempo */}
                  {['product_sales', 'service_income'].includes(category) && lineItems.length > 0 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Uang Muka (DP)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                          <input
                            type="text"
                            value={formatNumber(downPayment.toString())}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\./g, '')
                              const num = parseInt(val) || 0
                              setDownPayment(Math.min(num, calculateGrandTotal()))
                            }}
                            className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Sisa Tagihan:</span>
                          <span className="font-bold text-blue-700">
                            Rp {calculateRemaining().toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================
            NOTES (COLLAPSIBLE)
            ============================================ */}
        {category && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-sm font-semibold text-gray-700">Informasi Lainnya</h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showNotes ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNotes && (
              <div className="mt-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahan informasi atau catatan khusus..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================
            SUBMIT BUTTON (BIG CTA)
            ============================================ */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !category || (['product_sales', 'service_income'].includes(category) && lineItems.length === 0)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 px-6 rounded-lg text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menyimpan...
              </span>
            ) : (
              '💾 Simpan Transaksi'
            )}
          </button>
        </div>
      </form>

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
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)] space-y-6 pb-safe">
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
            onEdit={handleEditTransaction}
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
                  setQuickProductBuyPrice('')
                  setQuickProductPrice('')
                  setQuickProductUnit('')
                  setQuickProductDuration('')
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama Produk/Layanan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama {quickAddType === 'physical' ? 'Produk' : 'Layanan'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  placeholder={quickAddType === 'physical' ? 'Contoh: Baju Kemeja' : 'Contoh: Potong Rambut'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Satuan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={quickProductUnit}
                  onChange={(e) => setQuickProductUnit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Satuan --</option>
                  {quickAddType === 'physical' ? (
                    <>
                      <option value="pcs">pcs</option>
                      <option value="unit">unit</option>
                      <option value="pasang">pasang</option>
                      <option value="lusin">lusin</option>
                      <option value="box">box</option>
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="liter">liter</option>
                      <option value="meter">meter</option>
                      <option value="__CUSTOM__">➕ Satuan Lain...</option>
                    </>
                  ) : (
                    <>
                      <option value="jam">jam</option>
                      <option value="hari">hari</option>
                      <option value="minggu">minggu</option>
                      <option value="bulan">bulan</option>
                      <option value="proyek">proyek</option>
                      <option value="paket">paket</option>
                      <option value="kali">kali</option>
                      <option value="__CUSTOM__">➕ Satuan Lain...</option>
                    </>
                  )}
                </select>
                {quickProductUnit === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customUnitValue}
                    onChange={(e) => setCustomUnitValue(e.target.value)}
                    placeholder="Contoh: rim, kodi, bungkus..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                    autoFocus
                  />
                )}
              </div>

              {/* Harga Beli - ONLY for physical products */}
              {quickAddType === 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Beli per {quickProductUnit === '__CUSTOM__' ? customUnitValue || 'satuan' : quickProductUnit || 'satuan'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                    <input
                      type="text"
                      value={quickProductBuyPrice}
                      onChange={(e) => handleNumberInput(e, setQuickProductBuyPrice)}
                      placeholder="30.000"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">💡 Harga modal/pembelian produk</p>
                </div>
              )}

              {/* Harga Jual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga {quickAddType === 'physical' ? 'Jual' : 'Layanan'} per {quickProductUnit === '__CUSTOM__' ? customUnitValue || 'satuan' : quickProductUnit || 'satuan'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                  <input
                    type="text"
                    value={quickProductPrice}
                    onChange={(e) => handleNumberInput(e, setQuickProductPrice)}
                    placeholder="50.000"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Service Duration (optional for services) */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Kosongkan jika waktu tidak pasti</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowQuickAddModal(false)
                    setQuickProductName('')
                    setQuickProductBuyPrice('')
                    setQuickProductPrice('')
                    setQuickProductUnit('')
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

      {/* ============================================
          🆕 CUSTOMER MODAL - Select or Add Customer
          ============================================ */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <h3 className="text-xl font-bold">👤 Pilih Pelanggan</h3>
              <p className="text-blue-100 text-sm mt-1">Pilih dari daftar atau tambah pelanggan baru</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Anonymous Option */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked)
                      if (e.target.checked) {
                        setSelectedCustomerId('')
                        setCustomerName('')
                        setCustomerPhone('')
                      }
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">🚶 Anonymous (Tanpa Nama)</div>
                    <div className="text-xs text-gray-500">Transaksi tidak tercatat ke pelanggan tertentu</div>
                  </div>
                </label>
              </div>

              {/* Quick Add Button */}
              {!isAnonymous && (
                <button
                  onClick={() => setShowQuickAddCustomer(true)}
                  className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <span className="text-xl">➕</span>
                  Tambah Pelanggan Baru
                </button>
              )}

              {/* Customers List */}
              {!isAnonymous && (
                <div className="space-y-2">
                  {loadingCustomers ? (
                    <div className="text-center py-8 text-gray-500">Memuat data pelanggan...</div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <div>Belum ada pelanggan</div>
                      <div className="text-xs">Klik tombol "Tambah Pelanggan Baru" untuk memulai</div>
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomerId(customer.id)
                          setCustomerName(customer.name)
                          setCustomerPhone(customer.phone || '')
                          setIsAnonymous(false)
                          setShowCustomerModal(false)
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedCustomerId === customer.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {customer.customer_number} • {customer.phone || 'No phone'}
                            </div>
                            {customer.last_transaction_date && (
                              <div className="text-xs text-gray-500 mt-1">
                                Terakhir: {new Date(customer.last_transaction_date).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600">
                              Rp {(customer.total_spent || 0).toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">{customer.total_transactions || 0} transaksi</div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          🆕 QUICK ADD CUSTOMER MODAL
          ============================================ */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
              <h3 className="text-xl font-bold">➕ Tambah Pelanggan Baru</h3>
              <p className="text-green-100 text-sm mt-1">Isi data pelanggan untuk transaksi ini</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={quickCustomerPhone}
                  onChange={(e) => setQuickCustomerPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <input
                  type="email"
                  value={quickCustomerEmail}
                  onChange={(e) => setQuickCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <textarea
                  value={quickCustomerAddress}
                  onChange={(e) => setQuickCustomerAddress(e.target.value)}
                  placeholder="Jl. Contoh No. 123"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowQuickAddCustomer(false)
                  setQuickCustomerName('')
                  setQuickCustomerPhone('')
                  setQuickCustomerAddress('')
                  setQuickCustomerEmail('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!quickCustomerName.trim()) {
                    showToast('warning', '⚠️ Nama pelanggan wajib diisi')
                    return
                  }
                  if (!quickCustomerPhone.trim()) {
                    showToast('warning', '⚠️ No. telepon wajib diisi')
                    return
                  }

                  setSavingCustomer(true)
                  try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) throw new Error('User not found')

                    // Generate customer number
                    const { data: customerNumber, error: rpcError } = await supabase
                      .rpc('generate_customer_number', { user_id: user.id })

                    if (rpcError) throw rpcError

                    // Insert new customer
                    const { data: newCustomer, error: insertError } = await supabase
                      .from('customers')
                      .insert({
                        owner_id: user.id,
                        customer_number: customerNumber,
                        name: quickCustomerName.trim(),
                        phone: quickCustomerPhone.trim(),
                        email: quickCustomerEmail.trim() || null,
                        address: quickCustomerAddress.trim() || null,
                        is_active: true
                      })
                      .select()
                      .single()

                    if (insertError) throw insertError

                    // Set as selected customer
                    setSelectedCustomerId(newCustomer.id)
                    setCustomerName(newCustomer.name)
                    setCustomerPhone(newCustomer.phone)
                    setIsAnonymous(false)

                    // Close modals and refresh
                    setShowQuickAddCustomer(false)
                    setShowCustomerModal(false)
                    fetchCustomers()

                    // Reset form
                    setQuickCustomerName('')
                    setQuickCustomerPhone('')
                    setQuickCustomerAddress('')
                    setQuickCustomerEmail('')

                    showToast('success', `✅ Pelanggan ${newCustomer.name} berhasil ditambahkan!`)
                  } catch (error) {
                    console.error('Error adding customer:', error)
                    showToast('error', '❌ Gagal menambahkan pelanggan')
                  } finally {
                    setSavingCustomer(false)
                  }
                }}
                disabled={savingCustomer}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingCustomer ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Simpan Pelanggan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
