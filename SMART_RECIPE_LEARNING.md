# 🧠 Smart Recipe Learning System - AI yang Belajar dari Kebiasaan User

## 🎯 Problem dengan Pendekatan Tradisional

### ❌ Cara Lama (Rumit):
```
1. User harus define detail resep dulu:
   - Nasi Goreng = 200g beras + 1 telur + 100g ayam + ...
   - Hitung manual per bahan
   
2. User harus input pembelian per item:
   - Beras 5kg = Rp 60.000
   - Telur 2kg = Rp 40.000
   - ... (capek!)

MASALAH: User UMKM males ribet, butuh cara cepat!
```

### ✅ Cara Baru (Smart & Simple):

```
1. User belanja sekali jalan di pasar:
   Total: Rp 500.000
   Dapat: Beras 5kg, telur 2kg, mie 4 bungkus, bumbu-bumbu

2. Sistem tanya:
   "Belanjaan ini untuk produksi berapa porsi?"
   → Nasi Goreng: 70 porsi
   → Mie Goreng: 30 porsi

3. Sistem OTOMATIS BELAJAR & HITUNG:
   ✅ Cost per porsi Nasi Goreng = Rp 500k × (70/100) = Rp 3.500
   ✅ Cost per porsi Mie Goreng = Rp 500k × (30/100) = Rp 5.000
   ✅ Auto update harga pokok per menu
   ✅ Track margin profit real

4. Setelah 3-5x input, sistem makin pintar:
   "Biasanya Rp 500k → 70 Nasi Goreng + 30 Mie Goreng"
   "Suggest restock: Beli lagi Rp 500k untuk produksi 3 hari"
```

---

## 🚀 Implementation Design

### Phase 1: Batch Purchase Input (Super Simple!)

#### UI Flow:

```typescript
// Screen: Input Pengeluaran Bahan Baku

┌─────────────────────────────────────────┐
│  📦 Belanja Bahan Baku                  │
├─────────────────────────────────────────┤
│                                         │
│  Total Belanja: Rp [500.000]           │
│                                         │
│  📸 Upload Foto Nota (Optional)         │
│  [Browse...]                            │
│                                         │
│  📝 Catatan Belanja:                    │
│  ┌─────────────────────────────────┐   │
│  │ Beli di pasar pagi:             │   │
│  │ - Beras 5kg                     │   │
│  │ - Telur 2kg                     │   │
│  │ - Mie kriting 4 bungkus         │   │
│  │ - Bumbu-bumbu                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ❓ Belanjaan ini untuk produksi:       │
│                                         │
│  ┌─ Nasi Goreng ────────────────────┐  │
│  │ Jumlah Porsi: [70] porsi        │  │
│  │ Est. Cost/porsi: Rp 3.500 🤖    │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─ Mie Goreng ─────────────────────┐  │
│  │ Jumlah Porsi: [30] porsi        │  │
│  │ Est. Cost/porsi: Rp 5.000 🤖    │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [+ Tambah Produk Lain]                │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Total Produksi: 100 porsi             │
│  Avg Cost/porsi: Rp 5.000              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│  [Simpan & Pelajari] 🧠                │
└─────────────────────────────────────────┘
```

---

### Database Schema Update:

