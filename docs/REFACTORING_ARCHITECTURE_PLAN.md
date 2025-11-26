# 🏗️ REFACTORING ARCHITECTURE PLAN
**Katalara UMKM Dashboard - Component-Based Architecture**

---

## 📋 EXECUTIVE SUMMARY

**Masalah Saat Ini:**
- File `input-income/page.tsx`: 3,140 baris
- File `input-expenses/page.tsx`: 2,767 baris
- Sulit maintenance, debug, dan scaling
- Code duplication tinggi antar fitur

**Solusi:**
- Component-based architecture
- Separation of concerns (UI, Logic, Data)
- Reusable shared components
- Custom hooks untuk business logic

**Timeline:** 3 Phases (dapat dikerjakan bertahap)

---

## 🎯 DESIGN PRINCIPLES

### 1. **Single Responsibility Principle**
Setiap component/file hanya tangani 1 tanggung jawab:
- ✅ `ProductSelector.tsx` → HANYA product selection
- ✅ `PaymentCalculator.tsx` → HANYA payment calculation
- ❌ Tidak: 1 file handle product + payment + customer + validation

### 2. **DRY (Don't Repeat Yourself)**
Code yang sama di Income & Expenses → Extract ke Shared Component:
- Payment summary logic (diskon, PPN, PPh)
- Line items table
- Product/Supplier selector pattern

### 3. **Scalability First**
Struktur harus mudah tambah fitur baru tanpa ubah existing:
- ✅ Tambah tax baru? → Edit `PaymentCalculator.tsx` saja
- ✅ Tambah KPI? → Edit `KPIStats.tsx` saja
- ❌ Tidak: Edit 3000 baris untuk tambah 1 field

### 4. **Type Safety**
Semua data structure didefinisikan di `types/`:
- Autocomplete di IDE
- Catch error saat development
- Dokumentasi otomatis

---

## 📁 PROPOSED FILE STRUCTURE

