# 📋 PANDUAN MANUAL ASSEMBLY - Input Pendapatan Update

## 🎯 Overview
File ini adalah panduan langkah-demi-langkah untuk merakit file `page.tsx` final dari 5 update parts.

## 📁 Files yang Sudah Dibuat
1. ✅ `UPDATE_PART_1_IMPORTS_AND_STATE.tsx` - Imports & state variables
2. ✅ `UPDATE_PART_2_PAYMENT_TEMPO_UI.tsx` - Payment method & tempo UI
3. ✅ `UPDATE_PART_3_SERVICE_SELECTOR.tsx` - Service product selector
4. ✅ `UPDATE_PART_4_FUNCTIONS.tsx` - New functions & updated handleSubmit
5. ✅ `UPDATE_PART_5_TRANSACTIONS_TABLE.tsx` - Transactions table section

## 🔧 STEP-BY-STEP ASSEMBLY

### STEP 1: Prepare FINAL_PAGE.tsx
```bash
# Buat copy dari page.tsx yang sekarang
Copy page.tsx → FINAL_PAGE.tsx
```

### STEP 2: Update Imports & State (Lines 1-80)
**Location:** Bagian paling atas file

**Action:**
1. Buka `UPDATE_PART_1_IMPORTS_AND_STATE.tsx`
2. Copy SELURUH content
3. Di `FINAL_PAGE.tsx`, REPLACE dari baris 1 sampai baris yang berisi:
   ```tsx
   const { products, loading: loadingProducts } = useProducts()
   ```
4. Paste code dari UPDATE_PART_1

**Result:** Imports updated + new state variables added + products split by type

---

### STEP 3: Insert Payment Method & Tempo UI (After customerName field)
**Location:** Di dalam `<form>`, setelah field `customerName`

**Action:**
1. Buka `UPDATE_PART_2_PAYMENT_TEMPO_UI.tsx`
2. Copy SELURUH content
3. Di `FINAL_PAGE.tsx`, cari baris:
   ```tsx
   <input
     type="text"
     value={customerName}
     onChange={(e) => setCustomerName(e.target.value)}
     ...
   />
   ```
4. Setelah closing `</div>` dari field customerName, INSERT code dari UPDATE_PART_2

**Result:** Payment method selector + Cash/Tempo toggle + Tempo duration buttons + Due date picker + WhatsApp input

---

### STEP 4: Replace Product Selector (Lines ~300-400)
**Location:** Di dalam form, bagian product sales

**Action:**
1. Buka `UPDATE_PART_3_SERVICE_SELECTOR.tsx`
2. Copy SELURUH content
3. Di `FINAL_PAGE.tsx`, cari kondisi:
   ```tsx
   {category === 'product_sales' && (
   ```
4. REPLACE seluruh blok tersebut (sampai closing `</>`-nya) dengan code dari UPDATE_PART_3

**Changes:**
- `category === 'product_sales'` → `['product_sales', 'service_income'].includes(category)`
- Tambah kondisi untuk membedakan label produk vs jasa
- Tambah info durasi untuk service
- Tambah note tentang total waktu service

**Result:** Unified selector untuk produk fisik DAN layanan jasa

---

### STEP 5: Add & Update Functions (After useEffect KPI)
**Location:** Setelah useEffect yang fetch KPI stats

**Action:**
1. Buka `UPDATE_PART_4_FUNCTIONS.tsx`
2. Copy SELURUH content
3. Di `FINAL_PAGE.tsx`, cari fungsi `handleSubmit` yang lama
4. REPLACE `handleSubmit` dengan versi baru dari UPDATE_PART_4
5. REPLACE `resetForm` dengan versi baru dari UPDATE_PART_4
6. INSERT `fetchTransactions` function SEBELUM handleSubmit
7. INSERT new useEffect untuk load transactions

**Changes in handleSubmit:**
- Add validation untuk tempo (due_date & customer_phone required)
- Add service_duration calculation
- Update payload dengan fields baru: payment_type, payment_status, due_date, customer_phone, service_duration
- Call fetchTransactions() after success

**Changes in resetForm:**
- Add reset untuk: paymentType, tempoDays, dueDate, customerPhone

**Result:** Complete payment tracking + service support in form submission

---

### STEP 6: Replace Recent Transactions Section (Lines ~700-730)
**Location:** Bagian paling bawah, sebelum closing tags

**Action:**
1. Buka `UPDATE_PART_5_TRANSACTIONS_TABLE.tsx`
2. Copy SELURUH content
3. Di `FINAL_PAGE.tsx`, cari bagian:
   ```tsx
   {/* Recent Transactions */}
   <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
     <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
     <div className="text-center py-8 text-gray-500">
       <p>Belum ada pendapatan tercatat</p>
       <p className="text-sm">Mulai catat pendapatan pertama Anda!</p>
     </div>
   </div>
   ```
4. REPLACE seluruh div tersebut dengan code dari UPDATE_PART_5

**Result:** Full-featured transactions table dengan pagination, bulk actions, print, dan refresh button

---

## ✅ VERIFICATION CHECKLIST

Setelah assembly selesai, pastikan:

### Import Section
- [ ] `import { TransactionsTable } from '@/components/income/TransactionsTable'` ada
- [ ] Interface `Product` dengan `product_type` & `service_duration` ada
- [ ] `useProducts` dipanggil 2x (physicalProducts & serviceProducts)

### State Variables
- [ ] Ada `paymentType`, `tempoDays`, `dueDate`, `customerPhone`
- [ ] Ada `transactions`, `loadingTransactions`, `businessName`
- [ ] `products` variable menggunakan ternary based on category

