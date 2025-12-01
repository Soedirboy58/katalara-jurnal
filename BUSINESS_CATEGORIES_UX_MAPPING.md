# 🎯 KATEGORI BISNIS UX-FRIENDLY - MAPPING DOCUMENTATION

**Tanggal**: 26 November 2024  
**Tujuan**: Redesign kategori bisnis untuk UMKM pemula  
**Strategi**: ADDITIVE ONLY - Tidak merusak struktur existing  
**Compliance**: ✅ 100% ADDITIVE, No Destructive Changes

---

## 📊 KATEGORI UI vs BACKEND MAPPING

### 1. **Makanan & Minuman** 🍴

**UI Label**: `Makanan & Minuman`  
**Backend Key**: `makanan_minuman`

**System Mapping**:
- `business_mode`: `hybrid` (Produk + Layanan)
- `inventory_enabled`: `true` ✅
- `has_stock`: `true` ✅

**Target User**:
- Warung makan
- Cafe & coffee shop
- Katering
- Bakery & toko roti
- Kedai kopi & minuman
- UMKM kuliner

**Fitur yang Di-enable**:
- ✅ Inventory Management (stok bahan baku)
- ✅ Stock Tracking (bahan masak, minuman)
- ✅ Income Module (penjualan)
- ✅ Expense Module (pembelian bahan)
- ✅ Product Management (menu items)

**Contoh Bisnis**:
- Warung Nasi Ibu Siti
- Cafe Kopi Kita
- Katering Acara
- Toko Roti & Bakery
- Kedai Bubble Tea

---

### 2. **Jasa & Servis** 🔧

**UI Label**: `Jasa & Servis`  
**Backend Key**: `jasa_servis`

**System Mapping**:
- `business_mode`: `service` (Pure Service)
- `inventory_enabled`: `false` ❌
- `has_stock`: `false` ❌

**Target User**:
- Salon & barbershop
- Service AC/elektronik
- Laundry
- Fotografer & videografer
- Desain grafis
- Konsultan & freelancer

**Fitur yang Di-enable**:
- ✅ Income Module (pembayaran jasa)
- ✅ Expense Module (biaya operasional)
- ✅ Customer Management
- ❌ Inventory (tidak butuh stok)
- ❌ Product (tidak jual barang)

**Contoh Bisnis**:
- Service AC & Elektronik
- Salon Kecantikan
- Laundry Kiloan
- Fotografer Wedding
- Desain Grafis Freelance
- Bimbel Privat

---

### 3. **Perdagangan / Toko** 🏪

**UI Label**: `Perdagangan / Toko`  
**Backend Key**: `perdagangan_toko`

**System Mapping**:
- `business_mode`: `physical` (Toko Fisik)
- `inventory_enabled`: `true` ✅
- `has_stock`: `true` ✅

**Target User**:
- Warung sembako
- Toko pakaian
- Minimarket
- Toko elektronik
- Toko kosmetik
- Retail umum

**Fitur yang Di-enable**:
- ✅ Full Inventory Management
- ✅ Stock Tracking (real-time)
- ✅ Product Management (katalog lengkap)
- ✅ Income Module (penjualan)
- ✅ Expense Module (pembelian stok)
- ✅ Stock Alerts (min stock warning)

**Contoh Bisnis**:
- Warung Sembako Pak Budi
- Toko Pakaian & Fashion
- Minimarket Kelontong
- Toko HP & Aksesoris
- Toko Kosmetik

---

### 4. **Reseller / Dropship** 📦

**UI Label**: `Reseller / Dropship`  
**Backend Key**: `reseller_dropship`

**System Mapping**:
- `business_mode`: `trading` (Trading-based)
- `inventory_enabled`: `true` ⚠️ (Optional)
- `has_stock`: `true` ⚠️ (Virtual/tracking only)

**Target User**:
- Dropshipper online
- Reseller marketplace
- Pre-order bisnis
- Agen produk
- Distributor kecil

**Fitur yang Di-enable**:
- ✅ Income Module (penjualan)
- ⚠️ Inventory (optional - untuk tracking)
- ⚠️ Stock (virtual - untuk status pre-order)
- ✅ Customer Management
- ✅ Supplier Management
- ✅ Expense Module (modal PO)