```
src/
├── app/
│   └── dashboard/
│       ├── input-income/
│       │   ├── page.tsx                    (100-150 baris - Entry point)
│       │   ├── components/
│       │   │   ├── IncomeFormContainer.tsx (200 baris - Main wrapper)
│       │   │   ├── IncomeLineItems.tsx     (200 baris - Table items)
│       │   │   ├── IncomeTypeSelector.tsx  (100 baris - Operating/Investing/Financing)
│       │   │   ├── CustomerSection.tsx     (150 baris - Customer selection)
│       │   │   └── IncomeDatePicker.tsx    (80 baris - Date + invoice)
│       │   ├── hooks/
│       │   │   ├── useIncomeForm.ts        (150 baris - Form state)
│       │   │   ├── useIncomeSubmit.ts      (120 baris - Submit logic)
│       │   │   └── useIncomeKPI.ts         (80 baris - KPI stats)
│       │   └── types/
│       │       └── income.types.ts         (50 baris - Interfaces)
│       │
│       ├── input-expenses/
│       │   ├── page.tsx                    (100-150 baris)
│       │   ├── components/
│       │   │   ├── ExpenseFormContainer.tsx
│       │   │   ├── ExpenseLineItems.tsx
│       │   │   ├── ExpenseTypeSelector.tsx
│       │   │   ├── SupplierSection.tsx
│       │   │   └── ExpenseDatePicker.tsx
│       │   ├── hooks/
│       │   │   ├── useExpenseForm.ts
│       │   │   ├── useExpenseSubmit.ts
│       │   │   └── useExpenseKPI.ts
│       │   └── types/
│       │       └── expense.types.ts
│       │
│       └── input-sales/
│           └── ... (similar structure)
│
├── components/
│   ├── shared/                           (REUSABLE ACROSS FEATURES)
│   │   ├── forms/
│   │   │   ├── ProductSelector.tsx       (200 baris - Universal product picker)
│   │   │   ├── SupplierSelector.tsx      (150 baris - Universal supplier picker)
│   │   │   ├── CustomerSelector.tsx      (150 baris - Universal customer picker)
│   │   │   ├── PaymentCalculator.tsx     (300 baris - Diskon, PPN, PPh, Grand Total)
│   │   │   ├── LineItemsTable.tsx        (250 baris - Generic items table)
│   │   │   ├── DateRangePicker.tsx       (100 baris - Date selection)
│   │   │   └── CurrencyInput.tsx         (80 baris - Formatted number input)
│   │   │
│   │   ├── modals/
│   │   │   ├── QuickAddModal.tsx         (200 baris - Quick add product/customer)
│   │   │   ├── ConfirmDialog.tsx         (100 baris - Confirmation dialog)
│   │   │   └── EducationalModal.tsx      (150 baris - Category guide)
│   │   │
│   │   ├── stats/
│   │   │   ├── KPICard.tsx               (80 baris - Single KPI card)
│   │   │   ├── KPIStatsGrid.tsx          (120 baris - KPI grid layout)
│   │   │   └── TrendIndicator.tsx        (60 baris - Up/down trend arrow)
│   │   │
│   │   └── feedback/
│   │       ├── Toast.tsx                 (100 baris - Toast notification)
│   │       ├── LoadingSpinner.tsx        (50 baris - Loading state)
│   │       └── EmptyState.tsx            (80 baris - No data state)
│   │
│   ├── dashboard/                        (DASHBOARD-SPECIFIC)
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── UserMenu.tsx
│   │
│   └── ui/                               (BASE UI COMPONENTS)
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Checkbox.tsx
│       └── Card.tsx
│
├── hooks/
│   ├── shared/                           (REUSABLE HOOKS)
│   │   ├── useProducts.ts                (150 baris - Fetch & cache products)
│   │   ├── useSuppliers.ts               (120 baris - Fetch & cache suppliers)
│   │   ├── useCustomers.ts               (120 baris - Fetch & cache customers)
│   │   ├── usePaymentCalculation.ts      (180 baris - Payment math logic)
│   │   ├── useFormValidation.ts          (150 baris - Form validation)
│   │   └── useLocalStorage.ts            (80 baris - Persistent state)
│   │
│   └── api/                              (API CALLS)
│       ├── useIncome.ts                  (100 baris - Income CRUD)
│       ├── useExpenses.ts                (100 baris - Expense CRUD)
│       └── useKPIStats.ts                (120 baris - KPI data)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     (Supabase client)
│   │   └── queries.ts                    (Reusable queries)
│   │
│   ├── utils/
│   │   ├── currency.ts                   (Format currency)
│   │   ├── date.ts                       (Date helpers)
│   │   ├── validation.ts                 (Validators)
│   │   └── calculations.ts               (Math helpers)
│   │
│   └── constants/
│       ├── categories.ts                 (Category options)
│       ├── units.ts                      (Unit options)
│       └── payment-types.ts              (Payment type options)
│
└── types/
    ├── global.d.ts                       (Global types)
    ├── database.types.ts                 (Supabase generated types)
    └── shared/
        ├── product.types.ts
        ├── customer.types.ts
        ├── supplier.types.ts
        └── transaction.types.ts
```

---

## 🔄 MIGRATION STRATEGY

### **Phase 1: Foundation (Week 1)**
**Goal:** Extract logic tanpa ubah UI

1. **Create Type Definitions**
   ```typescript
   // types/shared/income.types.ts
   export interface IncomeLineItem {
     id: string
     product_id: string | null
     product_name: string
     qty: number
     price_per_unit: number
     subtotal: number
     // ... all fields
   }
   ```

2. **Extract Custom Hooks**
   ```typescript
   // hooks/shared/useProducts.ts
   export const useProducts = () => {
     const [products, setProducts] = useState([])
     const [loading, setLoading] = useState(true)
     
     useEffect(() => {
       // Fetch logic
     }, [])
     
     return { products, loading, refetch }
   }
   ```

