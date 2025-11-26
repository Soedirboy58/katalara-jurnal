# FRONTEND STRUCTURE MAPPING
**Date:** November 26, 2025  
**Purpose:** Map existing frontend structure to new modular domain-based architecture  
**Backend Status:** All domains v1.0 (CORE, FINANCE, STOREFRONT, SUPPORTING) - stable & tagged

---

## 📊 CURRENT STRUCTURE ANALYSIS

### App Router Structure
```
src/app/
├── dashboard/
│   ├── input-income/          → FINANCE (incomes table)
│   ├── input-expenses/         → FINANCE (expenses table)
│   ├── customers/              → FINANCE (customers table)
│   ├── suppliers/              → FINANCE (suppliers table)
│   ├── finance/
│   │   └── loans/              → FINANCE (loans table)
│   ├── products/               → INVENTORY (products table)
│   ├── lapak/                  → STOREFRONT (business_storefronts)
│   ├── profile/                → CORE (users)
│   ├── general-settings/       → CORE (business_config)
│   ├── reports/                → Cross-domain
│   └── ...
├── lapak/[slug]/               → STOREFRONT (public storefront view)
├── login/                      → Auth
├── register/                   → Auth + CORE (onboarding)
└── ...
```

### Components Structure
```
src/components/
├── income/
│   ├── TransactionsTable.tsx   → FINANCE module
│   └── PrintModal.tsx          → FINANCE module
├── expenses/
│   ├── POPreviewModal.tsx      → FINANCE module
│   └── ReceiptScanner.tsx      → FINANCE module
├── finance/
│   └── LoanForm.tsx            → FINANCE module
├── products/
│   ├── ProductTable.tsx        → INVENTORY/shared
│   ├── ProductModal.tsx        → INVENTORY/shared
│   └── ...                     → 8+ files
├── lapak/                      → STOREFRONT module
├── modals/
│   ├── CustomerModal.tsx       → FINANCE module
│   └── SupplierModal.tsx       → FINANCE module
├── onboarding/
│   └── OnboardingWizard.tsx    → CORE module
├── ui/
│   ├── Button.tsx              → Shared
│   ├── Modal.tsx               → Shared
│   ├── Input.tsx               → Shared
│   └── ...                     → 8+ shared UI components
└── dashboard/                  → Mixed (to be reorganized)
```

### Hooks
```
src/hooks/
└── useProducts.ts              → INVENTORY module (links to products table)
```

---

## 🎯 TARGET MODULAR STRUCTURE