**Contoh Bisnis**:
- Dropship Fashion Instagram
- Pre-order Kue & Snack
- Print on Demand Kaos
- Reseller Skincare Online
- Agen Produk dari Supplier

---

### 5. **Digital / Online** 💻

**UI Label**: `Digital / Online`  
**Backend Key**: `digital_online`

**System Mapping**:
- `business_mode`: `digital` (Digital Products/Services)
- `inventory_enabled`: `false` ❌
- `has_stock`: `false` ❌

**Target User**:
- Konten creator (YouTube, TikTok)
- Jasa pembuatan website
- Kursus online
- Affiliate marketer
- Freelance developer/designer
- Digital product seller

**Fitur yang Di-enable**:
- ✅ Income Module (pembayaran digital)
- ✅ Expense Module (biaya tools/ads)
- ❌ Inventory (tidak ada produk fisik)
- ❌ Stock (tidak ada stok)
- ✅ Customer Management

**Contoh Bisnis**:
- YouTube Content Creator
- Jasa Pembuatan Website
- Kursus Online & Webinar
- Affiliate Marketing
- Freelance Developer

---

### 6. **Produksi** 🔨

**UI Label**: `Produksi`  
**Backend Key**: `produksi`

**System Mapping**:
- `business_mode`: `hybrid` (Produksi + Penjualan)
- `inventory_enabled`: `true` ✅
- `has_stock`: `true` ✅

**Target User**:
- Home industry
- Kerajinan tangan
- Konveksi
- Furniture custom
- Produsen makanan olahan
- Manufaktur kecil

**Fitur yang Di-enable**:
- ✅ Full Inventory (bahan baku + produk jadi)
- ✅ Stock Tracking (2-tier: raw material + finished goods)
- ✅ Product Management
- ✅ Income Module (penjualan produk)
- ✅ Expense Module (pembelian bahan baku)
- ✅ Production Tracking (optional)

**Contoh Bisnis**:
- Kerajinan Tangan & Handicraft
- Konveksi Pakaian & Sablon
- Produksi Makanan Olahan
- Furniture & Mebel Custom
- Sabun Homemade

---

### 7. **Lainnya** 📁

**UI Label**: `Lainnya`  
**Backend Key**: `lainnya`

**System Mapping**:
- `business_mode`: `hybrid` (Configurable)
- `inventory_enabled`: `true` ⚠️ (Configurable)
- `has_stock`: `true` ⚠️ (Configurable)

**Target User**:
- Bisnis campuran (Toko + Service)
- Model bisnis unik
- Kombinasi berbagai layanan
- Tidak masuk kategori lain

**Fitur yang Di-enable**:
- ✅ All modules available
- ⚠️ User dapat toggle on/off fitur
- ⚠️ Flexible configuration

**Contoh Bisnis**:
- Bengkel + Jual Sparepart
- Toko Komputer + Service
- Salon + Jual Produk Kecantikan
- Model Bisnis Unik

---

## 🗄️ DATABASE SCHEMA

### Kolom Baru (ADDITIVE ONLY):

```sql
ALTER TABLE business_type_mappings 
  ADD COLUMN IF NOT EXISTS category_key TEXT,
  ADD COLUMN IF NOT EXISTS label_ui TEXT,
  ADD COLUMN IF NOT EXISTS business_mode TEXT,
  ADD COLUMN IF NOT EXISTS inventory_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_stock BOOLEAN,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS icon_name TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;
```

---

## ✅ COMPLIANCE: ADDITIVE ONLY ✅

- [x] **TIDAK** membuat tabel baru ✅
- [x] **TIDAK** DROP TABLE ✅
- [x] **TIDAK** DROP COLUMN ✅
- [x] **HANYA** ADD COLUMN (IF NOT EXISTS) ✅
- [x] **HANYA** INSERT data baru ✅
- [x] Data lama tidak hilang ✅

---

**Status**: 🟢 **READY FOR DEPLOYMENT**  
**Safety**: 🟢 **100% ADDITIVE**