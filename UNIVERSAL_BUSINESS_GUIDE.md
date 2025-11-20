# 🏢 Universal Business System - Support All Business Types

## Overview

Sistem ini **UNIVERSAL** dan bisa digunakan untuk **semua jenis bisnis**, dari manufaktur sampai jasa, rental, project-based, dll.

---

## 🎯 Business Types Supported

### 1. **MANUFACTURING** (Produksi Barang)
**Contoh:** Pabrik garmen, kerajinan tangan, furniture

**Flow:**
```
Bahan Baku → Proses Produksi → Produk Jadi → Jual
   ↓               ↓                  ↓
Input Qty    Recipe/Formula      Output Qty
```

**Setup:**
- Bikin item bahan baku: `Kain (meter), Benang (roll), Kancing (pcs)`
- Bikin item produk jadi: `Kemeja Batik`
- Define recipe: 1 Kemeja = 2m kain + 1 roll benang + 10 kancing
- Input pembelian bahan → stok bahan +
- Input penjualan kemeja → stok bahan - (otomatis)

**Database:**
```sql
-- Kain
item_category: 'raw_material'
business_type: 'manufacturing'
is_raw_material: true

-- Kemeja Batik
item_category: 'finished_product'
business_type: 'manufacturing'
has_recipe: true
auto_deduct_ingredients: true

-- Recipe
output_item: Kemeja Batik
input_item: Kain, qty: 2, unit: meter
```

---

### 2. **FOOD & BEVERAGE** (F&B)
**Contoh:** Warung, resto, catering, kafe

**Flow:**
```
Beli Bahan Mentah → Masak → Menu Jadi → Jual
```

**Setup:**
- Bahan: `Beras (kg), Telur (butir), Ayam (kg), Bumbu`
- Menu: `Nasi Goreng, Ayam Geprek, Es Teh`
- Recipe per menu
- Auto deduct bahan saat jual

**Special Case - Service Tambahan:**
- Item: `Delivery Service` (is_service: true, no stock)
- Item: `Catering Package` (package bundling)

---

### 3. **RETAIL / TRADING** (Jual Beli)
**Contoh:** Toko kelontong, fashion store, elektronik

#### A. Trading Murni (Beli → Jual)
**Flow:**
```
Beli Barang → Jual Barang (harga markup)
```

**Setup:**
- Item: `iPhone 15` (trading_goods)
- Beli: input expense + update stok
- Jual: input sales - stok berkurang
- NO recipe needed (tidak ada produksi)

#### B. Export / Import / Calo
**Flow:**
```
Order dari Supplier → Import → Markup → Jual ke Buyer
```

**Setup:**
- Item: `Laptop Dell` (trading_goods)
- Track: buy_price (harga impor) vs sell_price (harga jual)
- Margin calculation otomatis
- Optional: track shipping cost, bea cukai (as expense)

---

### 4. **SERVICE BUSINESS** (Jasa)
**Contoh:** Salon, bengkel, konsultan, freelancer

**Flow:**
```
Resources (Labor + Material + Facility) → Deliver Service → Get Paid
```

**Setup:**

#### A. Service Sederhana (Potong Rambut)
```sql
-- Item: Potong Rambut
item_category: 'service'
is_service: true (no physical stock!)
duration_minutes: 30
sell_price: 50000

-- Resources (optional tracking):
- Labor: Stylist (50% dari revenue = 25rb)
- Material: Shampoo, kondisioner (5rb)
- Facility: Kursi salon (overhead)
```

#### B. Service Kompleks (Reparasi AC)
```sql
-- Item: Service AC
item_category: 'service'
is_service: true
is_quotation_based: true (harga bisa beda per case)

-- Resources:
- Labor: Teknisi (per jam: 100rb, butuh 2 jam)
- Material: Freon (jika perlu), spare part (variable)
- Equipment: Tools (overhead)

-- Total cost = labor + material aktual
-- Profit = harga quote - total cost
```

---

### 5. **EDUCATION / TRAINING**
**Contoh:** Kursus, bimbel, training corporate

**Flow:**
```
Prepare Material → Deliver Training → Collect Fee
```

**Setup:**

#### A. Training Per Session
```sql
-- Item: Public Speaking Training
item_category: 'service'
is_service: true
duration_minutes: 480 (8 jam)
service_capacity: 20 (max 20 peserta)
sell_price: 500000 per orang

-- Resources:
- Labor: Trainer (per hari: 2jt)
- Facility: Ruang meeting (per hari: 1jt)
- Material: Modul + sertifikat (per orang: 50rb)

Total cost per session: 2jt + 1jt + (20 × 50rb) = 4jt
Revenue per session: 20 × 500rb = 10jt
Profit: 6jt (60%)
```

