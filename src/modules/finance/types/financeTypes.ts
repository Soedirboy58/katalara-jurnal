/**
 * FINANCE DOMAIN TYPES
 * Backend: Finance Domain v1.0 (stable & tagged)
 * Tables: incomes, income_items, expenses, expense_items,
 *         customers, suppliers, loans, loan_installments, investments
 */

// ============================================
// INCOMES & INCOME_ITEMS
// ============================================

export type IncomeType = 'operating' | 'investing' | 'financing'

export type IncomeCategory = 
  // Operating
  | 'product_sales' | 'service_income' | 'other_income'
  // Deprecated (legacy UI categories – keep for historical data)
  | 'retail_sales' | 'wholesale_sales'
  // Investing
  | 'asset_sale' | 'investment_return' | 'dividend_income' | 'interest_income' | 'other_investing'
  // Financing
  | 'loan_received' | 'loan_receipt' | 'investor_funding' | 'capital_injection' | 'other_financing'

export const INCOME_CATEGORIES_BY_TYPE: Record<IncomeType, Array<{ value: IncomeCategory; label: string }>> = {
  operating: [
    { value: 'product_sales', label: '🛒 Penjualan Produk' },
    { value: 'service_income', label: '🧰 Pendapatan Jasa' },
    { value: 'other_income', label: '🧾 Pendapatan Lain-lain' }
  ],
  investing: [
    { value: 'asset_sale', label: '🏷️ Jual Aset' },
    { value: 'investment_return', label: '📈 Return Investasi' },
    { value: 'other_investing', label: '💼 Investasi Lainnya' }
  ],
  financing: [
    { value: 'capital_injection', label: '💰 Modal Masuk Pribadi' },
    { value: 'loan_received', label: '🏦 Pinjaman Diterima (Utang Bank)' },
    { value: 'investor_funding', label: '🤝 Dana Investor' },
    { value: 'other_financing', label: '💳 Pendanaan Lainnya' }
  ]
}

export const getIncomeCategoryLabel = (category: string): string => {
  const raw = (category || '').toString().trim()
  if (!raw) return ''

  const key = raw
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')

  const map: Record<string, string> = {
    product_sales: '🛒 Penjualan Produk',
    service_income: '🧰 Pendapatan Jasa',
    other_income: '🧾 Pendapatan Lain-lain',
    asset_sale: '🏷️ Jual Aset',
    assetsales: '🏷️ Jual Aset',
    aset_sale: '🏷️ Jual Aset',
    aset: '🏷️ Jual Aset',
    investment_return: '📈 Return Investasi',
    dividend_income: '📊 Dividen',
    interest_income: '💹 Bunga',
    other_investing: '💼 Investasi Lainnya',
    capital_injection: '💰 Modal Masuk Pribadi',
    loan_received: '🏦 Pinjaman Diterima (Utang Bank)',
    loan_receipt: '🏦 Pinjaman Diterima (Utang Bank)',
    investor_funding: '🤝 Dana Investor',
    other_financing: '💳 Pendanaan Lainnya'
  }

  return map[raw] || map[key] || raw
}

export const getPaymentMethodLabel = (method: string | null | undefined): string => {
  const raw = (method || '').toString().trim()
  if (!raw || raw === '-') return '-'

  const key = raw
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')

  const map: Record<string, string> = {
    cash: 'Tunai',
    tunai: 'Tunai',
    transfer: 'Transfer',
    bank_transfer: 'Transfer',
    qris: 'QRIS',
    ewallet: 'Dompet Digital',
    e_wallet: 'Dompet Digital',
    ewallet_transfer: 'Dompet Digital',
    tempo: 'Tempo',
    kredit: 'Tempo',
    credit: 'Tempo'
  }

  if (map[key]) return map[key]

  // If it's already a friendly label, keep it.
  if (/^[A-Za-z][A-Za-z\s]+$/.test(raw)) {
    return raw.replace(/\b\w/g, (m) => m.toUpperCase())
  }

  return raw
}

export const isIncomeCategoryNonItemMode = (incomeType: IncomeType, category: string): boolean => {
  // Only operating product/service use line-items. Everything else uses nominal + description.
  if (incomeType !== 'operating') return true
  return category === 'other_income'
}

export type PaymentMethod = 'cash' | 'transfer' | 'tempo' | string
export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'Pending'
  | 'Lunas'
  | 'Tempo'
  | string

