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
  | 'product_sales' | 'service_income' | 'retail_sales' | 'wholesale_sales'
  // Investing
  | 'asset_sale' | 'dividend_income' | 'interest_income'
  // Financing
  | 'loan_receipt' | 'investor_funding' | 'capital_injection'

export type PaymentMethod = 'cash' | 'transfer' | 'tempo'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface Income {
  id: string
  owner_id: string
  income_type: IncomeType
  income_category: IncomeCategory
  income_description?: string
  
  // Customer Reference
  customer_id?: string
  customer_name?: string
  
  // Transaction Details
  income_date: string // DATE
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
  remaining_payment: number // Piutang
  payment_date?: string
  due_date?: string
  
  // Notes & Metadata
  notes?: string
  tags?: string[]
  
  created_at: string
  updated_at: string
}

export interface IncomeItem {
  id: string
  income_id: string
  owner_id: string
  
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
  | 'raw_materials' | 'operational' | 'salary' | 'marketing' | 'rent'
  // Investing
  | 'asset_purchase' | 'investment'
  // Financing
  | 'loan_payment' | 'dividend_payment'

export interface Expense {
  id: string
  owner_id: string
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
  owner_id: string
  
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
  user_id: string
  
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
  payment_method: PaymentMethod
  payment_type: 'cash' | 'tempo'
  notes?: string
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