#### B. Package / Bundling
```sql
-- Item: Bootcamp 3 Bulan
item_category: 'package'
has_recipe: true

-- Recipe (bundling):
- 12x Training Session
- 1x Final Project Mentoring
- 1x Certificate
- 1x Job Placement Service

-- Harga: 15jt (hemat vs beli satuan 20jt)
```

---

### 6. **RENTAL BUSINESS** (Sewa)
**Contoh:** Rental mobil, kamera, studio, properti

**Flow:**
```
Beli/Punya Asset → Sewa ke Customer → Terima uang + Deposit → Return
```

**Setup:**

```sql
-- Item: Toyota Avanza 2023
item_category: 'rental_item'
is_rental: true
daily_rate: 400000
rental_deposit: 500000
max_rental_days: 30

-- Rental Session:
- Customer A sewa 3 hari
- Total: 3 × 400rb = 1.2jt
- Deposit: 500rb (dikembalikan jika mobil OK)
- Status: active → returned
- Late fee: jika telat return (auto calculate)
```

**Revenue Tracking:**
- Transaction type: rental
- Link ke rental_sessions table
- Track: start_date, end_date, actual_return_date
- Status: active / returned / overdue

**Asset Management:**
- Track kondisi barang (via condition_notes)
- Maintenance cost (as expense)
- Depreciation (optional future feature)

---

### 7. **TIME-BASED BOOKING** (Booking Berbasis Waktu)
**Contoh:** Studio foto, meeting room, lapangan futsal

**Flow:**
```
Customer book slot waktu → Bayar → Gunakan → Selesai
```

**Setup:**

```sql
-- Item: Meeting Room A
item_category: 'time_slot'
is_time_based: true
hourly_rate: 100000
service_capacity: 15 (max 15 orang)

-- Booking:
- Date: 2024-01-15
- Time: 09:00 - 12:00 (3 jam)
- Booked by: 10 orang
- Total: 3 × 100rb = 300rb
- Status: confirmed → completed
```

**Calendar View:**
- Tampilkan availability per hari
- Block jika sudah fully booked
- Multiple bookings per day (beda slot)

---

### 8. **PROJECT-BASED** (Kontrak Project)
**Contoh:** Software development, konstruksi, design

**Flow:**
```
Quote Project → Agreement → Milestone 1 → Milestone 2 → Final Delivery
     ↓              ↓            ↓              ↓              ↓
   Pricing       Contract    Payment 30%    Payment 40%   Payment 30%
```

**Setup:**

```sql
-- Item: Website Development
item_category: 'project'
is_project_based: true
is_quotation_based: true (harga custom per project)
estimated_days: 60

-- Project Milestones:
Milestone 1: UI/UX Design (30%, 15 hari) - 10jt
Milestone 2: Development (40%, 30 hari) - 13.3jt
Milestone 3: Testing & Launch (30%, 15 hari) - 10jt
Total Project Value: 33.3jt

-- Track per milestone:
- is_completed: false/true
- is_paid: false/true
- completed_date
- paid_date
```

**Cost Tracking:**
- Resources: Developer hours (labor)
- Tools: Hosting, domain, software license
- Total cost vs Total revenue = Project profit

---

### 9. **DIGITAL PRODUCTS**
**Contoh:** Ebook, course online, software license

**Flow:**
```
Create Once → Sell Unlimited (no inventory limit)
```

**Setup:**

```sql
-- Item: Ebook "Cara Jualan Online"
item_category: 'digital_product'
is_service: true (no physical stock)
track_inventory: false (unlimited)
sell_price: 99000

-- Cost:
- Creation cost: one-time (design, writing)
- Distribution cost: ~0 (digital delivery)
- Margin: ~99% (setelah break-even)
```

---

### 10. **SUBSCRIPTION BUSINESS**
**Contoh:** Membership gym, SaaS, subscription box

**Flow:**
```
Customer subscribe → Recurring payment (monthly/yearly) → Deliver value
```

**Setup:**

```sql
-- Item: Premium Membership
item_category: 'subscription'
is_service: true
sell_price: 199000 per bulan

-- Benefits (bisa link ke service_resources):
- Akses gym unlimited
- 4x Personal Training session
- Nutrition consultation

-- Recurring:
- Track via transactions (monthly recurring)
- Auto reminder renewal
- Churn tracking (cancel rate)
```

---

## 📊 Universal Data Model