export interface Income {
  id: string
  user_id?: string
  owner_id?: string
  income_type?: IncomeType | string
  income_category?: IncomeCategory | string
  category?: string
  income_description?: string
  description?: string
  
  // Customer Reference
  customer_id?: string
  customer_name?: string
  customer_phone?: string
  
  // Transaction Details
  income_date: string // DATE
  invoice_number?: string
  reference_number?: string
  
  // Financial Data
  subtotal?: number | string
  discount_mode?: 'nominal' | 'percent' | string
  discount_value?: number | string
  discount_amount?: number | string
  
  // Tax & Fees
  ppn_enabled?: boolean
  ppn_rate?: number | string
  ppn_amount?: number | string
  pph_enabled?: boolean
  pph_type?: string
  pph_rate?: number | string
  pph_amount?: number | string
  other_fees?: number | string
  
  grand_total?: number | string
  amount?: number | string
  total_amount?: number | string
  
  // Payment Information
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  payment_type?: string
  paid_amount?: number | string
  remaining_payment?: number | string // Piutang
  payment_date?: string
  due_date?: string
  
  // Notes & Metadata
  notes?: string
  tags?: string[]
  
  created_at?: string
  updated_at?: string
}

export interface IncomeItem {
  id: string
  income_id: string
  user_id: string
  
  // Product Reference
  product_id?: string // FK to products table (INVENTORY domain)
  product_name: string
  
  // Quantity & Pricing
  qty: number
  unit: string
  price_per_unit: number
  
  // Profit Tracking
  buy_price: number // COGS
  profit_per_unit: number
  subtotal: number
  total_profit: number
  
  notes?: string
  created_at: string
}

// ============================================
// EXPENSES & EXPENSE_ITEMS
// ============================================

export type ExpenseType = 'operating' | 'investing' | 'financing'

export type ExpenseCategory = 
  // Operating
  | 'raw_materials'
  | 'finished_goods'
  | 'office_supplies'
  | 'utilities'
  | 'marketing'
  | 'employee_expense'
  | 'transportation'
  | 'maintenance'
  | 'other_operating'
  // Investing
  | 'equipment'
  | 'technology'
  | 'property'
  | 'vehicle'
  | 'other_investing'
  // Financing
  | 'loan_payment'
  | 'interest'
  | 'dividend'
  | 'other_financing'
  // Legacy aliases (keep for historical data)
  | 'operational_expense'
  | 'operational'
  | 'operational_cost'
  | 'other'

export const EXPENSE_CATEGORIES_BY_TYPE: Record<ExpenseType, Array<{ value: string; label: string }>> = {
  operating: [
    { value: 'finished_goods', label: '🎁 Pembelian Produk Jadi (Reseller)' },
    { value: 'raw_materials', label: '📦 Pembelian Bahan Baku (Produksi)' },
    { value: 'employee_expense', label: '👥 Gaji & Upah' },
    { value: 'marketing', label: '📢 Marketing & Iklan' },
    { value: 'office_supplies', label: '🏪 Operasional Toko' },
    { value: 'transportation', label: '🚚 Transportasi & Logistik' },
    { value: 'utilities', label: '💡 Utilitas (Listrik, Air, Internet)' },
    { value: 'maintenance', label: '🔧 Pemeliharaan & Perbaikan' },
    { value: 'other_operating', label: '📋 Lain-lain' }
  ],
  investing: [
    { value: 'equipment', label: '🏭 Pembelian Peralatan' },
    { value: 'vehicle', label: '🚗 Pembelian Kendaraan' },
    { value: 'property', label: '🏢 Pembelian Properti' },
    { value: 'technology', label: '💻 Software & Teknologi' },
    { value: 'other_investing', label: '💼 Investasi Lain-lain' }
  ],
  financing: [
    { value: 'loan_payment', label: '🏦 Bayar Utang / Cicilan' },
    { value: 'interest', label: '💰 Bayar Bunga Pinjaman' },
    { value: 'dividend', label: '📊 Bagi Hasil / Dividen' },
    { value: 'other_financing', label: '💳 Pendanaan Lain-lain' }
  ]
}

