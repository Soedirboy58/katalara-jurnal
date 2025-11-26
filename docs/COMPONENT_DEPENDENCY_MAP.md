# 🗺️ COMPONENT DEPENDENCY MAP
**Visual Guide - Katalara Component Architecture**

---

## 📊 CURRENT STATE (Before Refactoring)

```
┌─────────────────────────────────────────────────────┐
│  input-income/page.tsx (3,140 lines) ❌             │
│  ┌───────────────────────────────────────────────┐  │
│  │ • All State (50+ useState)                    │  │
│  │ • All Handlers (30+ functions)                │  │
│  │ • All API Calls (10+ fetch)                   │  │
│  │ • All UI Components (inline JSX)              │  │
│  │ • All Business Logic (calculations)           │  │
│  │ • All Validation (form checks)                │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓
              🔥 MASALAH:
  • Hard to debug (3000 lines)
  • Hard to test (no isolation)
  • Hard to reuse (everything coupled)
  • Hard to maintain (one change = risk all)
```

---

## 🎯 TARGET STATE (After Refactoring)

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 page.tsx (150 lines) ✅                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  import IncomeFormContainer from './components'          │   │
│  │  import KPIStatsGrid from '@/components/shared/stats'    │   │
│  │  import Toast from '@/components/shared/feedback'        │   │
│  │                                                           │   │
│  │  export default function InputIncomePage() {             │   │
│  │    return (                                               │   │
│  │      <>                                                   │   │
│  │        <KPIStatsGrid />                                   │   │
│  │        <IncomeFormContainer />                            │   │
│  │        <Toast />                                          │   │
│  │      </>                                                  │   │
│  │    )                                                      │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ✅ KEUNTUNGAN:
            • Clear responsibility
            • Easy to understand
            • Fast to navigate
            • Simple to modify
```

---

## 🔄 COMPONENT HIERARCHY

```
page.tsx (Entry Point)
│
├─── KPIStatsGrid/
│    ├── KPICard (Today)
│    ├── KPICard (Week)  
│    └── KPICard (Month)
│
├─── IncomeFormContainer/
│    │
│    ├─── IncomeTypeSelector/
│    │    ├── Operating Radio
│    │    ├── Investing Radio
│    │    └── Financing Radio
│    │
│    ├─── CustomerSection/
│    │    ├── CustomerSelector
│    │    ├── QuickAddButton
│    │    └── CustomerModal
│    │
│    ├─── ProductSelector/
│    │    ├── ProductDropdown
│    │    ├── SearchInput
│    │    ├── QuickAddButton
│    │    └── StockIndicator
│    │
│    ├─── LineItemsTable/
│    │    ├── TableHeader
│    │    ├── TableRow (repeating)
│    │    │   ├── ProductName
│    │    │   ├── Quantity
│    │    │   ├── Price
│    │    │   ├── Subtotal
│    │    │   └── DeleteButton
│    │    ├── AddRowButton
│    │    └── EmptyState
│    │
│    ├─── PaymentCalculator/
│    │    ├── Subtotal Display
│    │    ├── DiscountSection
│    │    │   ├── ModeToggle (% / Rp)
│    │    │   └── AmountInput
│    │    ├── TaxSection
│    │    │   ├── PPN Checkbox
│    │    │   └── PPh Presets
│    │    ├── OtherFeesSection
│    │    │   ├── FeeItem (repeating)
│    │    │   └── AddFeeButton
│    │    └── GrandTotal Display
│    │
│    └─── ActionButtons/
│         ├── SaveButton
│         ├── CancelButton
│         └── ResetButton
│
└─── Toast/
     └── NotificationMessage
```

---

## 🔌 DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    UI COMPONENTS LAYER                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Product   │  │   Payment  │  │  Customer  │            │
│  │  Selector  │  │ Calculator │  │  Selector  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOKS LAYER                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   useForm  │  │ usePayment │  │ useProducts│            │
│  │   State    │  │Calculation │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │Validation  │  │Calculation │  │   Format   │            │
│  │  Utils     │  │   Utils    │  │   Utils    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER (API)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Supabase  │  │   Cache    │  │   Local    │            │
│  │   Client   │  │   Layer    │  │  Storage   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 COMPONENT REUSABILITY MAP

### Shared Components (Dipakai Multiple Pages)

```
┌─────────────────────────────────────────────────────────┐
│            SHARED COMPONENTS (70% Reuse)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ProductSelector                                        │
│  ├─ Used by: Income, Expenses, Sales                   │
│  └─ Variants: with-stock, without-stock, service-only  │
│                                                         │
│  PaymentCalculator                                      │
│  ├─ Used by: Income, Expenses                          │
│  └─ Variants: with-discount, with-tax, basic           │
│                                                         │
│  LineItemsTable                                         │
│  ├─ Used by: Income, Expenses, Sales                   │
│  └─ Variants: editable, readonly, mobile-optimized     │
│                                                         │
│  KPIStatsGrid                                           │
│  ├─ Used by: Income, Expenses, Sales, Dashboard        │
│  └─ Variants: 3-col, 4-col, with-trend                 │
│                                                         │
│  Toast                                                  │
│  ├─ Used by: All pages                                 │
│  └─ Variants: success, error, warning, info            │
│                                                         │
│  CustomerSelector / SupplierSelector                    │
│  ├─ Used by: Income (customer), Expenses (supplier)    │
│  └─ Pattern: Same component, different data source     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Feature-Specific Components (30%)

```
┌─────────────────────────────────────────────────────────┐
│        INCOME-SPECIFIC (Only in Input Income)           │
├─────────────────────────────────────────────────────────┤
│  • IncomeTypeSelector (Operating/Investing/Financing)   │
│  • InvestorSection (Profit sharing logic)               │
│  • LoanSection (Loan terms)                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│       EXPENSE-SPECIFIC (Only in Input Expenses)         │
├─────────────────────────────────────────────────────────┤
│  • ExpenseTypeSelector (Operating/Investing/Financing)  │
│  • AssetSection (Asset purchase details)                │
│  • DepreciationCalculator                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔁 STATE MANAGEMENT FLOW

```
┌────────────────────────────────────────────────────────────┐
│                    CURRENT (Problematic)                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  page.tsx                                                  │
│  ├─ useState #1  (lineItems)                              │
│  ├─ useState #2  (selectedProduct)                        │
│  ├─ useState #3  (quantity)                               │
│  ├─ useState #4  (price)                                  │
│  ├─ useState #5  (subtotal)                               │
│  ├─ useState #6  (discount)                               │
│  ├─ useState #7  (tax)                                    │
│  ├─ useState #8  (grandTotal)                             │
│  ├─ ... 50+ more useState                                 │
│  └─ ❌ All state in one place                             │
│                                                            │
└────────────────────────────────────────────────────────────┘

                        ↓ REFACTOR TO ↓

┌────────────────────────────────────────────────────────────┐
│                   TARGET (Clean Separation)                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  page.tsx                                                  │
│  ├─ No direct useState                                    │
│  └─ Only orchestrate components                           │
│                                                            │
│  useIncomeForm() hook                                     │
│  ├─ lineItems state                                       │
│  ├─ addItem(), removeItem()                               │
│  └─ ✅ Form-specific state                                │
│                                                            │
│  usePaymentCalculation() hook                             │
│  ├─ discount, tax state                                   │
│  ├─ calculateGrandTotal()                                 │
│  └─ ✅ Payment-specific state                             │
│                                                            │
│  useProducts() hook                                       │
│  ├─ products list                                         │
│  ├─ loading, error                                        │
│  └─ ✅ Data-fetching state                                │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENT COMMUNICATION PATTERNS

### Pattern 1: Props Down, Events Up

```typescript
// Parent Component
<PaymentCalculator
  subtotal={1000000}                    // ⬇️ Props Down
  onChange={(value) => setPayment(value)} // ⬆️ Events Up
/>

// Child Component
const PaymentCalculator = ({ subtotal, onChange }) => {
  const [discount, setDiscount] = useState(0)
  
  const handleDiscountChange = (value) => {
    setDiscount(value)
    onChange({ discount: value, ... }) // ⬆️ Notify parent
  }
  
  return <input onChange={handleDiscountChange} />
}
```

### Pattern 2: Custom Hooks for Shared State

```typescript
// Shared state via hook
const useFormState = () => {
  const [data, setData] = useState({})
  return { data, setData }
}

// Multiple components use same hook
const ComponentA = () => {
  const { data } = useFormState()
  return <div>{data.name}</div>
}

const ComponentB = () => {
  const { setData } = useFormState()
  return <button onClick={() => setData({ name: 'John' })}>Update</button>
}
```

### Pattern 3: Context for Global State

```typescript
// Create context
const FormContext = createContext()

// Provider in parent
<FormContext.Provider value={{ lineItems, addItem }}>
  <ChildComponent />
</FormContext.Provider>

// Consume in deep child
const ChildComponent = () => {
  const { lineItems, addItem } = useContext(FormContext)
  return <button onClick={addItem}>Add</button>
}
```

---

## 📦 FILE SIZE COMPARISON

### Before Refactoring:
```
input-income/
└── page.tsx ────────────────────────── 3,140 lines 🔴
```

### After Refactoring:
```
input-income/
├── page.tsx ──────────────────────────── 150 lines ✅
├── components/
│   ├── IncomeFormContainer.tsx ────────── 200 lines ✅
│   ├── IncomeLineItems.tsx ────────────── 200 lines ✅
│   ├── IncomeTypeSelector.tsx ─────────── 100 lines ✅
│   ├── CustomerSection.tsx ────────────── 150 lines ✅
│   └── IncomeDatePicker.tsx ───────────── 80 lines ✅
├── hooks/
│   ├── useIncomeForm.ts ───────────────── 150 lines ✅
│   ├── useIncomeSubmit.ts ─────────────── 120 lines ✅
│   └── useIncomeKPI.ts ────────────────── 80 lines ✅
└── types/
    └── income.types.ts ────────────────── 50 lines ✅
                                    ──────────────────
                               Total: 1,280 lines (60% reduction)
```

**Plus Shared Components (Reused across features):**
```
components/shared/
├── forms/
│   ├── ProductSelector.tsx ───────────── 200 lines
│   ├── PaymentCalculator.tsx ─────────── 300 lines
│   └── LineItemsTable.tsx ────────────── 250 lines
└── stats/
    └── KPIStatsGrid.tsx ──────────────── 120 lines
```

---

## 🎯 MIGRATION CHECKLIST

### Phase 1: Foundation ✅
- [ ] Create `types/` folder with interfaces
- [ ] Create `lib/utils/` with helper functions
- [ ] Create `hooks/shared/` with data hooks
- [ ] Write unit tests for utils
- [ ] Document all types with JSDoc

### Phase 2: UI Components ✅
- [ ] Extract KPIStatsGrid component
- [ ] Extract Toast component
- [ ] Extract LoadingSpinner component
- [ ] Extract ProductSelector component
- [ ] Extract PaymentCalculator component
- [ ] Extract LineItemsTable component
- [ ] Write Storybook stories for each
- [ ] Test components in isolation

### Phase 3: Integration ✅
- [ ] Create IncomeFormContainer
- [ ] Integrate all child components
- [ ] Replace page.tsx content
- [ ] Test full user flow
- [ ] Verify no functionality broken
- [ ] Update documentation

### Phase 4: Optimization ✅
- [ ] Identify duplicate code in Income & Expenses
- [ ] Create shared abstractions
- [ ] Implement code splitting
- [ ] Add lazy loading
- [ ] Optimize bundle size
- [ ] Run performance tests

---

## 💡 QUICK WINS (Can Do Today)

Even before full refactoring, these give immediate benefits:

### 1. Extract Utility Functions (30 minutes)
```typescript
// lib/utils/currency.ts
export const formatCurrency = (amount: number) => {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

// Usage in page.tsx
import { formatCurrency } from '@/lib/utils/currency'
<span>{formatCurrency(grandTotal)}</span>
```

### 2. Extract Type Definitions (20 minutes)
```typescript
// types/income.types.ts
export interface IncomeLineItem {
  id: string
  product_id: string | null
  product_name: string
  qty: number
  price_per_unit: number
  subtotal: number
}

// Usage in page.tsx
import type { IncomeLineItem } from './types/income.types'
const [lineItems, setLineItems] = useState<IncomeLineItem[]>([])
```

### 3. Extract Constants (15 minutes)
```typescript
// lib/constants/categories.ts
export const INCOME_CATEGORIES = {
  operating: [
    { value: 'product_sales', label: '💰 Penjualan Produk' },
    { value: 'service_income', label: '🛠️ Pendapatan Jasa' },
  ],
  // ...
}

// Usage in page.tsx
import { INCOME_CATEGORIES } from '@/lib/constants/categories'
const categories = INCOME_CATEGORIES[incomeType]
```

---

**Map Version:** 1.0  
**Created:** November 26, 2025  
**Purpose:** Visual guide untuk refactoring discussion