3. **Extract Utility Functions**
   ```typescript
   // lib/utils/calculations.ts
   export const calculateSubtotal = (items: LineItem[]) => {
     return items.reduce((sum, item) => sum + item.subtotal, 0)
   }
   
   export const calculateDiscount = (subtotal: number, discount: Discount) => {
     if (discount.mode === 'percent') {
       return subtotal * (discount.value / 100)
     }
     return discount.value
   }
   ```

**Success Criteria:** 
- ✅ No UI changes visible
- ✅ All functionality works sama
- ✅ Code coverage tests pass

---

### **Phase 2: Component Extraction (Week 2-3)**
**Goal:** Break down UI menjadi small components

**Priority Order:**

#### 2.1. Extract Stateless Components First (Low Risk)
1. **KPIStatsGrid** (100 lines)
2. **Toast** (100 lines)
3. **LoadingSpinner** (50 lines)
4. **EmptyState** (80 lines)

#### 2.2. Extract Form Components (Medium Risk)
1. **ProductSelector** (200 lines)
   - Reusable di Income & Expenses
   - Props: `onSelect`, `products`, `category`
   
2. **PaymentCalculator** (300 lines)
   - Diskon, PPN, PPh, Other Fees, Grand Total
   - Reusable di Income & Expenses
   - Props: `subtotal`, `onChange`, `value`

3. **LineItemsTable** (250 lines)
   - Generic table for products/expenses
   - Props: `items`, `onAdd`, `onRemove`, `onEdit`

#### 2.3. Extract Container Components (Higher Risk)
1. **IncomeFormContainer** (200 lines)
   - Main wrapper with form state
   - Orchestrates child components

**Migration Pattern:**
```typescript
// BEFORE (in page.tsx - 3000 lines)
<div className="kpi-stats">
  {/* 100 lines of KPI code */}
</div>

// AFTER
import { KPIStatsGrid } from '@/components/shared/stats/KPIStatsGrid'

<KPIStatsGrid 
  stats={kpiStats} 
  loading={loadingKpi} 
/>
```

**Success Criteria:**
- ✅ Page.tsx reduced to < 300 lines
- ✅ Components reusable
- ✅ No functionality broken

---

### **Phase 3: Optimization & DRY (Week 4)**
**Goal:** Remove duplication between Income & Expenses

#### 3.1. Create Shared Form Components
```typescript
// components/shared/forms/TransactionForm.tsx
export const TransactionForm = ({ 
  type, // 'income' | 'expense'
  onSubmit,
  initialData 
}) => {
  // Shared logic for both income & expense
  return (
    <form>
      <ProductSelector />
      <LineItemsTable />
      <PaymentCalculator />
      <SubmitButton />
    </form>
  )
}
```

#### 3.2. Merge Similar Hooks
```typescript
// hooks/shared/useTransactionForm.ts
export const useTransactionForm = (type: 'income' | 'expense') => {
  // Shared logic with type-specific variations
  const [lineItems, setLineItems] = useState([])
  
  const addLineItem = (item) => {
    if (type === 'income') {
      // Income-specific logic
    } else {
      // Expense-specific logic
    }
  }
  
  return { lineItems, addLineItem, ... }
}
```

**Success Criteria:**
- ✅ Code duplication < 10%
- ✅ Income & Expenses share 70%+ components
- ✅ Easy to add new transaction types

---

## 📊 DETAILED COMPONENT BREAKDOWN

### 1. **ProductSelector Component**

**File:** `components/shared/forms/ProductSelector.tsx`

**Responsibility:** Product selection dengan autocomplete, quick add, stock info

**Props Interface:**
```typescript
interface ProductSelectorProps {
  value: string | null
  onChange: (productId: string, product: Product) => void
  products: Product[]
  loading?: boolean
  category?: string
  showQuickAdd?: boolean
  showStock?: boolean
  placeholder?: string
  disabled?: boolean
}
```

**Internal State:**
```typescript
- searchQuery: string
- filteredProducts: Product[]
- showQuickAddModal: boolean
```

**Methods:**
```typescript
- handleProductSelect(productId)
- handleQuickAdd()
- filterProducts(query)
```

**Estimated Size:** 200 lines

