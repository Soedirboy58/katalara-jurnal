# Supplier Feature Strategy & Roadmap

## Vision
Platform analisis otomatis untuk menemukan supplier termurah dan terlengkap berdasarkan produk yang dijual.

---

## Current State (Nov 2025)
**Database:**
- `suppliers` table: Basic supplier info (name, type, contact)
- `expenses` table: Purchase transactions with `line_items` JSON array
- No product-supplier relationship tracking
- No price history per product per supplier

**Limitations:**
1. Product names are free text (not standardized)
   - "Tepung Terigu" vs "tepung terigu" vs "Terigu" → Cannot match
2. No `product_id` linking across suppliers
3. No price comparison capability
4. Manual supplier "active" status (not auto-calculated)

---

## Future Strategy (3-Phase Approach)

### **Phase 1: Simple KPI (CURRENT - 5 minutes)**
**Objective:** Quick wins with existing data

**Implementation:**
```typescript
KPI Cards:
1. Total Supplier (count) ✓
2. Pembelian Bulan Ini (Rp) → Sum expenses this month
3. Total Hutang (Rp) ✓
4. Hutang Jatuh Tempo (Rp) → Overdue payables count
```

**Benefits:**
- Actionable metrics
- No schema changes needed
- Focus on cash flow management

---

### **Phase 2: Smart Analytics (15-30 minutes)**
**Objective:** Behavioral insights from transaction patterns

**Implementation:**
```typescript
KPI 2: Supplier Favorit (Most Purchased)
- Count: Transaction frequency per supplier (last 30 days)
- Logic: 
  SELECT supplier_id, COUNT(*) as purchase_count
  FROM expenses
  WHERE expense_date >= NOW() - INTERVAL '30 days'
  GROUP BY supplier_id
  ORDER BY purchase_count DESC
  LIMIT 3

KPI 4: Rata-rata Waktu Bayar
- Average days between expense_date and payment_date
- Insight: User payment behavior to suppliers
```

**New Features:**
- "Top 3 Suppliers" badge/highlight
- Transaction frequency chart (monthly trend)
- Payment behavior analytics

---

### **Phase 3: Product-Supplier Intelligence (1-2 hours)**
**Objective:** Price comparison & auto-suggestion system

#### **A. New Database Schema**
```sql
-- Master product-supplier catalog
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price_per_unit DECIMAL(15,2) NOT NULL,
  last_purchase_date TIMESTAMPTZ,
  purchase_count INTEGER DEFAULT 0,
  min_order_qty DECIMAL(10,2) DEFAULT 1,
  lead_time_days INTEGER,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

-- Price history tracking
CREATE TABLE supplier_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id UUID REFERENCES supplier_products(id),
  price_per_unit DECIMAL(15,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expense_id UUID REFERENCES expenses(id)
);

-- Indexes for fast queries
CREATE INDEX idx_supplier_products_price ON supplier_products(product_id, price_per_unit);
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_price_history_date ON supplier_price_history(recorded_at);
```

#### **B. Auto-Populate from Expenses**
```typescript
// Background job: Sync expenses → supplier_products
async function syncSupplierProducts() {
  const expenses = await getExpensesWithLineItems()
  
  for (const expense of expenses) {
    for (const item of expense.line_items) {
      // Try to match product by name (fuzzy matching)
      const product = await findOrCreateProduct(item.product_name)
      
      // Upsert supplier_product
      await upsertSupplierProduct({
        supplier_id: expense.supplier_id,
        product_id: product.id,
        price_per_unit: item.price_per_unit,
        last_purchase_date: expense.expense_date
      })
      
      // Track price history
      await insertPriceHistory({
        supplier_product_id: supplierProduct.id,
        price_per_unit: item.price_per_unit,
        expense_id: expense.id
      })
    }
  }
}
```

#### **C. Smart Features**

**1. Price Comparison Dashboard**
```typescript
// Show cheapest supplier per product
interface ProductComparison {
  product: string
  suppliers: {
    name: string
    price: number
    lastPurchase: Date
    rank: number // 1 = cheapest
  }[]
}

Example output:
┌────────────┬─────────────┬───────────┬──────────┐
│ Produk     │ Supplier    │ Harga     │ Rank     │
├────────────┼─────────────┼───────────┼──────────┤
│ Tepung     │ Supplier B  │ Rp 9.500  │ 🥇 #1    │
│ Tepung     │ Supplier A  │ Rp 10.000 │ 🥈 #2    │
│ Tepung     │ Supplier C  │ Rp 10.500 │ 🥉 #3    │
└────────────┴─────────────┴───────────┴──────────┘
```