```sql
-- New table: batch_purchases (belanja batch)
CREATE TABLE batch_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Purchase info
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(15, 2) NOT NULL,
  vendor_name TEXT, -- nama pasar/supplier
  notes TEXT, -- catatan belanjaan
  receipt_photo_url TEXT, -- foto nota
  
  -- Learning data
  total_portions_produced INTEGER, -- total porsi dari semua produk
  is_learned BOOLEAN DEFAULT false, -- sudah dipelajari sistem
  confidence_score DECIMAL(5, 2) DEFAULT 0, -- 0-100, makin sering makin tinggi
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New table: batch_purchase_outputs (output dari belanja batch)
CREATE TABLE batch_purchase_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_purchase_id UUID NOT NULL REFERENCES batch_purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Output info
  portions_produced INTEGER NOT NULL, -- berapa porsi dihasilkan
  cost_per_portion DECIMAL(15, 2), -- otomatis hitung
  portion_percentage DECIMAL(5, 2), -- % dari total belanja
  
  -- Actual sales tracking (untuk validasi)
  actual_portions_sold INTEGER DEFAULT 0,
  waste_portions INTEGER DEFAULT 0, -- sisa yang tidak terjual
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batch_purchases_user ON batch_purchases(user_id);
CREATE INDEX idx_batch_purchases_date ON batch_purchases(purchase_date);
CREATE INDEX idx_batch_outputs_batch ON batch_purchase_outputs(batch_purchase_id);
CREATE INDEX idx_batch_outputs_product ON batch_purchase_outputs(product_id);

-- RLS
ALTER TABLE batch_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_purchase_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own batch purchases" ON batch_purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own batch outputs" ON batch_purchase_outputs FOR ALL USING (
  EXISTS (SELECT 1 FROM batch_purchases WHERE id = batch_purchase_outputs.batch_purchase_id AND user_id = auth.uid())
);
```

---

### Smart Calculation Logic:

```typescript
// Function: calculateCostPerPortion()

interface BatchInput {
  totalAmount: number // Rp 500.000
  outputs: {
    productId: string
    productName: string
    portions: number // 70, 30
  }[]
}

function calculateCostPerPortion(input: BatchInput) {
  // 1. Hitung total porsi
  const totalPortions = input.outputs.reduce((sum, o) => sum + o.portions, 0)
  // Total: 70 + 30 = 100 porsi
  
  // 2. Hitung percentage per produk
  const results = input.outputs.map(output => {
    const percentage = (output.portions / totalPortions) * 100
    // Nasi Goreng: 70/100 = 70%
    // Mie Goreng: 30/100 = 30%
    
    const costPerPortion = (input.totalAmount * percentage) / 100 / output.portions
    // Nasi Goreng: (500k × 0.7) / 70 = Rp 5.000
    // Mie Goreng: (500k × 0.3) / 30 = Rp 5.000
    
    // Atau lebih sederhana:
    const simpleCostPerPortion = input.totalAmount / totalPortions
    // 500k / 100 = Rp 5.000 per porsi (rata-rata)
    
    return {
      productId: output.productId,
      productName: output.productName,
      portions: output.portions,
      percentage: percentage,
      costPerPortion: simpleCostPerPortion, // atau weighted cost
      totalCostForProduct: simpleCostPerPortion * output.portions
    }
  })
  
  return results
}

// Example result:
// [
//   { 
//     productName: "Nasi Goreng", 
//     portions: 70, 
//     percentage: 70,
//     costPerPortion: 5000, 
//     totalCostForProduct: 350000 
//   },
//   { 
//     productName: "Mie Goreng", 
//     portions: 30, 
//     percentage: 30,
//     costPerPortion: 5000, 
//     totalCostForProduct: 150000 
//   }
// ]
```

---

### Phase 2: Smart Learning & Pattern Recognition

#### Setelah 3-5x input, sistem belajar pattern:

```typescript
// Machine Learning Logic (Simple)

interface HistoricalData {
  purchases: {
    totalAmount: number
    outputs: { productId: string, portions: number }[]
    date: Date
  }[]
}

function learnPattern(data: HistoricalData) {
  // 1. Group by similar purchase amounts
  const grouped = groupBySimilarAmount(data.purchases, 0.1) // tolerance 10%
  
  // 2. Calculate averages
  const pattern = grouped.map(group => {
    const avgAmount = average(group.map(p => p.totalAmount))
    const avgOutputs = calculateAvgOutputs(group)
    
    return {
      typicalPurchase: avgAmount, // ~Rp 500k
      expectedOutputs: avgOutputs,
      // [{ productId: 'xxx', avgPortions: 68 }, { productId: 'yyy', avgPortions: 32 }]
      confidence: calculateConfidence(group.length), // 0-100%
      sampleSize: group.length
    }
  })
  
  return pattern
}

// 3. Smart Suggestions
function suggestNextPurchase(userId: string) {
  const patterns = learnPattern(getHistoricalData(userId))
  const mostCommon = patterns.sort((a, b) => b.confidence - a.confidence)[0]
  
  return {
    suggestedAmount: mostCommon.typicalPurchase,
    expectedOutputs: mostCommon.expectedOutputs,
    message: `Biasanya Rp ${formatCurrency(mostCommon.typicalPurchase)} menghasilkan:
      - ${mostCommon.expectedOutputs[0].productName}: ${mostCommon.expectedOutputs[0].avgPortions} porsi
      - ${mostCommon.expectedOutputs[1].productName}: ${mostCommon.expectedOutputs[1].avgPortions} porsi
    `,
    confidence: `${mostCommon.confidence}% (dari ${mostCommon.sampleSize} data belanja)`
  }
}
```