**Used In:** Input Income, Input Expenses, Input Sales

---

### 2. **PaymentCalculator Component**

**File:** `components/shared/forms/PaymentCalculator.tsx`

**Responsibility:** Calculate diskon, PPN, PPh, other fees, grand total

**Props Interface:**
```typescript
interface PaymentCalculatorProps {
  subtotal: number
  value: PaymentCalculation
  onChange: (value: PaymentCalculation) => void
  enableDiscount?: boolean
  enableTax?: boolean
  enableOtherFees?: boolean
}

interface PaymentCalculation {
  discount: { mode: 'percent' | 'nominal', value: number }
  ppn: { enabled: boolean, rate: number }
  pph: { enabled: boolean, rate: number, preset: string }
  otherFees: { id: string, label: string, amount: number }[]
  grandTotal: number
}
```

**Internal Logic:**
```typescript
- calculateDiscount(): number
- calculatePPN(): number
- calculatePPh(): number
- calculateOtherFeesTotal(): number
- calculateGrandTotal(): number
```

**Estimated Size:** 300 lines

**Used In:** Input Income, Input Expenses

---

### 3. **LineItemsTable Component**

**File:** `components/shared/forms/LineItemsTable.tsx`

**Responsibility:** Display & manage line items (add, edit, delete)

**Props Interface:**
```typescript
interface LineItemsTableProps<T> {
  items: T[]
  columns: ColumnDef<T>[]
  onAdd?: () => void
  onEdit?: (id: string, item: T) => void
  onRemove?: (id: string) => void
  onReorder?: (items: T[]) => void
  loading?: boolean
  emptyMessage?: string
  addButtonLabel?: string
}
```

**Features:**
- Drag & drop reorder
- Inline editing
- Bulk actions
- Responsive mobile view

**Estimated Size:** 250 lines

**Used In:** Input Income, Input Expenses, Input Sales

---

### 4. **useProducts Hook**

**File:** `hooks/shared/useProducts.ts`

**Responsibility:** Fetch, cache, filter products

**Interface:**
```typescript
interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  addProduct: (product: Partial<Product>) => Promise<Product>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  filterByCategory: (category: string) => Product[]
  searchProducts: (query: string) => Product[]
}

export const useProducts = (options?: {
  category?: string
  active?: boolean
  withStock?: boolean
}) => {
  // Implementation
}
```

**Features:**
- Client-side caching
- Auto-refresh on stale
- Optimistic updates
- Search & filter

**Estimated Size:** 150 lines

**Used In:** All input pages, product management

---

### 5. **usePaymentCalculation Hook**

**File:** `hooks/shared/usePaymentCalculation.ts`

**Responsibility:** Business logic untuk payment calculation

**Interface:**
```typescript
interface UsePaymentCalculationReturn {
  subtotal: number
  discount: number
  ppn: number
  pph: number
  otherFees: number
  grandTotal: number
  setDiscount: (discount: Discount) => void
  setPPN: (enabled: boolean) => void
  setPPh: (rate: number) => void
  addOtherFee: (fee: OtherFee) => void
  removeOtherFee: (id: string) => void
  reset: () => void
}

export const usePaymentCalculation = (lineItems: LineItem[]) => {
  // Implementation
}
```

**Features:**
- Real-time calculation
- Multiple discount modes
- Tax calculation
- Custom fees

**Estimated Size:** 180 lines

**Used In:** Input Income, Input Expenses

---

## 🔧 UTILITY FUNCTIONS

### Currency Utilities (`lib/utils/currency.ts`)
```typescript
export const formatCurrency = (amount: number, locale = 'id-ID') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
}

export const formatNumber = (value: number): string => {
  return value.toLocaleString('id-ID')
}
```

### Date Utilities (`lib/utils/date.ts`)
```typescript
export const formatDate = (date: Date, format = 'dd/MM/yyyy') => {
  // Implementation
}

export const parseDate = (dateString: string): Date => {
  // Implementation
}

export const getDateRange = (period: 'today' | 'week' | 'month') => {
  // Implementation
}
```

