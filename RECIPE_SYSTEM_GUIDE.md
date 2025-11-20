# 🍳 Sistem Resep & Auto Sinkronisasi Stok

## Masalah yang Diselesaikan

**Sebelum:**
- User beli bahan baku (beras, telur, ayam) → input manual
- User jual produk jadi (Nasi Goreng) → stok bahan TIDAK berkurang otomatis
- User harus tracking manual berapa bahan terpakai
- Kalkulasi margin sulit karena cost bahan tersebar

**Sesudah:**
- User define RESEP untuk setiap produk jadi
- Input pembelian bahan baku → stok bahan bertambah otomatis
- Input penjualan produk jadi → stok SEMUA bahan berkurang otomatis sesuai resep
- Cost produk jadi dihitung otomatis dari total cost bahan
- Margin profit akurat

---

## Cara Kerja Sistem

### 1. **Setup Produk**

#### A. Buat Produk Bahan Baku
```
Contoh bahan baku:
- Beras (1 kg) - Rp 12.000 - Flag: ✅ Bahan Baku
- Telur (1 butir) - Rp 2.000 - Flag: ✅ Bahan Baku
- Ayam Potong (100g) - Rp 5.000 - Flag: ✅ Bahan Baku
- Kecap (100ml) - Rp 3.000 - Flag: ✅ Bahan Baku
```

#### B. Buat Produk Jadi
```
Contoh produk jadi:
- Nasi Goreng (1 porsi) - Harga Jual: Rp 25.000 - Flag: ✅ Punya Resep
```

---

### 2. **Define Resep (Recipe)**

Untuk produk "Nasi Goreng", tentukan bahan-bahan:

| Bahan | Qty per Porsi | Unit | Cost per Porsi |
|-------|---------------|------|----------------|
| Beras | 200 | gram | Rp 2.400 |
| Telur | 1 | butir | Rp 2.000 |
| Ayam Potong | 100 | gram | Rp 5.000 |
| Kecap | 20 | ml | Rp 600 |
| **TOTAL COST** | | | **Rp 10.000** |

**Margin Profit:** Rp 25.000 - Rp 10.000 = **Rp 15.000 (60%)**

---

### 3. **Workflow Otomatis**

#### Scenario A: Input Pembelian Bahan Baku

**User Action:**
```
Input Pengeluaran:
- Beli Beras 10kg @ Rp 12.000/kg = Rp 120.000
- Beli Telur 30 butir @ Rp 2.000 = Rp 60.000
```

**System Action:**
- ✅ Stok Beras bertambah: +10 kg
- ✅ Stok Telur bertambah: +30 butir
- ✅ Expense tercatat: Rp 180.000
- ✅ Kategori: Bahan Baku

---

#### Scenario B: Input Penjualan Produk Jadi

**User Action:**
```
Input Penjualan:
- Jual Nasi Goreng: 5 porsi @ Rp 25.000 = Rp 125.000
```

**System Action (AUTO):**
- ✅ Stok Nasi Goreng: +5 porsi (jika track inventory)
- ✅ Revenue tercatat: Rp 125.000
- ✅ **AUTO DEDUCT BAHAN:**
  - Beras: -1 kg (5 porsi × 200g)
  - Telur: -5 butir (5 porsi × 1 butir)
  - Ayam: -500g (5 porsi × 100g)
  - Kecap: -100ml (5 porsi × 20ml)
- ✅ Cost tercatat: Rp 50.000 (5 × Rp 10.000)
- ✅ Profit tercatat: Rp 75.000

---

#### Scenario C: Alert Low Stock

**System Monitor:**
```
⚠️ ALERT: Bahan baku rendah!
- Beras: 2kg tersisa (butuh restock)
- Telur: 8 butir tersisa (butuh restock)
```

**Recommendation:**
```
💡 Berdasarkan rata-rata penjualan 20 porsi/hari:
- Restock Beras: 5kg (cukup untuk 25 porsi)
- Restock Telur: 30 butir (cukup untuk 30 porsi)
- Estimasi cost: Rp 120.000
```

---

## Fitur-Fitur

### ✅ Recipe Builder
- UI drag & drop untuk tambah/hapus bahan
- Auto calculate total cost
- Show profit margin real-time
- Duplicate recipe untuk varian produk

### ✅ Smart Input Pengeluaran
- Deteksi otomatis: bahan baku vs operational expense
- Auto-link ke produk bahan baku (jika ada)
- Batch input: beli multiple bahan sekaligus
- Upload foto nota (optional)

### ✅ Smart Input Penjualan
- Show real-time stok bahan tersedia
- Warning jika bahan kurang untuk bikin produk
- Auto suggest quantity based on stok bahan
- Show profit margin per item

### ✅ Analytics Dashboard
- **Cost Breakdown:** Pie chart cost per bahan
- **Popular Ingredients:** Top 5 bahan paling banyak terpakai
- **Profitability:** Produk mana yang paling profitable
- **Waste Tracking:** Bahan yang beli tapi jarang terpakai