---

### Phase 3: Auto-Adjust & Refinement

#### Sistem auto-update cost berdasarkan aktual penjualan:

```typescript
// Validation & Adjustment Logic

async function validateAndAdjust(batchPurchaseId: string) {
  // 1. Get batch data
  const batch = await getBatchPurchase(batchPurchaseId)
  const outputs = await getBatchOutputs(batchPurchaseId)
  
  // 2. Check actual sales vs expected
  outputs.forEach(async output => {
    const actualSold = await getActualSales(output.productId, batch.purchaseDate)
    
    if (actualSold !== output.portions) {
      // Ada selisih! Adjust cost
      const waste = output.portions - actualSold
      const adjustedCost = (output.costPerPortion * output.portions) / actualSold
      
      // Update product buy_price untuk cost yang lebih akurat
      await updateProductCost(output.productId, adjustedCost)
      
      // Log waste untuk analytics
      await logWaste({
        productId: output.productId,
        plannedPortions: output.portions,
        actualSold: actualSold,
        waste: waste,
        wasteValue: waste * output.costPerPortion,
        date: batch.purchaseDate
      })
    }
  })
}

// Example:
// Belanja Rp 500k → expect 70 Nasi Goreng
// Aktual terjual: 65 porsi
// Sisa: 5 porsi (waste)
// Adjusted cost: (Rp 5000 × 70) / 65 = Rp 5.385 per porsi
// Profit margin turun karena waste
```

---

### Phase 4: Advanced Features

#### A. **Smart Restock Alert**

```typescript
// UI: Dashboard Alert

┌─────────────────────────────────────────┐
│  ⚠️ Waktu Restock Bahan!                │
├─────────────────────────────────────────┤
│  Berdasarkan pola belanja Anda:        │
│                                         │
│  📊 Rata-rata produksi:                 │
│     - 70 porsi Nasi Goreng / belanja   │
│     - 30 porsi Mie Goreng / belanja    │
│                                         │
│  📈 Penjualan 7 hari terakhir:          │
│     - Nasi Goreng: 180 porsi           │
│     - Mie Goreng: 90 porsi             │
│                                         │
│  💡 Rekomendasi:                        │
│     Belanja Rp 1.500.000 untuk:        │
│     - 210 porsi Nasi Goreng (3 hari)   │
│     - 90 porsi Mie Goreng (3 hari)     │
│                                         │
│  [Catat Belanja Sekarang]              │
└─────────────────────────────────────────┘
```

#### B. **Price Fluctuation Tracking**

```sql
-- Track harga pasar berubah
CREATE TABLE market_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  typical_output INTEGER NOT NULL, -- total porsi normal
  
  cost_per_portion DECIMAL(15, 2) NOT NULL,
  price_change_pct DECIMAL(5, 2), -- % vs avg
  
  notes TEXT -- "Harga telur naik", "Promo beras"
);

-- Chart: Trend Harga Bahan Baku
// Show line chart: cost per porsi over time
// Alert jika harga naik > 20%: "Harga bahan naik! Pertimbangkan naikin harga jual"
```

#### C. **Waste Analytics**