### Validation Utilities (`lib/utils/validation.ts`)
```typescript
export const validateLineItem = (item: LineItem): ValidationResult => {
  const errors = []
  
  if (!item.product_name) errors.push('Product name required')
  if (item.qty <= 0) errors.push('Quantity must be > 0')
  if (item.price_per_unit <= 0) errors.push('Price must be > 0')
  
  return { valid: errors.length === 0, errors }
}

export const validatePayment = (payment: Payment): ValidationResult => {
  // Implementation
}
```

---

## 📈 EXPECTED OUTCOMES

### Before Refactoring:
```
input-income/page.tsx:     3,140 lines ❌
input-expenses/page.tsx:   2,767 lines ❌
Total:                     5,907 lines
Duplication:               ~40%
Maintainability:           LOW
```

### After Refactoring:
```
input-income/page.tsx:       150 lines ✅
input-expenses/page.tsx:     150 lines ✅
Shared components:         1,500 lines ✅
Hooks:                       800 lines ✅
Utils:                       400 lines ✅
Types:                       200 lines ✅
Total:                     3,200 lines (46% reduction)
Duplication:               <5%
Maintainability:           HIGH
```

### Performance Improvements:
- ⚡ **Initial Load:** 15-20% faster (code splitting)
- ⚡ **Re-renders:** 40-50% reduction (memoization)
- ⚡ **Bundle Size:** 20-25% smaller (tree shaking)

### Developer Experience:
- 🔍 **Debug Time:** 60% faster (isolated components)
- 🧪 **Test Coverage:** 80%+ achievable
- 📝 **Onboarding:** 70% easier (clear structure)
- 🐛 **Bug Fix:** 50% faster (single responsibility)

---

## 🎯 NEXT STEPS

### Immediate Actions:
1. ✅ Review this plan dengan team
2. ✅ Approve architecture & file structure
3. ✅ Setup development branch: `refactor/component-architecture`
4. ✅ Create milestone & tasks di project management

### Phase 1 Kickoff:
1. Create type definitions (`types/` folder)
2. Extract utility functions (`lib/utils/`)
3. Create first hooks (`useProducts`, `useCustomers`)
4. Write unit tests for utils & hooks

### Success Metrics:
- [ ] Page.tsx files < 300 lines each
- [ ] Component reusability > 70%
- [ ] Code duplication < 5%
- [ ] Test coverage > 80%
- [ ] Build size reduced > 20%
- [ ] Zero functionality regression

---

## 📚 RESOURCES & REFERENCES

### Best Practices:
- **React Component Patterns:** [patterns.dev](https://patterns.dev)
- **Custom Hooks:** [usehooks.com](https://usehooks.com)
- **TypeScript Best Practices:** [typescript-cheatsheets](https://github.com/typescript-cheatsheets/react)

### Similar Projects:
- **Shadcn/ui:** Component library structure
- **TanStack Table:** Reusable table patterns
- **React Hook Form:** Form state management

### Tools:
- **Storybook:** Component documentation & testing
- **Vitest:** Unit testing
- **React DevTools:** Performance profiling

---

## ❓ FAQ

**Q: Apakah ini akan break existing functionality?**
A: Tidak. Migration dilakukan bertahap dengan extensive testing di setiap phase.

**Q: Berapa lama total waktu refactoring?**
A: 3-4 minggu untuk full refactoring, tapi bisa dikerjakan parallel dengan feature development.

**Q: Apakah perlu stop development fitur baru?**
A: Tidak. Refactoring dilakukan di branch terpisah, merge bertahap per component.

**Q: Bagaimana handle conflict dengan ongoing development?**
A: Communicate di awal phase mana yang akan di-refactor, freeze changes di file tersebut sementara.

**Q: Testing strategy?**
A: Unit test untuk hooks & utils, integration test untuk components, E2E test untuk critical flows.

---

**Document Version:** 1.0  
**Created:** November 26, 2025  
**Last Updated:** November 26, 2025  
**Status:** 📋 Proposal - Awaiting Approval