### New Domain-Based Modules
```
src/
├── modules/
│   ├── core/
│   │   ├── components/
│   │   │   ├── OnboardingWizard.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── BusinessConfigForm.tsx
│   │   │   └── UserMenuContent.tsx
│   │   ├── hooks/
│   │   │   ├── useUserProfile.ts
│   │   │   ├── useBusinessConfig.ts
│   │   │   └── useOnboarding.ts
│   │   └── types/
│   │       └── coreTypes.ts
│   │
│   ├── finance/
│   │   ├── components/
│   │   │   ├── incomes/
│   │   │   │   ├── IncomesForm.tsx
│   │   │   │   ├── IncomesTable.tsx
│   │   │   │   ├── IncomePrintModal.tsx
│   │   │   │   └── LineItemsBuilder.tsx
│   │   │   ├── expenses/
│   │   │   │   ├── ExpensesForm.tsx
│   │   │   │   ├── ExpensesTable.tsx
│   │   │   │   ├── POPreviewModal.tsx
│   │   │   │   └── ReceiptScanner.tsx
│   │   │   ├── customers/
│   │   │   │   ├── CustomersTable.tsx
│   │   │   │   ├── CustomerForm.tsx
│   │   │   │   └── CustomerModal.tsx
│   │   │   ├── suppliers/
│   │   │   │   ├── SuppliersTable.tsx
│   │   │   │   ├── SupplierForm.tsx
│   │   │   │   └── SupplierModal.tsx
│   │   │   └── loans/
│   │   │       ├── LoansTable.tsx
│   │   │       ├── LoanForm.tsx
│   │   │       └── LoanPaymentModal.tsx
│   │   ├── hooks/
│   │   │   ├── useIncomes.ts
│   │   │   ├── useExpenses.ts
│   │   │   ├── useCustomers.ts
│   │   │   ├── useSuppliers.ts
│   │   │   └── useLoans.ts
│   │   └── types/
│   │       └── financeTypes.ts
│   │
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── ProductsTable.tsx
│   │   │   ├── ProductModal.tsx
│   │   │   ├── ProductCardView.tsx
│   │   │   ├── StockAdjustModal.tsx
│   │   │   └── BulkActionsBar.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts (move from src/hooks)
│   │   │   └── useStockMovements.ts
│   │   └── types/
│   │       └── inventoryTypes.ts
│   │
│   ├── storefront/
│   │   ├── components/
│   │   │   ├── StorefrontPublicPage.tsx
│   │   │   ├── StorefrontProductCard.tsx
│   │   │   ├── StorefrontGrid.tsx
│   │   │   ├── CartWidget.tsx
│   │   │   └── StorefrontSettingsForm.tsx
│   │   ├── hooks/
│   │   │   ├── useStorefront.ts
│   │   │   ├── useStorefrontProducts.ts
│   │   │   ├── useCart.ts
│   │   │   └── useStorefrontAnalytics.ts
│   │   └── types/
│   │       └── storefrontTypes.ts
│   │
│   └── supporting/
│       ├── components/
│       │   └── (future: chat, notifications, etc.)
│       ├── hooks/
│       │   └── useStorage.ts
│       └── types/
│           └── supportingTypes.ts
│
├── components/
│   └── shared/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── TablePagination.tsx
│       ├── Toast.tsx
│       ├── UserMenu.tsx
│       └── ImageCropper.tsx
│
├── lib/
│   ├── api/
│   │   ├── incomes.ts
│   │   ├── expenses.ts
│   │   ├── customers.ts
│   │   ├── suppliers.ts
│   │   └── products.ts
│   ├── supabase/
│   │   ├── client.ts (existing)
│   │   ├── server.ts (existing)
│   │   └── middleware.ts (existing)
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── helpers.ts (existing)
│
└── app/
    └── dashboard/
        ├── input-income/page.tsx      → import from modules/finance
        ├── input-expenses/page.tsx    → import from modules/finance
        ├── customers/page.tsx         → import from modules/finance
        ├── suppliers/page.tsx         → import from modules/finance
        ├── finance/loans/page.tsx     → import from modules/finance
        ├── products/page.tsx          → import from modules/inventory
        ├── lapak/page.tsx             → import from modules/storefront
        └── profile/page.tsx           → import from modules/core
```

---

## 📋 DETAILED MAPPING

### FINANCE Domain Files

#### Pages to Refactor
| Current Page | Lines | Status | Target Module | Priority |
|--------------|-------|--------|---------------|----------|
| `dashboard/input-income/page.tsx` | 3140 | 🔴 Bloated | `modules/finance/components/incomes/` | P0 |
| `dashboard/input-expenses/page.tsx` | 2765 | 🔴 Bloated | `modules/finance/components/expenses/` | P0 |
| `dashboard/customers/page.tsx` | 334 | 🟡 Medium | `modules/finance/components/customers/` | P1 |
| `dashboard/suppliers/page.tsx` | 544 | 🟡 Medium | `modules/finance/components/suppliers/` | P1 |
| `dashboard/finance/loans/page.tsx` | ~400 | 🟡 Medium | `modules/finance/components/loans/` | P2 |

#### Components to Move
| Component | Current Path | Target Path |
|-----------|--------------|-------------|
| `TransactionsTable.tsx` | `components/income/` | `modules/finance/components/incomes/` |
| `PrintModal.tsx` | `components/income/` | `modules/finance/components/incomes/` |
| `POPreviewModal.tsx` | `components/expenses/` | `modules/finance/components/expenses/` |
| `ReceiptScanner.tsx` | `components/expenses/` | `modules/finance/components/expenses/` |
| `CustomerModal.tsx` | `components/modals/` | `modules/finance/components/customers/` |
| `SupplierModal.tsx` | `components/modals/` | `modules/finance/components/suppliers/` |
| `LoanForm.tsx` | `components/finance/` | `modules/finance/components/loans/` |

#### Hooks to Create
- `useIncomes()` - CRUD incomes + income_items tables
- `useExpenses()` - CRUD expenses + expense_items tables
- `useCustomers()` - CRUD customers table
- `useSuppliers()` - CRUD suppliers table
- `useLoans()` - CRUD loans + loan_installments tables

### INVENTORY Domain Files

