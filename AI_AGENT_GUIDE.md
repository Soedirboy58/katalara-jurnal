# AI Agent Onboarding Guide

**Target Audience:** AI Agents (GitHub Copilot, etc.) yang akan melanjutkan development platform ini dalam session baru.

---

## 🎯 Quick Start (5 Menit)

### 1. Baca Dokumen Ini Dulu
Anda sedang membacanya. Good! Lanjutkan sampai selesai.

### 2. Pahami Platform Context

**Platform:** Katalara - UMKM Business Management System  
**Tech:** Next.js 16 (Turbopack) + React + TypeScript + Supabase  
**Users:** Indonesian small business owners (UMKM)  
**Language:** UI in Bahasa Indonesia, code/docs in English

### 3. Essential Reading Order

```
📖 Reading Priority (DO NOT SKIP):

1. README.md (root katalara-nextjs/)
   └─ Platform overview, structure, tech stack
   
2. UPDATES/README.md
   └─ Update documentation system explained
   
3. UPDATES/[latest-date]_*.md
   └─ Most recent changes - CRITICAL CONTEXT
   
4. QUICK_REFERENCE.md (if exists)
   └─ Common patterns, shortcuts, gotchas
```

**Time Investment:** 10-15 minutes  
**Payoff:** Avoid breaking existing fixes, understand current state

---

## 🗺️ Platform Mental Model

### High-Level Architecture

```
User (UMKM Owner)
    ↓
Next.js Frontend (katalara-nextjs/)
    ↓
Supabase (PostgreSQL + Auth + Storage)
    ↓
Database Tables:
  - products (with DUAL stock columns ⚠️)
  - transactions
  - transaction_items
  - customers
  - stock_movements
```

### Critical Gotchas 🚨

#### 1. **DUAL STOCK COLUMNS** (Most Important!)

Database has **TWO** stock fields:
- `products.stock` (legacy/canonical)
- `products.stock_quantity` (added by patch)

**Why?** Schema evolved; not all deployments updated consistently.

**Your Responsibility:**
```typescript
// ✅ ALWAYS read stock like this:
const stockQty = product.stock ?? product.stock_quantity ?? 0

// ❌ NEVER assume one field exists:
const stockQty = product.stock  // WRONG! May be null
```

**Read:** [Stock Field Sync Update](../UPDATES/2026-01-08_STOCK_FIELD_SYNCHRONIZATION_FIX.md) for full context.

#### 2. **Ownership Columns** (user_id vs owner_id)

Similar issue: some tables use `user_id`, others `owner_id`, patch adds both.

**Solution:** Always use `COALESCE(user_id, owner_id)` in queries.

#### 3. **Invoice Numbering**

Invoices are **per-user**, not global:
- Format: `INV-2026-0001`
- RPC: `generate_invoice_number(user_id)`
- Uses advisory locks to prevent collisions

#### 4. **Stock Adjustment Flow**

```
User creates Income transaction
  ↓
API: /api/transactions (POST)
  ↓
Pre-check: Ensure stock available (reads stock ?? stock_quantity)
  ↓
RPC: adjust_stock(product_id, -qty)
  └─ Updates stock_quantity
  └─ Returns new_stock
  ↓
Best-effort: Update stock field too (keeps legacy UIs working)
  ↓
Create transaction + transaction_items
```

---

## 📂 Code Organization

### Where to Find Things

| Need | Location |
|------|----------|
| Product list/table UI | `src/components/products/ProductTable.tsx` |
| Income form | `src/app/dashboard/input-income/page.tsx` |
| Income dropdown | `src/modules/finance/components/incomes/LineItemsBuilder.tsx` |
| Expense form | `src/app/dashboard/input-expenses/page.tsx` |
| Expense dropdown | `src/components/expenses/ExpenseItemsTable.tsx` |
| Product hooks | `src/hooks/useProducts.ts` |
| Transaction API | `src/app/api/transactions/route.ts` |
| Type definitions | `src/types/` (database.ts, index.ts, product-schema.ts) |
| DB schema patches | `sql/patches/` |

### Component Patterns

**Products:**
- `ProductsView.tsx` - Main container
- `ProductTable.tsx` - Table view
- `ProductCardView.tsx` - Card/grid view
- `ProductModal.tsx` - Add/edit modal
- `ProductKPICards.tsx` - Dashboard metrics

**Finance:**
- `modules/finance/components/incomes/` - Income-related
- `components/expenses/` - Expense-related
- Autocomplete dropdowns for product selection (Income matches Expense style as of Jan 8)

---

## 🔍 Debugging Workflow

### User Reports Bug

**Step 1:** Identify which screen/flow affected

```
Income → modules/finance/components/incomes/
Expense → components/expenses/
Products → components/products/
Dashboard → components/dashboard/
```

**Step 2:** Search UPDATES folder

```bash
# In VS Code
Ctrl+Shift+F → Search "stock" or keyword in UPDATES/
```

Check if similar issue was fixed before.

**Step 3:** Check Database Schema

```sql
-- In Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';
```

Verify which fields exist.

**Step 4:** Read Related Component

Open the file, look for stock/field getters, verify priority chain.