**2. Auto-Suggest on Expense Input**
```typescript
// When user adds item "Tepung Terigu":
const suggestions = await getSupplierSuggestions(productId)

Modal shows:
┌─────────────────────────────────────┐
│ 💡 Rekomendasi Supplier             │
├─────────────────────────────────────┤
│ ✓ Supplier B - Rp 9.500 (termurah) │
│   Supplier A - Rp 10.000            │
│   Supplier C - Rp 10.500            │
└─────────────────────────────────────┘
```

**3. Supplier KPI (Advanced)**
```typescript
KPI 2: Supplier Termurah
- Count: Products where this supplier has lowest price
- Badge: "🏆 15 Produk Termurah"

KPI 3: Supplier Terlengkap  
- Count: Unique products available from this supplier
- Badge: "📦 120 Produk Tersedia"

KPI 4: Price Trend
- Chart: Price movement last 3 months
- Alert: "⬆️ Harga naik 15% bulan ini"
```

**4. Smart Alerts**
```typescript
// Notify when better deal available
if (currentSupplierPrice > cheapestSupplierPrice * 1.1) {
  alert({
    type: 'cost_saving',
    message: `💰 Hemat Rp ${saving.toLocaleString()}!
              Supplier ${cheapest.name} lebih murah 
              untuk ${product.name}`,
    action: 'switch_supplier'
  })
}
```

#### **D. Analytics Dashboard**
```typescript
// New page: /dashboard/suppliers/analytics

Features:
1. Product Price Comparison Table (sortable)
2. Supplier Ranking Matrix
3. Cost Savings Opportunity Report
4. Price Trend Charts per Product
5. Bulk Purchase Recommendations
```

---

## Technical Implementation Notes

### Migration Strategy
```sql
-- Step 1: Add product catalog to supplier
ALTER TABLE expenses 
ADD COLUMN processed_for_catalog BOOLEAN DEFAULT false;

-- Step 2: Background job processes old expenses
-- Step 3: Real-time sync for new expenses
```

### Data Quality
```typescript
// Product name normalization
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
}

// Fuzzy matching for product linking
function findSimilarProducts(name: string, threshold = 0.8) {
  // Use Levenshtein distance or Jaro-Winkler
  // Example: "Tepung Terigu" matches "tepung terigu segitiga"
}
```

### Performance
```typescript
// Cache supplier-product prices (Redis)
const CACHE_KEY = `supplier_prices:${productId}`
const TTL = 3600 // 1 hour

// Batch price updates
async function batchUpdatePrices(updates: PriceUpdate[]) {
  // Use bulk insert for better performance
}
```

---

## Success Metrics (Phase 3)

**Business Impact:**
- **Cost Savings**: Track actual savings from switching suppliers
  - Target: 10-15% reduction in purchase costs
- **Time Savings**: Reduce supplier research time
  - Target: 5 minutes → 30 seconds per purchase
- **Better Deals**: Increase % of purchases from cheapest supplier
  - Target: 60%+ purchases at best price

**User Behavior:**
- Supplier comparison usage rate
- Auto-suggestion acceptance rate  
- Price alert engagement rate

**Technical:**
- Product matching accuracy (>90%)
- Price data coverage (>80% of products)
- Query performance (<100ms)

---

## Competitive Advantage

This feature set would make the platform **unique in UMKM space**:
1. **Automated Intelligence**: No manual price tracking needed
2. **Proactive Savings**: Platform actively suggests better deals
3. **Historical Context**: Price trends inform negotiation
4. **Network Effects**: More data = better recommendations

**Similar to:**
- Amazon Business (supplier comparison)
- Google Shopping (price tracking)
- Alibaba (supplier discovery)

But **tailored for Indonesian UMKM** context.

---

## Next Steps

**Phase 1 (Now):**
- [ ] Fix supplier modal blank screen issue
- [ ] Replace "Supplier Aktif" KPI with "Pembelian Bulan Ini"
- [ ] Add "Hutang Jatuh Tempo" KPI

**Phase 2 (Week 2):**
- [ ] Implement "Supplier Favorit" KPI
- [ ] Add transaction frequency analytics
- [ ] Show top 3 suppliers badge

**Phase 3 (Month 2):**
- [ ] Design supplier_products schema
- [ ] Build product matching engine
- [ ] Implement price comparison UI
- [ ] Create auto-suggestion system
- [ ] Build analytics dashboard

---

## Questions for Future Discussion

1. Should we allow manual price catalog entry?
2. How to handle seasonal price variations?
3. Minimum order quantity considerations?
4. Supplier rating/review system?
5. Multi-currency support (import suppliers)?

---

Last updated: November 24, 2025
Status: Strategy documented, Phase 1 in progress