#### Pages to Refactor
| Current Page | Lines | Status | Target Module | Priority |
|--------------|-------|--------|---------------|----------|
| `dashboard/products/page.tsx` | ~800 | 🟡 Medium | `modules/inventory/components/` | P1 |

#### Components to Move
| Component | Current Path | Target Path |
|-----------|--------------|-------------|
| `ProductTable.tsx` | `components/products/` | `modules/inventory/components/` |
| `ProductModal.tsx` | `components/products/` | `modules/inventory/components/` |
| `ProductCardView.tsx` | `components/products/` | `modules/inventory/components/` |
| `StockAdjustModal.tsx` | `components/products/` | `modules/inventory/components/` |
| `BulkActionsBar.tsx` | `components/products/` | `modules/inventory/components/` |

#### Hooks to Move/Create
- `useProducts()` - Move from `hooks/useProducts.ts` → `modules/inventory/hooks/useProducts.ts`
- `useStockMovements()` - Create new for product_stock_movements table

### STOREFRONT Domain Files

#### Pages to Refactor
| Current Page | Lines | Status | Target Module | Priority |
|--------------|-------|--------|---------------|----------|
| `dashboard/lapak/page.tsx` | ~500 | 🟡 Medium | `modules/storefront/components/` | P2 |
| `lapak/[slug]/page.tsx` | ~600 | 🟡 Medium | `modules/storefront/components/` | P2 |

#### Components to Move
| Component | Current Path | Target Path |
|-----------|--------------|-------------|
| All `components/lapak/*` | `components/lapak/` | `modules/storefront/components/` |

#### Hooks to Create
- `useStorefront()` - CRUD business_storefronts table
- `useStorefrontProducts()` - CRUD storefront_products table (with product_id FK)
- `useCart()` - Handle cart_sessions table
- `useStorefrontAnalytics()` - Query storefront_analytics table

### CORE Domain Files

#### Pages to Refactor
| Current Page | Lines | Status | Target Module | Priority |
|--------------|-------|--------|---------------|----------|
| `dashboard/profile/page.tsx` | ~300 | 🟢 Small | `modules/core/components/` | P2 |
| `dashboard/general-settings/page.tsx` | ~400 | 🟡 Medium | `modules/core/components/` | P2 |
| `register/business-info/page.tsx` | ~500 | 🟡 Medium | `modules/core/components/` | P2 |

#### Components to Move
| Component | Current Path | Target Path |
|-----------|--------------|-------------|
| `OnboardingWizard.tsx` | `components/onboarding/` | `modules/core/components/` |

#### Hooks to Create
- `useUserProfile()` - Fetch/update user profile
- `useBusinessConfig()` - CRUD business_config table
- `useOnboarding()` - Handle onboarding state

### SHARED Components

#### Components to Move to `components/shared/`
| Component | Current Path | Usage |
|-----------|--------------|-------|
| `Button.tsx` | `components/ui/` | Universal |
| `Input.tsx` | `components/ui/` | Universal |
| `Modal.tsx` | `components/ui/` | Universal |
| `ConfirmDialog.tsx` | `components/ui/` | Universal |
| `Toast.tsx` | `components/ui/` | Universal |
| `UserMenu.tsx` | `components/ui/` | Universal |
| `TablePagination.tsx` | `components/ui/` | Universal |
| `ImageCropper.tsx` | `components/ui/` | Universal |

---

## 🚀 REFACTOR EXECUTION PLAN

### Phase 1: Infrastructure Setup ✅ NEXT
**Goal:** Create base folder structure + shared components

**Steps:**
1. Create `src/modules/` folder structure
2. Create `src/components/shared/` folder
3. Move UI components to `components/shared/`
4. Create `src/lib/api/` folder
5. Create base type files in each module

**Files to Create:**
- `modules/finance/types/financeTypes.ts`
- `modules/inventory/types/inventoryTypes.ts`
- `modules/storefront/types/storefrontTypes.ts`
- `modules/core/types/coreTypes.ts`

**Validation:**
- No build errors
- All imports resolve correctly

---

### Phase 2: Finance Module - Incomes (PRIORITY P0)
**Goal:** Refactor input-income page (3140 lines → modular)

**Steps:**
1. Create `modules/finance/hooks/useIncomes.ts`
2. Extract UI components:
   - `IncomesForm.tsx` (form logic)
   - `LineItemsBuilder.tsx` (multi-items section)
   - Move `TransactionsTable.tsx` → `modules/finance/components/incomes/`