**Step 5:** Implement Fix

Follow existing patterns (see Common Patterns below).

**Step 6:** Document

Create new file in `UPDATES/` following template, update README.md changelog.

---

## 🛠️ Common Patterns

### 1. Stock Getter (Use This Everywhere)

```typescript
function getStockQty(product: Product): number {
  const qty = (product as any).stock 
    ?? (product as any).stock_quantity 
    ?? (product as any).current_stock
    ?? (product as any).quantity 
    ?? 0
  
  const asNum = typeof qty === 'string' ? Number(qty) : qty
  return Number.isFinite(asNum) ? asNum : 0
}
```

**Why `as any`?** Because database types may not include all fields depending on schema version.

### 2. Supabase Query Pattern

```typescript
const { data, error } = await supabase
  .from('products')
  .select('id, name, stock, stock_quantity, selling_price')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Supabase error:', error)
  return { success: false, error: error.message }
}

return { success: true, data }
```

**Always:**
- Destructure `{ data, error }`
- Check `if (error)` before using `data`
- Log errors to console
- Return consistent format `{ success: boolean, error?: string, data?: T }`

### 3. Stock Adjustment via RPC

```typescript
const { data, error } = await supabase.rpc('adjust_stock', {
  p_product_id: productId,
  p_quantity_change: -5, // Negative for deduction
  p_notes: 'Sold via transaction'
})

if (error || !data || typeof data !== 'object' || !(data as any).success) {
  return { ok: false, error: data?.message || error?.message || 'Stock adjustment failed' }
}

// Best-effort: sync legacy stock field
if ((data as any).new_stock !== undefined) {
  const newStock = Number((data as any).new_stock)
  if (Number.isFinite(newStock) && newStock >= 0) {
    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
  }
}

return { ok: true }
```

**Pattern Breakdown:**
1. Call RPC with params
2. Check for errors (RPC can return `{success: false}` in data too)
3. Extract `new_stock` from response
4. Best-effort update `stock` field for legacy UIs
5. Return consistent result

### 4. Currency Formatting

```typescript
import { formatCurrency } from '@/utils/helpers'

const formatted = formatCurrency(12500) // "Rp 12.500"
```

Always use helper, don't format manually.

### 5. Number Formatting

```typescript
import { formatNumber } from '@/utils/helpers'

const formatted = formatNumber(1000) // "1.000"
```

Indonesian locale uses `.` for thousands separator.

---

## 🎨 UI Patterns

### Autocomplete Dropdown (Income/Expense)

```tsx
const [searchQuery, setSearchQuery] = useState('')
const [isDropdownOpen, setIsDropdownOpen] = useState(false)
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

// Filter products
const filtered = products.filter(p =>
  p.name.toLowerCase().includes(searchQuery.toLowerCase())
)

return (
  <div className="relative">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value)
        setIsDropdownOpen(true)
        setSelectedProduct(null) // Clear on typing
      }}
      onFocus={() => setIsDropdownOpen(true)}
      placeholder="Cari produk..."
    />
    
    {isDropdownOpen && (
      <div className="absolute dropdown-list">
        {filtered.map(product => (
          <button
            key={product.id}
            onClick={() => {
              setSelectedProduct(product)
              setSearchQuery(product.name)
              setIsDropdownOpen(false)
            }}
          >
            <div>{product.name}</div>
            <div className="text-sm text-gray-500">
              {product.unit} • Stok: {getStockQty(product)} • Harga: {formatCurrency(product.selling_price)}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
)
```

**Key Features:**
- Search as you type
- Clear selection when typing
- Show unit, stock, price in dropdown
- Close on selection
- Outside click handling (add ref + useEffect)

---

## 📊 Database Patterns

### Fetching User's Products

```typescript
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    name,
    sku,
    category,
    unit,
    stock,
    stock_quantity,
    selling_price,
    cost_price,
    min_stock_alert,
    track_inventory,
    is_active,
    created_at
  `)
  .eq('user_id', userId)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

**Always select both `stock` and `stock_quantity`** to support all schema versions.

### Creating Transaction with Items

```typescript
// 1. Generate invoice
const { data: invoiceNum } = await supabase.rpc('generate_invoice_number', {
  p_user_id: userId
})

// 2. Create transaction
const { data: transaction, error: txError } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    invoice_number: invoiceNum,
    customer_name: formData.customerName,
    payment_type: formData.paymentType,
    subtotal: calculatedSubtotal,
    total: calculatedTotal,
    // ... other fields
  })
  .select()
  .single()

// 3. Create transaction items
const { error: itemsError } = await supabase
  .from('transaction_items')
  .insert(
    items.map(item => ({
      transaction_id: transaction.id,
      product_id: item.productId,
      product_name: item.productName,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      subtotal: item.subtotal
    }))
  )

// 4. Adjust stock for each item
for (const item of items) {
  await adjustStockSafe(item.productId, -item.qty)
}
```

**Important:** Use `.single()` when expecting one row, `.select()` to get inserted data.

---

## 🚨 Common Pitfalls

### 1. Forgetting to Check Both Stock Fields

