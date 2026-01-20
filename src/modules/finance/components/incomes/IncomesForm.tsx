/**
 * INCOMES FORM COMPONENT
 * Finance Module - Incomes
 * 
 * Main form for creating income transactions
 * Features:
 * - Customer selection/quick add
 * - Multi-item support (via LineItemsBuilder)
 * - Payment method & tempo support
 * - Tax & discount calculations
 * - Summary calculations
 */

'use client'

import { useState, useEffect } from 'react'
import { LineItemsBuilder, type LineItem } from './LineItemsBuilder'
import type { Product } from '@/modules/inventory/types/inventoryTypes'
import {
  INCOME_CATEGORIES_BY_TYPE,
  getIncomeCategoryLabel,
  isIncomeCategoryNonItemMode,
  type IncomeFormData,
  type IncomeType,
  type IncomeCategory,
  type PaymentMethod
} from '@/modules/finance/types/financeTypes'

interface IncomesFormProps {
  onSubmit: (data: IncomeFormData) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
  products: Product[]
  loadingProducts?: boolean
  onAddProduct?: () => void
  onAddCustomer?: () => void
  selectedCustomer?: { id: string; name: string; phone?: string | null; address?: string | null } | null
  initialValues?: Partial<IncomeFormData>
}

export function IncomesForm({
  onSubmit,
  loading = false,
  products,
  loadingProducts = false,
  onAddProduct,
  onAddCustomer,
  selectedCustomer,
  initialValues
}: IncomesFormProps) {
  type InstallmentPreview = {
    installment_number: number
    due_date: string
    principal_amount: number
    interest_amount: number
    total_amount: number
  }

  // Form state
  const [incomeType, setIncomeType] = useState<IncomeType>(initialValues?.income_type || 'operating')
  const [category, setCategory] = useState<string>(initialValues?.income_category || 'product_sales')
  const [transactionDate, setTransactionDate] = useState(
    initialValues?.income_date || new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialValues?.payment_method || 'cash')
  const [paymentType, setPaymentType] = useState<'cash' | 'tempo'>(initialValues?.payment_type || 'cash')
  
  // Customer state
  const [customerId, setCustomerId] = useState<string | undefined>(initialValues?.customer_id)
  const [customerName, setCustomerName] = useState(initialValues?.customer_name || '')
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  // Other income (non-item) mode
  const [otherIncomeAmount, setOtherIncomeAmount] = useState(0)
  const [otherIncomeDescription, setOtherIncomeDescription] = useState('')

  const isLoanCategory = category === 'loan_received' || category === 'loan_receipt'
  const isInvestorCategory = category === 'investor_funding'

  // Loan simulation (loan_received)
  const [loanDate, setLoanDate] = useState<string>(
    initialValues?.income_date || new Date().toISOString().split('T')[0]
  )
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>('')
  const [lenderName, setLenderName] = useState<string>('')
  const [lenderContact, setLenderContact] = useState<string>('')
  const [loanPurpose, setLoanPurpose] = useState<string>('')
  const [loanInterestRate, setLoanInterestRate] = useState<number>(0)
  const [loanTermMonths, setLoanTermMonths] = useState<number>(12)
  const [loanPreview, setLoanPreview] = useState<InstallmentPreview[]>([])
  const [showLoanPreview, setShowLoanPreview] = useState(false)

  // Investor funding guided fields (stored into notes for now)
  const [investorName, setInvestorName] = useState<string>('')
  const [investorContact, setInvestorContact] = useState<string>('')
  const [fundingModel, setFundingModel] = useState<'equity' | 'revenue_share' | 'other'>('revenue_share')
  const [profitSharePercent, setProfitSharePercent] = useState<number>(0)
  const [payoutFrequency, setPayoutFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly')
  const [investorAgreementNotes, setInvestorAgreementNotes] = useState<string>('')
  
  // Summary calculations
  const [discountMode, setDiscountMode] = useState<'percent' | 'nominal'>('percent')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [includeTax, setIncludeTax] = useState(false)
  const [taxPPN, setTaxPPN] = useState(11)
  
  // Notes
  const [notes, setNotes] = useState(initialValues?.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  
  // Tempo payment fields
  const initialTempoDays = initialValues?.tempo_days ?? 7
  const [tempoDays, setTempoDays] = useState(initialTempoDays)
  const [tempoPreset, setTempoPreset] = useState<string>(
    ['7', '14', '30', '60', '90'].includes(String(initialTempoDays)) ? String(initialTempoDays) : 'custom'
  )
  const [dueDate, setDueDate] = useState(initialValues?.due_date || '')
  const [customerPhone, setCustomerPhone] = useState(initialValues?.customer_phone || '')
  const [downPayment, setDownPayment] = useState(initialValues?.down_payment || 0)

  // Sync selected customer (from modal) into form state
  useEffect(() => {
    if (!selectedCustomer) return
    setIsAnonymous(false)
    setCustomerId(selectedCustomer.id)
    setCustomerName(selectedCustomer.name || '')
    if (selectedCustomer.phone) setCustomerPhone(selectedCustomer.phone)
  }, [selectedCustomer])

  // Calculations
  const calculateSubtotal = () => {
    if (isIncomeCategoryNonItemMode(incomeType, category)) return Math.max(0, otherIncomeAmount)
    return lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (discountMode === 'percent') {
      return (subtotal * discountPercent) / 100
    }
    return discountAmount
  }

  const calculatePPN = () => {
    if (!includeTax || !taxPPN) return 0
    const subtotal = calculateSubtotal()
    const afterDiscount = subtotal - calculateDiscount()
    return (afterDiscount * taxPPN) / 100
  }

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = calculateDiscount()
    const ppn = calculatePPN()
    return subtotal - discount + ppn
  }

  // Reset incompatible fields when switching modes
  useEffect(() => {
    if (isIncomeCategoryNonItemMode(incomeType, category)) {
      setLineItems([])
      // Surface description input (matches legacy UI expectation)
      setShowNotes(false)
    }
  }, [incomeType, category])

  // Keep category in sync with selected income type
  useEffect(() => {
    const allowed = (INCOME_CATEGORIES_BY_TYPE[incomeType] || []).map((o) => o.value)
    if (allowed.length === 0) return
    if (!allowed.includes(category as any)) {
      setCategory(allowed[0])
    }
  }, [incomeType])

  // Auto-calculate due date from tempo days
  useEffect(() => {
    if (paymentType === 'tempo' && tempoDays) {
      const date = new Date(transactionDate)
      date.setDate(date.getDate() + tempoDays)
      setDueDate(date.toISOString().split('T')[0])
    }
  }, [paymentType, tempoDays, transactionDate])

  // Keep dropdown preset in sync with tempo days
  useEffect(() => {
    if (paymentType !== 'tempo') return
    const preset = String(tempoDays)
    if (['7', '14', '30', '60', '90'].includes(preset)) setTempoPreset(preset)
    else setTempoPreset('custom')
  }, [paymentType, tempoDays])

  // Reset DP when switching to cash
  useEffect(() => {
    if (paymentType === 'cash') {
      setDownPayment(0)
    }
  }, [paymentType])

  // Keep loan date aligned with transaction date by default
  useEffect(() => {
    if (!isLoanCategory) return
    setLoanDate((prev) => prev || transactionDate)
  }, [isLoanCategory, transactionDate])

  // Clear previews when switching away
  useEffect(() => {
    if (isLoanCategory) return
    setLoanPreview([])
    setShowLoanPreview(false)
  }, [isLoanCategory])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0)

  const getEducationContent = (type: IncomeType, cat: string) => {
    const base = {
      title: getIncomeCategoryLabel(cat),
      tone: 'info' as 'info' | 'warning',
      points: [] as string[],
      caution: '' as string | undefined
    }

    if (type === 'operating' && cat === 'product_sales') {
      return {
        ...base,
        points: [
          'Pendapatan utama dari jual produk (stok akan berkurang otomatis).',
          'Pastikan harga jual, qty, dan diskon sudah benar.'
        ]
      }
    }

    if (type === 'operating' && cat === 'service_income') {
      return {
        ...base,
        points: [
          'Pendapatan dari jasa/layanan (tidak mempengaruhi stok produk).',
          'Gunakan item jasa agar laporan penjualan jasa rapi.'
        ]
      }
    }

    if (type === 'operating' && cat === 'other_income') {
      return {
        ...base,
        points: [
          'Pendapatan di luar penjualan rutin (komisi, bonus, refund, dll).',
          'Isi nominal dan keterangan agar mudah dilacak.'
        ]
      }
    }

    if (type === 'investing' && cat === 'asset_sale') {
      return {
        ...base,
        tone: 'warning',
        points: [
          'Uang masuk dari jual aset usaha (motor, mesin, etalase, dll).',
          'Biasanya bukan pendapatan harian, tapi peristiwa khusus.'
        ],
        caution: 'Tip: tulis aset apa yang dijual dan alasan penjualan.'
      }
    }

    if (type === 'investing') {
      return {
        ...base,
        points: [
          'Uang masuk terkait investasi (return, dividen, dll).',
          'Isi keterangan sumber dan periodenya.'
        ]
      }
    }

    if (type === 'financing' && isLoanCategory) {
      return {
        ...base,
        tone: 'warning',
        points: [
          'Ini bukan pendapatan usaha, tapi dana masuk dari utang (pinjaman).',
          'Gunakan simulasi cicilan agar kamu tahu beban bayar per bulan.'
        ],
        caution: 'Tip: pembayaran cicilan dicatat terpisah sebagai pengeluaran (angsuran/bunga).'
      }
    }

    if (type === 'financing' && cat === 'investor_funding') {
      return {
        ...base,
        tone: 'warning',
        points: [
          'Dana investor biasanya bukan “pendapatan”, tapi penambahan modal/pembiayaan.',
          'Tentukan model: bagi hasil atau penyertaan modal.'
        ],
        caution: 'Tip: tulis kesepakatan persentase, periode, dan cara bayar bagi hasil.'
      }
    }

    if (type === 'financing') {
      return {
        ...base,
        points: [
          'Dana masuk dari pendanaan (modal pribadi, investor, pinjaman, dll).',
          'Isi keterangan agar jelas sumber dan kesepakatannya.'
        ]
      }
    }

    return null
  }

  const calculateLoanPreview = () => {
    const P = Number(otherIncomeAmount || 0)
    const rate = Number(loanInterestRate || 0)
    const n = Number(loanTermMonths || 0)

    if (!P || P <= 0 || !n || n <= 0) {
      alert('Isi jumlah pinjaman dan jangka waktu yang valid')
      return
    }

    const monthlyRate = rate / 100 / 12
    let installmentAmount: number

    if (monthlyRate === 0) {
      installmentAmount = P / n
    } else {
      installmentAmount =
        (P * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
        (Math.pow(1 + monthlyRate, n) - 1)
    }

    installmentAmount = Math.round(installmentAmount * 100) / 100

    const installments: InstallmentPreview[] = []
    let remainingPrincipal = P
    const firstDate = new Date(firstPaymentDate || loanDate || transactionDate)

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

    setLoanPreview(installments)
    setShowLoanPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const autoLoanDesc = lenderName.trim() ? `Pinjaman diterima dari ${lenderName.trim()}` : 'Pinjaman diterima'
    const autoInvestorDesc = investorName.trim() ? `Dana investor dari ${investorName.trim()}` : 'Dana investor'
    const resolvedOtherIncomeDescription = otherIncomeDescription.trim()
      ? otherIncomeDescription
      : isLoanCategory
        ? autoLoanDesc
        : isInvestorCategory
          ? autoInvestorDesc
          : otherIncomeDescription

    // Validation
    if (isIncomeCategoryNonItemMode(incomeType, category)) {
      if (otherIncomeAmount <= 0) {
        alert('Mohon isi nominal pendapatan')
        return
      }
      if (!resolvedOtherIncomeDescription.trim() && !notes.trim()) {
        alert('Mohon isi keterangan/deskripsi pendapatan')
        return
      }

      if (isLoanCategory) {
        if (!lenderName.trim()) {
          alert('Mohon isi nama pemberi pinjaman (Bank/Orang)')
          return
        }
        if (!firstPaymentDate) {
          alert('Mohon isi tanggal bayar pertama')
          return
        }
        if (!loanTermMonths || loanTermMonths <= 0) {
          alert('Mohon isi jangka waktu pinjaman (bulan)')
          return
        }
        if (loanInterestRate < 0) {
          alert('Suku bunga tidak boleh negatif')
          return
        }
      }

      if (isInvestorCategory) {
        if (!investorName.trim()) {
          alert('Mohon isi nama investor')
          return
        }
        if (profitSharePercent < 0 || profitSharePercent > 100) {
          alert('Persentase bagi hasil harus 0-100')
          return
        }
      }
    } else {
      if (lineItems.length === 0) {
        alert('Mohon tambahkan minimal 1 item')
        return
      }
    }

    if (!isAnonymous && !customerName.trim()) {
      alert('Mohon masukkan nama pelanggan atau centang "Pelanggan Anonim"')
      return
    }

    if (paymentType === 'tempo') {
      if (!dueDate) {
        alert('Mohon pilih tanggal jatuh tempo')
        return
      }
      if (!customerPhone) {
        alert('Mohon masukkan nomor WhatsApp pelanggan untuk pengingat tempo')
        return
      }
    }

    // Prepare form data
    const synthesizedOtherIncomeItem = isIncomeCategoryNonItemMode(incomeType, category)
      ? [{
          product_id: undefined,
          product_name: (resolvedOtherIncomeDescription || notes || getIncomeCategoryLabel(category) || 'Pendapatan').toString().trim(),
          qty: 1,
          unit: 'kali',
          price_per_unit: Math.max(0, otherIncomeAmount),
          buy_price: 0
        }]
      : []

    const finalLineItems = isIncomeCategoryNonItemMode(incomeType, category)
      ? synthesizedOtherIncomeItem
      : lineItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          qty: item.quantity,
          unit: item.unit,
          price_per_unit: item.price,
          buy_price: item.buy_price || 0
        }))

    const investorNotesBlock = isInvestorCategory
      ? [
          '---',
          'Investor',
          `Nama: ${investorName || '-'}`,
          investorContact ? `Kontak: ${investorContact}` : null,
          `Model: ${fundingModel === 'revenue_share' ? 'Bagi hasil' : fundingModel === 'equity' ? 'Penyertaan modal' : 'Lainnya'}`,
          profitSharePercent ? `Bagi hasil: ${profitSharePercent}% (${payoutFrequency})` : null,
          investorAgreementNotes ? `Kesepakatan: ${investorAgreementNotes}` : null
        ].filter(Boolean).join('\n')
      : ''

    const loanNotesBlock = isLoanCategory
      ? [
          '---',
          'Pinjaman',
          `Pemberi: ${lenderName || '-'}`,
          lenderContact ? `Kontak: ${lenderContact}` : null,
          loanPurpose ? `Tujuan: ${loanPurpose}` : null,
          `Pokok: ${formatCurrency(otherIncomeAmount)}`,
          `Bunga: ${Number(loanInterestRate || 0)}%/tahun`,
          `Tenor: ${Number(loanTermMonths || 0)} bulan`,
          firstPaymentDate ? `Bayar pertama: ${firstPaymentDate}` : null
        ].filter(Boolean).join('\n')
      : ''

    const baseNotes = isIncomeCategoryNonItemMode(incomeType, category)
      ? (notes || resolvedOtherIncomeDescription || undefined)
      : (notes || undefined)

    const enrichedNotesRaw = [
      baseNotes,
      loanNotesBlock || undefined,
      investorNotesBlock || undefined
    ].filter(Boolean).join('\n')

    const enrichedNotes = enrichedNotesRaw.trim() ? enrichedNotesRaw : undefined

    const formData: IncomeFormData = {
      income_type: incomeType,
      income_category: category as IncomeCategory,
      income_date: transactionDate,
      customer_id: !isAnonymous ? customerId : undefined,
      customer_name: isAnonymous ? 'Umum / Walk-in' : customerName,
      customer_phone: paymentType === 'tempo' ? (customerPhone || undefined) : undefined,
      payment_method: paymentMethod,
      payment_type: paymentType,
      tempo_days: paymentType === 'tempo' ? tempoDays : undefined,
      due_date: paymentType === 'tempo' ? (dueDate || undefined) : undefined,
      down_payment: paymentType === 'tempo' ? Math.max(0, downPayment) : undefined,
      discount_mode: discountMode,
      discount_value: discountMode === 'percent' ? discountPercent : discountAmount,
      ppn_enabled: includeTax,
      ppn_rate: includeTax ? taxPPN : 0,
      notes: enrichedNotes,
      loan_details: isLoanCategory
        ? {
            loan_amount: Math.max(0, Number(otherIncomeAmount || 0)),
            interest_rate: Math.max(0, Number(loanInterestRate || 0)),
            loan_term_months: Math.max(1, Number(loanTermMonths || 1)),
            loan_date: loanDate || transactionDate,
            first_payment_date: firstPaymentDate || loanDate || transactionDate,
            lender_name: lenderName.trim(),
            lender_contact: lenderContact.trim() || undefined,
            purpose: loanPurpose.trim() || undefined
          }
        : undefined,
      investor_details: isInvestorCategory
        ? {
            investor_name: investorName.trim(),
            investor_contact: investorContact.trim() || undefined,
            funding_model: fundingModel,
            profit_share_percent: profitSharePercent ? Number(profitSharePercent) : undefined,
            payout_frequency: payoutFrequency,
            agreement_notes: investorAgreementNotes.trim() || undefined
          }
        : undefined,
      lineItems: finalLineItems
    }

    const result = await onSubmit(formData)

    if (result.success) {
      // Reset form
      setLineItems([])
      setOtherIncomeAmount(0)
      setOtherIncomeDescription('')
      setLoanDate(new Date().toISOString().split('T')[0])
      setFirstPaymentDate('')
      setLenderName('')
      setLenderContact('')
      setLoanPurpose('')
      setLoanInterestRate(0)
      setLoanTermMonths(12)
      setLoanPreview([])
      setShowLoanPreview(false)
      setInvestorName('')
      setInvestorContact('')
      setFundingModel('revenue_share')
      setProfitSharePercent(0)
      setPayoutFrequency('monthly')
      setInvestorAgreementNotes('')
      setCustomerName('')
      setIsAnonymous(false)
      setDiscountPercent(0)
      setDiscountAmount(0)
      setNotes('')
      setPaymentType('cash')
      setCustomerPhone('')
      setDueDate('')
      setDownPayment(0)
      setCustomerId(undefined)
    }
  }

  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '')
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const parseNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '')
    const parsed = parseInt(cleaned || '0', 10)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Pendapatan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Income Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Pendapatan
            </label>
            <select
              value={incomeType}
              onChange={(e) => setIncomeType(e.target.value as IncomeType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="operating">Operasional</option>
              <option value="investing">Investasi</option>
              <option value="financing">Pendanaan</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {(INCOME_CATEGORIES_BY_TYPE[incomeType] || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(() => {
          const edu = getEducationContent(incomeType, category)
          if (!edu) return null
          const wrapClass =
            edu.tone === 'warning'
              ? 'mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'
              : 'mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4'
          const titleClass =
            edu.tone === 'warning'
              ? 'text-sm font-semibold text-amber-900'
              : 'text-sm font-semibold text-blue-900'
          const listClass =
            edu.tone === 'warning'
              ? 'mt-2 text-sm text-amber-900 list-disc pl-5 space-y-1'
              : 'mt-2 text-sm text-blue-900 list-disc pl-5 space-y-1'
          const cautionClass = edu.tone === 'warning' ? 'mt-2 text-xs text-amber-800' : 'mt-2 text-xs text-blue-800'

          return (
            <div className={wrapClass}>
              <div className={titleClass}>{edu.title}</div>
              <ul className={listClass}>
                {edu.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {edu.caution && <div className={cautionClass}>{edu.caution}</div>}
            </div>
          )
        })()}
      </div>

      {/* Customer Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Pelanggan</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => {
                const checked = e.target.checked
                setIsAnonymous(checked)
                if (checked) {
                  setCustomerId(undefined)
                  setCustomerName('Umum / Walk-in')
                  setCustomerPhone('')
                } else {
                  setCustomerName('')
                  setCustomerPhone('')
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Pelanggan Anonim (Walk-in customer)
            </label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2">
              {customerId ? (
                <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{customerName}</div>
                    <div className="text-xs text-gray-600 truncate">{customerPhone || 'No. WA belum diisi'}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onAddCustomer && (
                      <button
                        type="button"
                        onClick={onAddCustomer}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white"
                      >
                        Ganti
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId(undefined)
                        setCustomerName('')
                        setCustomerPhone('')
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onAddCustomer}
                  disabled={!onAddCustomer}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Pilih Pelanggan
                </button>
              )}
              <div className="text-xs text-gray-500">
                Gunakan tombol di atas untuk mencari pelanggan terdaftar (ada filter di modal).
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    setCustomerId(undefined)
                  }}
                  placeholder="Atau ketik nama pelanggan (manual)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!isAnonymous}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">
          {isIncomeCategoryNonItemMode(incomeType, category)
            ? getIncomeCategoryLabel(category)
            : category === 'service_income'
              ? 'Item Jasa'
              : 'Item Penjualan'}
        </h3>

        {isIncomeCategoryNonItemMode(incomeType, category) ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isLoanCategory ? 'Dana Masuk (Pokok Pinjaman)' : isInvestorCategory ? 'Dana Masuk (Modal Investor)' : 'Nominal'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumber(String(otherIncomeAmount || ''))}
                  onChange={(e) => setOtherIncomeAmount(parseNumber(e.target.value))}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {incomeType === 'investing'
                  ? 'Contoh: jual motor operasional, return investasi, dividen, dll.'
                  : incomeType === 'financing'
                    ? 'Contoh: setoran modal pribadi, pinjaman bank diterima, dana investor, dll.'
                    : 'Contoh: komisi, refund, bonus, dll.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Deskripsi</label>
              <textarea
                value={otherIncomeDescription}
                onChange={(e) => setOtherIncomeDescription(e.target.value)}
                placeholder={
                  incomeType === 'investing'
                    ? 'Contoh: Jual aset motor operasional'
                    : incomeType === 'financing'
                      ? 'Contoh: Pinjaman bank BCA diterima'
                      : 'Contoh: Pendapatan lain-lain'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {isLoanCategory && (
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-semibold text-gray-900">Simulasi Pinjaman (Preview Cicilan)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Pinjaman</label>
                    <input
                      type="date"
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Bayar Pertama *</label>
                    <input
                      type="date"
                      value={firstPaymentDate}
                      onChange={(e) => setFirstPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Suku Bunga (% per tahun)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={loanInterestRate}
                      onChange={(e) => setLoanInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jangka Waktu (bulan) *</label>
                    <input
                      type="number"
                      value={loanTermMonths}
                      onChange={(e) => setLoanTermMonths(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Pemberi Pinjaman *</label>
                    <input
                      type="text"
                      value={lenderName}
                      onChange={(e) => setLenderName(e.target.value)}
                      placeholder="Bank BCA / Koperasi / Orang"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kontak (opsional)</label>
                    <input
                      type="text"
                      value={lenderContact}
                      onChange={(e) => setLenderContact(e.target.value)}
                      placeholder="No. telp/WA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tujuan Pinjaman (opsional)</label>
                  <input
                    type="text"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    placeholder="Modal kerja / beli mesin / renovasi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={calculateLoanPreview}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    Hitung Preview Cicilan
                  </button>
                  <div className="text-xs text-gray-600">
                    Preview ini simulasi anuitas; hasil bank bisa berbeda.
                  </div>
                </div>

                {showLoanPreview && loanPreview.length > 0 && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="text-sm font-semibold text-gray-900">Ringkasan</div>
                    <div className="mt-1 text-sm text-gray-700">
                      Estimasi cicilan per bulan:{' '}
                      <span className="font-semibold">{formatCurrency(loanPreview[0]?.total_amount || 0)}</span>
                    </div>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-[640px] w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="py-2 pr-3">Ke-</th>
                            <th className="py-2 pr-3">Jatuh tempo</th>
                            <th className="py-2 pr-3">Pokok</th>
                            <th className="py-2 pr-3">Bunga</th>
                            <th className="py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loanPreview.slice(0, 24).map((row) => (
                            <tr key={row.installment_number} className="border-t border-gray-200">
                              <td className="py-2 pr-3">{row.installment_number}</td>
                              <td className="py-2 pr-3">{row.due_date}</td>
                              <td className="py-2 pr-3">{formatCurrency(row.principal_amount)}</td>
                              <td className="py-2 pr-3">{formatCurrency(row.interest_amount)}</td>
                              <td className="py-2">{formatCurrency(row.total_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {loanPreview.length > 24 && (
                        <div className="mt-2 text-xs text-gray-600">
                          Ditampilkan 24 cicilan pertama. Total tenor: {loanPreview.length} bulan.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isInvestorCategory && (
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-semibold text-gray-900">Kesepakatan Investor (Ringkas)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Investor *</label>
                    <input
                      type="text"
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                      placeholder="Nama orang/instansi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kontak (opsional)</label>
                    <input
                      type="text"
                      value={investorContact}
                      onChange={(e) => setInvestorContact(e.target.value)}
                      placeholder="No. WA / email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Model Pendanaan</label>
                    <select
                      value={fundingModel}
                      onChange={(e) => setFundingModel(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="revenue_share">Bagi hasil</option>
                      <option value="equity">Penyertaan modal (equity)</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bagi hasil (%)</label>
                    <input
                      type="number"
                      value={profitSharePercent}
                      onChange={(e) => setProfitSharePercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min={0}
                      max={100}
                    />
                    <div className="text-[11px] text-gray-500 mt-1">
                      Isi 0 jika belum ada kesepakatan persentase.
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frekuensi Bayar</label>
                    <select
                      value={payoutFrequency}
                      onChange={(e) => setPayoutFrequency(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="quarterly">Per 3 bulan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Kesepakatan (opsional)</label>
                  <textarea
                    value={investorAgreementNotes}
                    onChange={(e) => setInvestorAgreementNotes(e.target.value)}
                    placeholder="Contoh: Bagi hasil dari laba bersih, dibayar tiap tanggal 5. Setelah balik modal, persentase turun."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <LineItemsBuilder
            items={lineItems}
            onChange={setLineItems}
            products={products}
            loadingProducts={loadingProducts}
            category={category}
            onAddProduct={onAddProduct}
          />
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Ringkasan</h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium tabular-nums whitespace-nowrap">
              Rp {new Intl.NumberFormat('id-ID').format(calculateSubtotal())}
            </span>
          </div>

          {/* Discount */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-gray-600">Diskon</span>
                <select
                  value={discountMode}
                  onChange={(e) => setDiscountMode(e.target.value as 'percent' | 'nominal')}
                  className="h-8 px-2 text-xs border border-gray-300 rounded-md bg-white"
                >
                  <option value="percent">%</option>
                  <option value="nominal">Rp</option>
                </select>
              </div>
              <span className="text-sm font-semibold text-red-600 tabular-nums whitespace-nowrap">
                -Rp {new Intl.NumberFormat('id-ID').format(calculateDiscount())}
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              {discountMode === 'percent' ? (
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-9 w-28 px-3 text-sm border border-gray-300 rounded-md text-right bg-white tabular-nums"
                  min="0"
                  max="100"
                />
              ) : (
                <input
                  type="text"
                  value={formatNumber(discountAmount.toString())}
                  onChange={(e) => setDiscountAmount(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                  placeholder="0"
                  className="h-9 w-40 px-3 text-sm border border-gray-300 rounded-md text-right bg-white tabular-nums"
                />
              )}
            </div>
          </div>

          {/* Tax */}
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <label htmlFor="includeTax" className="flex items-center gap-2 text-sm text-gray-600 select-none">
              <input
                type="checkbox"
                id="includeTax"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>PPN {taxPPN}%</span>
            </label>
            <span className="text-sm font-medium tabular-nums whitespace-nowrap">
              +Rp {new Intl.NumberFormat('id-ID').format(calculatePPN())}
            </span>
          </div>
          {includeTax && <div className="text-xs text-gray-500">PPN dihitung dari nilai setelah diskon.</div>}

          <hr className="border-gray-200" />

          {/* Grand Total */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-blue-600 tabular-nums whitespace-nowrap">
              Rp {new Intl.NumberFormat('id-ID').format(calculateGrandTotal())}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Metode Pembayaran</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6 sm:justify-start">
            <label
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                paymentType === 'cash'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <input
                type="radio"
                value="cash"
                checked={paymentType === 'cash'}
                onChange={() => setPaymentType('cash')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm whitespace-nowrap">Tunai/Transfer</span>
            </label>
            <label
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                paymentType === 'tempo'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <input
                type="radio"
                value="tempo"
                checked={paymentType === 'tempo'}
                onChange={() => setPaymentType('tempo')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm whitespace-nowrap">Tempo (Piutang)</span>
            </label>
          </div>

          {paymentType === 'tempo' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tempo
                  </label>
                  <select
                    value={tempoPreset}
                    onChange={(e) => {
                      const v = e.target.value
                      setTempoPreset(v)
                      if (v === 'custom') return
                      const days = parseInt(v, 10)
                      setTempoDays(Number.isFinite(days) ? days : 7)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="7">7 hari</option>
                    <option value="14">14 hari</option>
                    <option value="30">30 hari</option>
                    <option value="60">60 hari</option>
                    <option value="90">90 hari</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required={paymentType === 'tempo'}
                  />
                </div>
              </div>

              {tempoPreset === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Custom (hari)
                  </label>
                  <input
                    type="number"
                    value={tempoDays}
                    onChange={(e) => setTempoDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    min="1"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  WhatsApp Pelanggan (untuk reminder)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="628123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required={paymentType === 'tempo'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Uang Muka (DP) - opsional
                </label>
                <input
                  type="text"
                  value={formatNumber(downPayment.toString())}
                  onChange={(e) => setDownPayment(parseInt(e.target.value.replace(/\./g, '')) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Sisa piutang: Rp {new Intl.NumberFormat('id-ID').format(Math.max(0, calculateGrandTotal() - Math.max(0, downPayment)))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <span>{showNotes ? '▼' : '▶'}</span>
          <span>Catatan (opsional)</span>
        </button>
        
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan untuk transaksi ini..."
            rows={3}
            className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center sm:justify-end">
        <button
          type="submit"
          disabled={
            loading ||
            (isIncomeCategoryNonItemMode(incomeType, category)
              ? otherIncomeAmount <= 0
              : lineItems.length === 0)
          }
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Menyimpan...' : '💾 Simpan Transaksi'}
        </button>
      </div>
    </form>
  )
}