### ✅ Inventory Forecasting
- Prediksi stok bahan akan habis kapan
- Recommend restock berapa kg/liter
- Calculate optimal purchase quantity
- Price alert: beli saat harga turun

---

## Database Schema

### Table: `product_recipes`
```sql
- id (UUID)
- user_id (UUID) → auth.users
- finished_product_id (UUID) → products (Nasi Goreng)
- ingredient_product_id (UUID) → products (Beras)
- quantity_needed (DECIMAL) → 200
- unit (TEXT) → "gram"
- notes (TEXT) → "Beras premium"
- created_at
- updated_at
```

### Extended `products` table:
```sql
+ is_raw_material (BOOLEAN) → true untuk bahan baku
+ has_recipe (BOOLEAN) → true untuk produk jadi yang punya resep
+ auto_deduct_ingredients (BOOLEAN) → auto kurangi stok bahan saat jual
```

---

## API Endpoints (Next Steps)

### GET `/api/products/:id/recipe`
Response:
```json
{
  "product_id": "uuid",
  "product_name": "Nasi Goreng",
  "sell_price": 25000,
  "ingredients": [
    {
      "ingredient_id": "uuid",
      "ingredient_name": "Beras",
      "quantity_needed": 200,
      "unit": "gram",
      "cost_per_unit": 12,
      "total_cost": 2400,
      "current_stock": 5000
    }
  ],
  "total_ingredient_cost": 10000,
  "profit_margin": 15000,
  "profit_percentage": 60
}
```

### POST `/api/products/:id/recipe`
Request:
```json
{
  "ingredients": [
    {
      "ingredient_product_id": "uuid",
      "quantity_needed": 200,
      "unit": "gram"
    }
  ]
}
```

### POST `/api/transactions/sell`
Request:
```json
{
  "items": [
    {
      "product_id": "uuid-nasi-goreng",
      "quantity": 5,
      "auto_deduct": true  // ← Flag untuk trigger auto deduct
    }
  ],
  "payment_method": "cash"
}
```

Response:
```json
{
  "transaction_id": "uuid",
  "total": 125000,
  "cost": 50000,
  "profit": 75000,
  "ingredients_deducted": [
    { "name": "Beras", "qty_deducted": 1, "unit": "kg" },
    { "name": "Telur", "qty_deducted": 5, "unit": "butir" }
  ]
}
```

---

## Implementation Priority

### Phase 1 (MVP): ✅ Database Schema
- [x] Create `product_recipes` table
- [x] Add flags to `products` table
- [x] Setup RLS policies
- [ ] Run migration di Supabase

### Phase 2: Recipe Builder UI
- [ ] Component: RecipeBuilder.tsx
- [ ] Component: IngredientSelector.tsx
- [ ] Hook: useRecipe.ts
- [ ] API: CRUD recipe endpoints

### Phase 3: Smart Input Integration
- [ ] Update Input Sales dengan recipe checking
- [ ] Update Input Expenses dengan auto-link
- [ ] Add stock availability warnings
- [ ] Transaction hooks untuk auto-deduct

### Phase 4: Analytics & Reports
- [ ] Cost breakdown charts
- [ ] Profitability analysis
- [ ] Inventory forecasting
- [ ] Restock recommendations

---

## User Flow Example

### Skenario Lengkap: Warung Nasi Goreng

**Day 1 - Setup:**
1. User bikin produk bahan: Beras, Telur, Ayam, Kecap (flag as Bahan Baku)
2. User bikin produk jadi: Nasi Goreng (flag as Punya Resep)
3. User buka Recipe Builder, define resep Nasi Goreng
4. System calculate: cost Rp 10k, margin 60%

**Day 2 - Restock:**
1. User beli bahan: Input Pengeluaran
   - Beras 10kg, Telur 50 butir
2. System auto update stok semua bahan

**Day 3-10 - Operasional:**
1. Customer pesan 3 Nasi Goreng
2. User input penjualan: 3 porsi
3. System:
   - Check stok bahan (cukup ✅)
   - Revenue +Rp 75k
   - Auto deduct bahan (Beras -600g, Telur -3, dll)
   - Profit +Rp 45k
4. Dashboard update real-time

**Day 11 - Alert:**
1. System: "⚠️ Beras tinggal 1kg, restock?"
2. User: "OK, beli 10kg lagi"
3. Cycle repeat

---

## Benefits

✅ **Efisiensi:** 1x input → semua update otomatis  
✅ **Akurasi:** Cost & profit calculation presisi  
✅ **Kontrol:** Tracking stok bahan real-time  
✅ **Insight:** Tahu produk mana yang paling untung  
✅ **Forecasting:** Prediksi kapan perlu restock  
✅ **Skalabilitas:** Bisa untuk ratusan produk & resep  

---

## Next Actions

1. **Run SQL Migration:**
   - Jalankan `create_recipe_system.sql` di Supabase SQL Editor

2. **Test Data:**
   - Insert sample products (bahan baku + produk jadi)
   - Create sample recipe

3. **Build UI:**
   - Recipe Builder component
   - Integration dengan existing Input Sales/Expenses

4. **Deploy & Test:**
   - User testing dengan real scenario
   - Iterate based on feedback