### Form UI
- [ ] Payment method selector ada (5 options: Tunai, Transfer, QRIS, E-Wallet, Kartu Kredit)
- [ ] Payment type toggle (Lunas vs Kredit/Tempo) ada
- [ ] Tempo section (duration buttons, due date, WhatsApp) muncul ketika paymentType === 'tempo'
- [ ] Product/Service selector menggunakan kondisi `['product_sales', 'service_income'].includes(category)`

### Functions
- [ ] `fetchTransactions()` function ada
- [ ] `useEffect(() => { fetchTransactions() }, [])` ada
- [ ] `handleSubmit` include validation untuk tempo (due_date & customer_phone)
- [ ] `handleSubmit` payload include: payment_type, payment_status, due_date, customer_phone, service_duration
- [ ] `handleSubmit` call `fetchTransactions()` after success
- [ ] `resetForm` reset semua field termasuk payment & tempo fields

### Transactions Table
- [ ] `<TransactionsTable>` component digunakan
- [ ] Props: transactions, businessName, onRefresh
- [ ] Loading state dengan spinner
- [ ] Empty state dengan icon & message

---

## 🐛 TROUBLESHOOTING

### Error: Cannot find module 'TransactionsTable'
**Fix:** Pastikan import path benar: `@/components/income/TransactionsTable`

### Error: products.find is not a function
**Fix:** Pastikan menggunakan ternary untuk products:
```tsx
const products = category === 'service_income' ? serviceProducts : physicalProducts
```

### Error: Cannot read property 'service_duration' of undefined
**Fix:** Pastikan product lookup menggunakan serviceProducts untuk service_income:
```tsx
const product = serviceProducts.find((p: Product) => p.id === selectedProductId)
```

### Tempo section tidak muncul
**Fix:** Pastikan kondisi `{paymentType === 'tempo' && (` ada dan paymentType state sudah di-set

### Transactions table kosong terus
**Fix:** 
1. Check fetchTransactions() dipanggil di useEffect
2. Check API route `/api/income` return format
3. Check browser console untuk errors

---

## 🎨 VISUAL STRUCTURE

```
page.tsx (FINAL)
├── Imports
│   ├── React hooks
│   ├── Supabase client
│   ├── useProducts hook
│   └── TransactionsTable component ← NEW
│
├── Interface Product ← UPDATED (add product_type, service_duration)
│
├── Component Function
│   ├── State Variables
│   │   ├── Existing (incomeType, category, etc.)
│   │   ├── Payment tracking (paymentType, tempoDays, dueDate, customerPhone) ← NEW
│   │   └── Transactions (transactions, loadingTransactions, businessName) ← NEW
│   │
│   ├── Hooks
│   │   ├── useProducts (physical) ← NEW
│   │   ├── useProducts (service) ← NEW
│   │   └── products = ternary based on category ← NEW
│   │
│   ├── useEffects
│   │   ├── Educational modal check
│   │   ├── Fetch KPI stats
│   │   └── Fetch transactions ← NEW
│   │
│   ├── Functions
│   │   ├── formatNumber
│   │   ├── handleNumberInput
│   │   ├── showToast
│   │   ├── fetchKpiStats
│   │   ├── fetchTransactions ← NEW
│   │   ├── handleIncomeTypeChange
│   │   ├── handleCategoryChange
│   │   ├── calculateTotal
│   │   ├── handleSubmit ← UPDATED (add payment tracking)
│   │   └── resetForm ← UPDATED (add payment fields)
│   │
│   └── JSX Return
│       ├── Page Header
│       ├── Quick Stats (KPI cards)
│       ├── Input Form
│       │   ├── Transaction Date
│       │   ├── Income Type (Operating/Investing/Financing)
│       │   ├── Category Selector
│       │   ├── Product/Service Selector ← UPDATED (unified for both)
│       │   ├── Amount/Description fields
│       │   ├── Payment Method ← NEW
│       │   ├── Payment Type (Cash/Tempo toggle) ← NEW
│       │   ├── Tempo Details (duration, due date, WhatsApp) ← NEW
│       │   └── Submit Button
│       ├── Educational Modal
│       ├── Toast Notification
│       └── Recent Transactions ← UPDATED (full table with pagination)
```

---

## 🚀 NEXT STEPS AFTER ASSEMBLY

1. **Save** FINAL_PAGE.tsx
2. **Backup** current page.tsx:
   ```bash
   Copy page.tsx → page.BACKUP_BEFORE_TEMPO.tsx
   ```
3. **Replace** page.tsx dengan FINAL_PAGE.tsx:
   ```bash
   Copy FINAL_PAGE.tsx → page.tsx
   ```
4. **Test** di browser:
   - `npm run dev`
   - Buka http://localhost:3000/dashboard/input-income
   - Check console untuk errors
5. **Run** database migrations di Supabase:
   - Execute `sql/create_incomes_table.sql`
   - Execute `sql/add_service_products.sql`
6. **Test** complete flow:
   - Create income with tempo payment
   - Create service income
   - Check transactions table
   - Try print & WhatsApp share
7. **Deploy** ke Vercel:
   ```bash
   npm run build
   vercel --prod
   ```

---

## 📞 NEED HELP?

Jika ada error setelah assembly:
1. Check browser console untuk error messages
2. Check VS Code Problems panel
3. Bandingkan dengan UPDATE_PART files untuk cek missing code
4. Reference dokumentasi di `docs/TEMPO_PAYMENT_IMPLEMENTATION.md`

**Common Issues:**
- Missing import → Check Part 1
- UI not showing → Check Part 2, 3, 5
- Form not submitting → Check Part 4
- Type errors → Check interface Product definition

---

**STATUS:** Ready for manual assembly
**Estimated Time:** 20-30 minutes
**Difficulty:** Medium (careful copy-paste required)