```typescript
// Dashboard: Waste Report

┌─────────────────────────────────────────┐
│  🗑️ Laporan Sisa Produk (Waste)         │
├─────────────────────────────────────────┤
│  Bulan ini:                             │
│                                         │
│  Nasi Goreng:                           │
│  ├─ Produksi: 500 porsi                │
│  ├─ Terjual: 470 porsi                 │
│  └─ Sisa: 30 porsi (6%) ❌             │
│     Nilai: Rp 150.000                  │
│                                         │
│  Mie Goreng:                            │
│  ├─ Produksi: 200 porsi                │
│  ├─ Terjual: 195 porsi                 │
│  └─ Sisa: 5 porsi (2.5%) ✅            │
│     Nilai: Rp 25.000                   │
│                                         │
│  💡 Tips:                               │
│     Kurangi produksi Nasi Goreng       │
│     menjadi 450 porsi untuk            │
│     mengurangi waste 6% → 2%           │
│                                         │
│  Total Waste Value: Rp 175.000         │
│  Potential Profit Loss: Rp 350.000     │
└─────────────────────────────────────────┘
```

---

## 🎯 User Journey (Real Case)

### Day 1: Warung Nasi Goreng Baru Buka

**User:** Bu Siti (owner warung)

**Action:**
```
1. Belanja pagi di pasar: Rp 500.000
2. Buka app → Input Pengeluaran
3. Isi: Total Rp 500k, upload foto nota
4. Sistem tanya: "Mau produksi apa?"
   - Nasi Goreng: 70 porsi
   - Mie Goreng: 30 porsi
5. Klik "Simpan & Pelajari"
```

**Sistem:**
```
✅ Catat pengeluaran: Rp 500k
✅ Hitung cost: Rp 5k per porsi
✅ Set buy_price produk otomatis
✅ Simpan pattern #1 (confidence: 20%)
```

---

### Day 5: Sudah 3x Belanja

**User:** Bu Siti belanja lagi Rp 500k

**Sistem (Smart Suggestion):**
```
💡 Biasanya Rp 500k menghasilkan:
   - Nasi Goreng: 68 porsi (avg dari 3x data)
   - Mie Goreng: 32 porsi
   
Auto-fill? [Ya] [Edit Manual]
```

**User:** Klik "Ya" → Langsung selesai! (3 detik)

**Sistem:**
```
✅ Confidence naik: 60%
✅ Pattern makin akurat
✅ Cost per porsi: Rp 4.950 (average)
```

---

### Week 2: Sistem Makin Pintar

**Dashboard Alert:**
```
📊 Insight:
- Harga bahan naik 10% minggu ini
- Cost per porsi sekarang: Rp 5.500 (was Rp 5.000)
- Margin profit turun: 68% → 60%

💡 Rekomendasi:
[ ] Naikin harga jual Rp 13k → Rp 14k
[ ] Kurangi porsi sedikit (maintain margin)
[ ] Cari supplier lebih murah
```

---

## 🚀 Implementation Priority

### MVP (Week 1-2):
- [ ] UI: Simple batch purchase input
- [ ] Calculate cost per portion (simple average)
- [ ] Save to batch_purchases table
- [ ] Update product buy_price otomatis

### Phase 2 (Week 3-4):
- [ ] Pattern learning (after 3+ inputs)
- [ ] Smart suggestions
- [ ] Confidence scoring

### Phase 3 (Month 2):
- [ ] Waste tracking
- [ ] Actual vs expected validation
- [ ] Auto-adjust cost

### Phase 4 (Month 3):
- [ ] Price trend analytics
- [ ] Restock recommendations
- [ ] Market price alerts

---

## ✅ Advantages vs Traditional Recipe System

| Feature | Traditional Recipe | Batch Learning |
|---------|-------------------|----------------|
| **Setup Time** | 30 min per product | 2 min total |
| **Accuracy** | Depends on manual input | Improves over time |
| **User Effort** | High (detail entry) | Low (just totals) |
| **Adaptability** | Manual update needed | Auto-adjust |
| **Learning Curve** | Steep | Flat |
| **Real-world Fit** | Poor (too theoretical) | Excellent (actual data) |

---

## 📌 Next Steps

1. **Create SQL migration** untuk batch_purchases tables
2. **Build UI component** BatchPurchaseInput.tsx
3. **Implement calculation logic** di API
4. **Test dengan real user** (Bu Siti!)
5. **Iterate based on feedback**

Sistem ini **10x lebih mudah** untuk UMKM karena sesuai dengan cara mereka bekerja! 🎉