```typescript
// ❌ BAD
if (product.stock_quantity < qty) {
  return 'Insufficient stock'
}

// ✅ GOOD
const availableStock = product.stock ?? product.stock_quantity ?? 0
if (availableStock < qty) {
  return 'Insufficient stock'
}
```

### 2. Not Handling Null in Supabase Responses

```typescript
// ❌ BAD
const products = data.map(p => p.name)

// ✅ GOOD
const products = (data || []).map(p => p.name)
```

### 3. Direct Field Access Without Type Guard

```typescript
// ❌ BAD
const cost = product.cost_price

// ✅ GOOD
const cost = (product as any).cost_price ?? (product as any).buy_price ?? 0
```

**Why?** Different schema versions have different field names.

### 4. Not Using Defensive Number Parsing

```typescript
// ❌ BAD
const total = Number(product.price)

// ✅ GOOD
const price = typeof product.price === 'string' ? Number(product.price) : product.price
const total = Number.isFinite(price) ? price : 0
```

### 5. Forgetting to Update Documentation

After fixing a bug:
1. Create file in `UPDATES/`
2. Update `README.md` changelog
3. If pattern changes, update this guide

**Don't skip!** Future AI agents depend on this.

---

## 🎯 Key Takeaways (TL;DR)

### Must-Know Facts

1. **Database has dual stock columns** - always use `stock ?? stock_quantity ?? 0`
2. **RPC `adjust_stock`** only updates `stock_quantity`, need manual sync to `stock`
3. **Invoice numbers are per-user**, not global
4. **Generated types may not match actual schema** - use `as any` defensively
5. **Always document changes** in UPDATES/ folder

### Must-Read Files Before Coding

- `README.md` (this is non-negotiable)
- `UPDATES/README.md`
- Latest update file in `UPDATES/`
- Relevant component files for your task

### Must-Follow Patterns

- Stock getter with full fallback chain
- Supabase error handling (`if (error)`)
- Currency/number formatting via helpers
- Consistent API response format `{ success, error?, data? }`

---

## 🔗 Quick Links

| Resource | Path |
|----------|------|
| Main README | `katalara-nextjs/README.md` |
| Update Docs | `katalara-nextjs/UPDATES/` |
| Stock Fix (Latest) | `katalara-nextjs/UPDATES/2026-01-08_STOCK_FIELD_SYNCHRONIZATION_FIX.md` |
| Product Types | `src/types/product-schema.ts` |
| Database Types | `src/types/database.ts` |
| Product Hooks | `src/hooks/useProducts.ts` |
| Transaction API | `src/app/api/transactions/route.ts` |

---

## 🤝 Working with Users

### User Communication Style

- **Language:** Bahasa Indonesia (informal, friendly)
- **Terms:** Use local terms (e.g., "UMKM", "Rp", "stok", "pelanggan")
- **Tone:** Helpful, patient, practical

### When User Reports Bug

1. **Clarify:** Ask for specific screen/flow affected
2. **Reproduce:** Try to understand exact steps
3. **Check history:** Search UPDATES/ for similar issues
4. **Explain:** Tell user what you found and plan to fix
5. **Fix:** Implement solution following existing patterns
6. **Verify:** Ask user to confirm fix works
7. **Document:** Create update file with full context

### Example Response Template

```
Saya sudah cek issue-nya. Masalahnya ada di [component name] karena [root cause].

Saya akan:
1. [Action 1]
2. [Action 2]
3. [Action 3]

Tunggu sebentar, saya implementasikan dulu...

[implement fixes]

✅ Sudah selesai! Sekarang [describe expected behavior]. 
Silakan coba lagi dan beri tahu kalau masih ada masalah.
```

---

## 📞 Need Help?

### Stuck on Something?

**Ask yourself:**

1. Did I read the latest update docs?
2. Did I check if similar issue was fixed before?
3. Did I follow the common patterns?
4. Did I handle the dual stock column issue?
5. Did I test my changes (npm run build)?

**Still stuck?**

- Search codebase for similar implementations
- Read related files in `src/types/` for type definitions
- Check Supabase dashboard for actual database schema
- Look at git history (if available) for context

---

## ✅ Pre-Coding Checklist

Before writing ANY code:

- [ ] Read README.md
- [ ] Read UPDATES/README.md  
- [ ] Read latest update file in UPDATES/
- [ ] Understand task requirements clearly
- [ ] Know which files to modify
- [ ] Checked for similar existing implementations
- [ ] Planned approach with user (if complex)

After coding:

- [ ] npm run build (passes without errors)
- [ ] Manual testing of affected features
- [ ] Created update documentation file
- [ ] Updated README.md changelog
- [ ] Committed changes (if using git)

---

**Remember:** Documentation is not optional. Future AI agents (including yourself in next session) will thank you for thorough docs. Take the extra 5-10 minutes to document properly—it saves hours later.

---

**Welcome to Katalara Platform development! 🚀**

You're now equipped to continue development. Focus on understanding the stock field pattern first—it's the most common source of bugs. Good luck!

---

**Last Updated:** 8 Januari 2026  
**For:** AI Agents (GitHub Copilot, Claude, etc.)  
**Platform Version:** 1.0-beta