export const getExpenseCategoryLabel = (category: string | null | undefined): string => {
  const raw = (category || '').toString().trim()
  if (!raw || raw === '-') return '-'

  const key = raw
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')

  const map: Record<string, string> = {
    raw_materials: '📦 Pembelian Bahan Baku (Produksi)',
    finished_goods: '🎁 Pembelian Produk Jadi (Reseller)',
    office_supplies: '🏪 Operasional Toko',
    utilities: '💡 Utilitas (Listrik, Air, Internet)',
    marketing: '📢 Marketing & Iklan',
    employee_expense: '👥 Gaji & Upah',
    transportation: '🚚 Transportasi & Logistik',
    maintenance: '🔧 Pemeliharaan & Perbaikan',
    other_operating: '📋 Lain-lain',
    equipment: '🏭 Pembelian Peralatan',
    technology: '💻 Software & Teknologi',
    property: '🏢 Pembelian Properti',
    vehicle: '🚗 Pembelian Kendaraan',
    other_investing: '💼 Investasi Lain-lain',
    loan_payment: '🏦 Bayar Utang / Cicilan',
    interest: '💰 Bayar Bunga Pinjaman',
    dividend: '📊 Bagi Hasil / Dividen',
    other_financing: '💳 Pendanaan Lain-lain',
    operational_expense: '📋 Operasional',
    operational: '📋 Operasional',
    operational_cost: '📋 Operasional',
    other: '📋 Lainnya'
  }

  if (map[raw]) return map[raw]
  if (map[key]) return map[key]

  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export interface Expense {
  id: string
  user_id: string
  expense_type: ExpenseType
  expense_category: ExpenseCategory
  expense_description?: string
  
  // Supplier Reference
  supplier_id?: string
  supplier_name?: string
  
  // Transaction Details
  expense_date: string
  po_number?: string
  invoice_number?: string
  reference_number?: string
  
  // Financial Data
  subtotal: number
  discount_mode: 'nominal' | 'percent'
  discount_value: number
  discount_amount: number
  
  // Tax & Fees
  ppn_enabled: boolean
  ppn_rate: number
  ppn_amount: number
  pph_enabled: boolean
  pph_type?: string
  pph_rate: number
  pph_amount: number
  other_fees: number
  
  grand_total: number
  
  // Payment Information
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  paid_amount: number
  remaining_payment: number // Hutang
  payment_date?: string
  due_date?: string
  
  // Notes & Metadata
  notes?: string
  tags?: string[]
  
  created_at: string
  updated_at: string
}

export interface ExpenseItem {
  id: string
  expense_id: string
  user_id: string
  
  // Product Reference
  product_id?: string // FK to products table (INVENTORY domain)
  product_name: string
  
  // Quantity & Pricing
  qty: number
  unit: string
  price_per_unit: number
  subtotal: number
  
  notes?: string
  created_at: string
}

// ============================================
// CUSTOMERS
// ============================================

export type CustomerType = 'individual' | 'company' | 'reseller' | 'retail'
export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Customer {
  id: string
  owner_id: string
  
  // Basic Info
  name: string
  code?: string // Internal customer code
  customer_type?: CustomerType
  
  // Contact Information
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  province?: string
  city?: string
  postal_code?: string
  
  // Business Details
  tax_id?: string // NPWP
  company_name?: string
  
  // Payment Terms
  default_payment_term_days: number // 0=cash, 7, 14, 30, 60
  credit_limit: number
  
  // Financial Tracking
  total_purchases: number
  outstanding_balance: number // Piutang
  last_purchase_date?: string
  
  // Customer Lifetime Value (CLV)
  lifetime_value: number
  average_order_value: number
  purchase_frequency: number
  
  // Loyalty & Segmentation
  tier?: CustomerTier
  loyalty_points: number
  tags?: string[]
  
  // Status
  is_active: boolean
  
  // Notes & Preferences
  notes?: string
  preferred_payment_method?: PaymentMethod
  
  created_at: string
  updated_at: string
}

// ============================================
// SUPPLIERS
// ============================================

export type SupplierType = 'raw_materials' | 'finished_goods' | 'both' | 'services'

export interface Supplier {
  id: string
  owner_id: string
  
  // Basic Info
  name: string
  code?: string // Internal supplier code
  supplier_type?: SupplierType
  category?: string
  
  // Contact Information
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  province?: string
  city?: string
  postal_code?: string
  
  // Business Details
  tax_id?: string // NPWP
  company_name?: string
  
  // Payment Terms
  default_payment_term_days: number
  credit_limit: number
  
  // Financial Tracking
  total_purchases: number
  outstanding_balance: number // Hutang
  last_purchase_date?: string
  
  // Performance
  rating?: number // 1-5
  tags?: string[]
  
  // Status
  is_active: boolean
  
  // Notes
  notes?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// LOANS & LOAN_INSTALLMENTS
// ============================================

export type LoanType = 'receivable' | 'payable' // Piutang vs Hutang
export type LoanStatus = 'active' | 'paid_off' | 'defaulted'

export interface Loan {
  id: string
  owner_id: string
  
  loan_type: LoanType
  loan_status: LoanStatus
  
  // Parties
  lender_name?: string // Pemberi pinjaman
  borrower_name?: string // Peminjam
  
  // Loan Details
  principal_amount: number
  interest_rate: number // Annual %
  loan_term_months: number
  start_date: string
  maturity_date: string
  
  // Installment Details
  installment_amount: number
  installment_frequency: 'daily' | 'weekly' | 'monthly'
  
  // Tracking
  total_paid: number
  remaining_balance: number
  next_payment_date?: string
  
  // Notes
  notes?: string
  contract_number?: string
  
  created_at: string
  updated_at: string
}

export interface LoanInstallment {
  id: string
  loan_id: string
  owner_id: string
  
  installment_number: number
  due_date: string
  principal_amount: number
  interest_amount: number
  total_amount: number
  
  // Payment Tracking
  payment_status: PaymentStatus
  paid_date?: string
  paid_amount: number
  late_fee: number
  
  notes?: string
  created_at: string
}

// ============================================
// INVESTMENTS & PROFIT_SHARING_HISTORY
// ============================================

export type InvestmentType = 'equity' | 'debt' | 'revenue_share'
export type InvestmentStatus = 'active' | 'exited' | 'liquidated'

export interface Investment {
  id: string
  owner_id: string
  
  investment_type: InvestmentType
  investment_status: InvestmentStatus
  
  // Investor Details
  investor_name: string
  investor_phone?: string
  investor_email?: string
  
  // Investment Details
  investment_amount: number
  investment_date: string
  equity_percentage?: number // For equity investments
  
  // Returns
  expected_return_rate?: number
  return_frequency?: 'monthly' | 'quarterly' | 'annually'
  maturity_date?: string
  
  // Tracking
  total_returns_paid: number
  current_value: number
  roi: number
  
  // Notes
  notes?: string
  contract_number?: string
  
  created_at: string
  updated_at: string
}

export interface ProfitSharingHistory {
  id: string
  investment_id: string
  owner_id: string
  
  period_start: string
  period_end: string
  gross_profit: number
  investor_share_percentage: number
  investor_share_amount: number
  
  payment_date?: string
  payment_status: PaymentStatus
  
  notes?: string
  created_at: string
}

// ============================================
// FORM STATE TYPES
// ============================================

export interface IncomeFormData {
  income_type: IncomeType
  income_category: IncomeCategory
  income_date: string
  customer_id?: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  payment_method: PaymentMethod
  payment_type: 'cash' | 'tempo'
  tempo_days?: number
  due_date?: string
  down_payment?: number
  discount_mode?: 'percent' | 'nominal'
  discount_value?: number
  ppn_enabled?: boolean
  ppn_rate?: number
  notes?: string
  loan_details?: {
    loan_amount: number
    interest_rate: number
    loan_term_months: number
    loan_date: string
    first_payment_date: string
    lender_name: string
    lender_contact?: string
    purpose?: string
  }
  investor_details?: {
    investor_name: string
    investor_contact?: string
    funding_model?: 'equity' | 'revenue_share' | 'other'
    profit_share_percent?: number
    payout_frequency?: 'weekly' | 'monthly' | 'quarterly'
    agreement_notes?: string
  }
  lineItems: {
    product_id?: string
    product_name: string
    qty: number
    unit: string
    price_per_unit: number
    buy_price: number
  }[]
}

export interface ExpenseFormData {
  expense_type: ExpenseType
  expense_category: ExpenseCategory
  expense_date: string
  supplier_id?: string
  supplier_name?: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  notes?: string
  lineItems: {
    product_id?: string
    product_name: string
    qty: number
    unit: string
    price_per_unit: number
  }[]
}