3. Update `app/dashboard/input-income/page.tsx` to thin wrapper
4. Test: create income, edit, delete, print

**Success Criteria:**
- `input-income/page.tsx` < 200 lines
- All functionality intact
- No console errors

---

### Phase 3: Finance Module - Expenses (PRIORITY P0)
**Goal:** Refactor input-expenses page (2765 lines → modular)

**Steps:**
1. Create `modules/finance/hooks/useExpenses.ts`
2. Extract UI components:
   - `ExpensesForm.tsx`
   - `ExpenseLineItems.tsx`
   - Move `POPreviewModal.tsx` → `modules/finance/components/expenses/`
3. Update `app/dashboard/input-expenses/page.tsx` to thin wrapper
4. Test: create expense, PO generation, supplier linking

**Success Criteria:**
- `input-expenses/page.tsx` < 200 lines
- All functionality intact

---

### Phase 4: Finance Module - Customers & Suppliers (PRIORITY P1)
**Goal:** Modularize customer/supplier pages

**Steps:**
1. Create `modules/finance/hooks/useCustomers.ts`
2. Create `modules/finance/hooks/useSuppliers.ts`
3. Extract components:
   - `CustomersTable.tsx`
   - `SuppliersTable.tsx`
   - Move modals to respective folders
4. Update pages to thin wrappers

---

### Phase 5: Inventory Module (PRIORITY P1)
**Goal:** Organize products management

**Steps:**
1. Move `hooks/useProducts.ts` → `modules/inventory/hooks/`
2. Move all `components/products/*` → `modules/inventory/components/`
3. Create `useStockMovements.ts` for product_stock_movements table
4. Update `dashboard/products/page.tsx`

---

### Phase 6: Storefront Module (PRIORITY P2)
**Goal:** Modularize lapak (storefront) features

**Steps:**
1. Create all storefront hooks
2. Move lapak components
3. Update both dashboard lapak page & public lapak page
4. Link to products table via product_id FK

---

### Phase 7: Core Module (PRIORITY P2)
**Goal:** Organize profile, onboarding, business config

**Steps:**
1. Create core hooks
2. Move onboarding wizard
3. Update profile & settings pages

---

### Phase 8: Final Cleanup & Testing
**Goal:** Ensure everything works

**Steps:**
1. Run `npm run lint`
2. Run `npm run build`
3. Test all routes
4. Check console for errors
5. Git commit with clear message

---

## 📝 NOTES

### Design Principles
1. **Additive Only**: Never delete old files until new ones work
2. **Backward Compatible**: Keep all URLs/routes unchanged
3. **Progressive**: One domain at a time, test frequently
4. **Type Safety**: TypeScript for all new code
5. **DRY**: Extract repeated logic to hooks/utils

### Backend Integration Points
- **FINANCE domain** → `incomes`, `expenses`, `customers`, `suppliers`, `loans`, `investments`
- **INVENTORY domain** → `products`, `product_stock_movements`
- **STOREFRONT domain** → `business_storefronts`, `storefront_products`, `cart_sessions`
- **CORE domain** → `users`, `business_config`, `user_profile`
- **SUPPORTING domain** → `storage_lapak`, `notifications` (future)

### Key Relationships
```
products (INVENTORY)
  ↑
  ├─ income_items.product_id (FINANCE)
  └─ storefront_products.product_id (STOREFRONT)

customers (FINANCE)
  ↑
  └─ incomes.customer_id (FINANCE)

suppliers (FINANCE)
  ↑
  └─ expenses.supplier_id (FINANCE)
```

---

## ✅ SUCCESS METRICS

### Code Quality
- [ ] All pages < 300 lines (except complex dashboards)
- [ ] Zero TypeScript errors
- [ ] Zero console errors in browser
- [ ] All routes accessible

### Functionality
- [ ] Income creation works (cash + tempo)
- [ ] Expense creation works (multi-items)
- [ ] Customer CRUD works
- [ ] Supplier CRUD works
- [ ] Product management works
- [ ] Storefront public view works
- [ ] Profile update works

### Performance
- [ ] Build time < 2 minutes
- [ ] No slowdown in page loads
- [ ] Lint passes without warnings

---

**Status:** Ready to start Phase 1 (Infrastructure Setup)  
**Next Step:** Create base modules folder structure