### Core Structure

```
business_items (products table)
├── item_category: ENUM (raw_material, finished_product, service, package, dll)
├── business_type: ENUM (manufacturing, service, trading, education, dll)
└── Flags:
    ├── is_raw_material
    ├── has_recipe
    ├── is_service (no stock tracking)
    ├── is_time_based
    ├── is_rental
    ├── is_project_based
    └── auto_deduct_ingredients
```

### Supporting Tables

1. **business_item_recipes** → Manufacturing, F&B
2. **service_resources** → Service, Education
3. **project_milestones** → Project-based
4. **rental_sessions** → Rental
5. **time_slot_bookings** → Time-based booking

---

## 🎨 UI Adaptations per Business Type

### Setup Wizard (Onboarding)
```
Step 1: Pilih Jenis Bisnis
[ ] Manufacturing (Produksi barang)
[ ] Food & Beverage
[ ] Retail / Trading
[ ] Service / Jasa
[ ] Education / Training
[ ] Rental / Sewa
[ ] Project-based
[ ] Digital Products
[ ] Mixed (Kombinasi)

Step 2: Fitur yang Aktif
[x] Inventory Management (jika ada physical goods)
[x] Recipe/Formula System (jika produksi)
[x] Service Resources (jika jasa)
[ ] Project Milestones (jika project-based)
[ ] Rental Tracking (jika rental)
[ ] Time Slot Booking (jika time-based)
```

### Dynamic Input Forms

#### Manufacturing / F&B:
- Input Pembelian Bahan → update stok bahan
- Input Penjualan → auto deduct bahan (if has recipe)
- Show: Material cost, Labor cost, Overhead

#### Trading:
- Input Pembelian Barang → update stok
- Input Penjualan → reduce stok
- Show: Buy price, Sell price, Margin

#### Service:
- Input Service Delivery (no stok)
- Track resources used (labor hours, materials)
- Show: Service cost, Revenue, Profit

#### Project:
- Create Project → Define milestones
- Track milestone completion & payment
- Show: Project progress, Cash flow

#### Rental:
- Create Rental Session → Set period
- Track return status
- Calculate late fees
- Show: Utilization rate, Revenue per asset

---

## 💡 Smart Features

### 1. Auto-Detection Business Type
```typescript
// System detects based on item setup:
if (has_recipe && is_raw_material) → Manufacturing/F&B
if (is_service && has_service_resources) → Service business
if (is_rental) → Rental business
if (is_project_based && has_milestones) → Project business
if (!track_inventory && is_service) → Pure service/digital
```

### 2. Intelligent Cost Calculation

```typescript
// Manufacturing: Sum of ingredient costs
cost = sum(recipe.input_items.cost)

// Service: Sum of resource costs
cost = sum(service_resources.cost)

// Trading: Direct buy_price
cost = buy_price

// Project: Accumulated milestone costs
cost = sum(labor_hours × hourly_rate + materials)
```

### 3. Dynamic Reports

- **Manufacturing:** Material usage, Production efficiency
- **Trading:** Turnover ratio, Margin analysis
- **Service:** Utilization rate, Labor productivity
- **Rental:** Asset utilization, Revenue per item
- **Project:** Project profitability, Timeline vs Actual

---

## 🚀 Implementation Roadmap

### Phase 1: Core (NOW)
- [x] Universal schema design
- [ ] Run SQL migration
- [ ] Update UI forms (detect business type)

### Phase 2: Manufacturing (Priority 1)
- [ ] Recipe builder UI
- [ ] Auto-deduct integration
- [ ] Cost calculation

### Phase 3: Service (Priority 2)
- [ ] Service resource management
- [ ] Time tracking
- [ ] Booking system

### Phase 4: Advanced (Priority 3)
- [ ] Project milestones
- [ ] Rental tracking
- [ ] Subscription management

---

## ✅ Advantages of Universal System

1. **One Platform, All Business:** User tidak perlu ganti-ganti software
2. **Scalable:** Bisnis bisa evolve (dari retail → retail + service)
3. **Accurate Costing:** Setiap business model punya costing yang tepat
4. **Unified Reports:** Dashboard tetap simple tapi powerful
5. **No Vendor Lock-in:** Data structure flexible

---

## 📌 Next Steps

1. **Run SQL:** Execute `create_universal_business_system.sql`
2. **Test:** Create sample items untuk tiap business type
3. **UI Update:** Form tambah produk dengan dynamic fields
4. **Deploy:** Test di production dengan real user

Sistem ini **siap adaptasi** untuk bisnis apapun! 🎉
