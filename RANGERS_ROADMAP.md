# 🚀 KATALARA RANGERS ECOSYSTEM - ROADMAP & SPECIFICATIONS

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Features](#core-features)
6. [Development Phases](#development-phases)
7. [Technical Implementation](#technical-implementation)
8. [Security Considerations](#security-considerations)
9. [Business Logic](#business-logic)
10. [Testing Checklist](#testing-checklist)

---

## 🎯 Overview

**Rangers Ecosystem** adalah fitur marketplace talent yang menghubungkan UMKM dengan mahasiswa/freelancer lokal (Rangers) untuk layanan:
- 📸 **Foto Produk** profesional
- ⌨️ **Input Data** produk massal
- 🎨 **Desain Katalog** digital
- ✍️ **Copywriting** deskripsi produk
- 📱 **Social Media Management**
- 🚀 **Marketplace Optimization**
- ⭐ **Full Concierge** (paket lengkap)

### Vision Statement
> "Gojek untuk UMKM" - Platform on-demand untuk jasa digitalisasi bisnis, menciptakan ekosistem win-win antara UMKM (dapat bantuan profesional tanpa gaji bulanan) dan mahasiswa (dapat penghasilan + portfolio).

---

## 🏗️ Architecture

### Multi-Tenant Role-Based Access
```
┌─────────────────────────────────────────────────────────┐
│                   KATALARA PLATFORM                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   PELANGGAN  │  │    RANGER    │  │  SUPERUSER   │  │
│  │   (UMKM)     │  │ (Mahasiswa)  │  │ (Platform)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         ├──────────────────┼──────────────────┤          │
│         │                  │                  │          │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐  │
│  │  Dashboard  │    │  Dashboard  │    │  Admin      │  │
│  │  Finance    │    │  Jobs       │    │  Dashboard  │  │
│  │  Products   │    │  Portfolio  │    │  Analytics  │  │
│  │  Inventory  │    │  Earnings   │    │  Monitoring │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Service Flow
```
┌─────────┐                  ┌──────────────┐                 ┌─────────┐
│  UMKM   │  1. Request      │   PLATFORM   │   2. Matching   │ RANGER  │
│         ├─────────────────►│              ├────────────────►│         │
│         │                  │   (Auto by   │                 │         │
│         │                  │   Location)  │                 │         │
│         │                  │              │                 │         │
│         │  5. Review       │              │  3. Accept Job  │         │
│         │◄─────────────────┤              │◄────────────────┤         │
│         │                  │              │                 │         │
│         │                  │              │  4. Complete    │         │
│         │                  │              │     Work        │         │
└─────────┘                  └──────────────┘                 └─────────┘
       │                                                             │
       │                                                             │
       └─────────────── Temporary Access Session ──────────────────┘
                     (Auto-expires after deadline)
```

---

## 💾 Database Schema

### Core Tables

#### 1. `ranger_profiles`
**Purpose:** Menyimpan profil lengkap Katalara Rangers

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `full_name` | VARCHAR(255) | Nama lengkap |
| `phone` | VARCHAR(20) | Nomor telepon |
| `city` | VARCHAR(100) | Kota (untuk matching) |
| `district` | VARCHAR(100) | Kecamatan (untuk matching) |
| `latitude` | DECIMAL(10,8) | Koordinat geografis |
| `longitude` | DECIMAL(11,8) | Koordinat geografis |
| `university` | VARCHAR(255) | Nama kampus |
| `major` | VARCHAR(255) | Jurusan |
| `skills` | TEXT[] | Array skills: ['fotografi', 'desain_grafis'] |
| `is_verified` | BOOLEAN | Status verifikasi |
| `is_available` | BOOLEAN | Sedang available untuk job baru |
| `total_jobs_completed` | INTEGER | Total job selesai |
| `total_earnings` | DECIMAL(15,2) | Total penghasilan |
| `average_rating` | DECIMAL(3,2) | Rating rata-rata (0-5) |

**Indexes:**
- `idx_rangers_location` - (city, district) untuk geo-matching
- `idx_rangers_skills` - GIN index untuk array search
- `idx_rangers_verified` - (is_verified, is_available)
- `idx_rangers_rating` - (average_rating DESC)

---

#### 2. `service_requests`
**Purpose:** Request layanan dari UMKM

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `business_id` | UUID | FK to businesses |
| `requested_by` | UUID | FK to auth.users (UMKM owner) |
| `service_type` | ENUM | 'product_photography', 'data_entry', etc. |
| `title` | VARCHAR(255) | Judul request |
| `description` | TEXT | Detail pekerjaan |
| `estimated_items` | INTEGER | Jumlah produk yang perlu dikerjakan |
| `service_location` | TEXT | Alamat UMKM |
| `city` | VARCHAR(100) | Kota (untuk matching) |
| `district` | VARCHAR(100) | Kecamatan (untuk matching) |
| `budget_min` | DECIMAL(15,2) | Budget minimum |
| `budget_max` | DECIMAL(15,2) | Budget maksimum |
| `agreed_price` | DECIMAL(15,2) | Harga final setelah negosiasi |
| `preferred_date` | DATE | Tanggal preferensi |
| `deadline` | DATE | Deadline pekerjaan |
| `assigned_ranger_id` | UUID | FK to ranger_profiles (nullable) |
| `status` | ENUM | 'pending', 'assigned', 'in_progress', 'completed', 'reviewed', 'cancelled' |
| `payment_status` | VARCHAR(50) | 'unpaid', 'paid', 'refunded' |

**Status Flow:**
```
pending → assigned → in_progress → completed → reviewed
          ↓
      cancelled
```

**Indexes:**
- `idx_requests_status` - Status untuk filtering
- `idx_requests_location` - (city, district)
- `idx_requests_service_type` - Service type filtering
- `idx_requests_created` - (created_at DESC)

---

#### 3. `service_sessions`
**Purpose:** Temporary access control saat Ranger bekerja

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `service_request_id` | UUID | FK to service_requests |
| `business_id` | UUID | FK to businesses |
| `ranger_id` | UUID | FK to ranger_profiles |
| `access_granted_at` | TIMESTAMP | Waktu akses diberikan |
| `access_expires_at` | TIMESTAMP | Auto-expire time |
| `is_active` | BOOLEAN | Status sesi |
| `can_create_products` | BOOLEAN | Permission: create |
| `can_edit_products` | BOOLEAN | Permission: edit |
| `can_upload_images` | BOOLEAN | Permission: upload |
| `can_view_financials` | BOOLEAN | Permission: view finance (default: false) |
| `products_added` | INTEGER | Tracking: produk ditambahkan |
| `images_uploaded` | INTEGER | Tracking: gambar diupload |
| `ended_at` | TIMESTAMP | Waktu sesi berakhir |
| `end_reason` | VARCHAR(100) | 'completed', 'cancelled', 'expired' |

**Security Logic:**
```typescript
// Middleware untuk cek session access
async function checkRangerSession(rangerId: string, businessId: string) {
  const session = await supabase
    .from('service_sessions')
    .select('*')
    .eq('ranger_id', rangerId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single()
    
  if (!session) throw new Error('No active session')
  if (new Date() > new Date(session.access_expires_at)) {
    // Auto-expire
    await expireSession(session.id)
    throw new Error('Session expired')
  }
  
  return session
}
```

---

#### 4. `ranger_portfolio`
**Purpose:** Track record hasil kerja Rangers

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `ranger_id` | UUID | FK to ranger_profiles |
| `service_request_id` | UUID | FK to service_requests (nullable) |
| `title` | VARCHAR(255) | Judul portfolio item |
| `description` | TEXT | Deskripsi pekerjaan |
| `service_type` | ENUM | Jenis layanan |
| `images` | TEXT[] | Array URL gambar hasil kerja |
| `before_after_images` | JSONB | {before: [...], after: [...]} |
| `items_completed` | INTEGER | Jumlah produk yang dikerjakan |
| `duration_hours` | DECIMAL(4,2) | Durasi pengerjaan |
| `client_satisfaction` | INTEGER | Rating 1-5 dari klien |
| `is_public` | BOOLEAN | Tampilkan di public profile |
| `is_featured` | BOOLEAN | Highlighted portfolio |

---

#### 5. `service_reviews`
**Purpose:** Review dari UMKM untuk Rangers

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `service_request_id` | UUID | FK (UNIQUE - 1 review per request) |
| `business_id` | UUID | FK to businesses |
| `ranger_id` | UUID | FK to ranger_profiles |
| `overall_rating` | INTEGER | Rating 1-5 (required) |
| `quality_rating` | INTEGER | Rating kualitas kerja |
| `speed_rating` | INTEGER | Rating kecepatan |
| `communication_rating` | INTEGER | Rating komunikasi |
| `review_text` | TEXT | Ulasan tertulis |
| `pros` | TEXT | Yang bagus |
| `cons` | TEXT | Yang perlu diperbaiki |
| `ranger_response` | TEXT | Balasan dari Ranger |
| `is_public` | BOOLEAN | Tampilkan public |

**Auto-update Trigger:**
```sql
-- Trigger untuk update average_rating di ranger_profiles
CREATE TRIGGER trigger_update_ranger_metrics
  AFTER INSERT ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_ranger_metrics_after_review();
```

---

#### 6. `ranger_earnings`
**Purpose:** Pencatatan penghasilan Rangers

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `ranger_id` | UUID | FK to ranger_profiles |
| `service_request_id` | UUID | FK (nullable) |
| `amount` | DECIMAL(15,2) | Jumlah uang |
| `transaction_type` | ENUM | 'service_fee', 'bonus', 'referral', 'penalty' |
| `status` | VARCHAR(50) | 'pending', 'processed', 'paid', 'cancelled' |
| `paid_at` | TIMESTAMP | Tanggal pembayaran |
| `payment_method` | VARCHAR(50) | Bank transfer, e-wallet, etc. |
| `payment_reference` | VARCHAR(255) | Nomor bukti transfer |

---

## 👥 User Roles & Permissions

### Role Hierarchy
```
superuser (Platform Owner)
    ↓
  mentor (Future)
    ↓
  ranger (Mahasiswa/Freelancer)
    ↓
pelanggan (UMKM)
    ↓
  investor (Future)
```

### Permission Matrix

| Feature | Pelanggan | Ranger | Mentor | Superuser |
|---------|-----------|--------|--------|-----------|
| Create Service Request | ✅ | ❌ | ❌ | ✅ |
| View All Requests | Own Only | Available Only | ❌ | All |
| Accept Request | ❌ | ✅ | ❌ | ✅ |
| Access UMKM Data (temp) | ❌ | ✅ (session) | ❌ | ✅ |
| View Rangers List | ✅ | ❌ | ❌ | ✅ |
| Submit Review | ✅ | ❌ | ❌ | ✅ |
| View Earnings | ❌ | Own Only | ❌ | All |
| Platform Analytics | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Core Features

### Feature 1: Service Request Flow (UMKM Side)

**User Story:**
> "Sebagai UMKM owner, saya punya 100 produk fashion tapi malas input satu-satu. Saya ingin panggil Ranger terdekat untuk foto dan input data."

**Implementation Steps:**

1. **Button "Panggil Ranger" di Products Page**
   ```tsx
   <button onClick={openRequestModal}>
     📞 Panggil Ranger
   </button>
   ```

2. **Request Form Modal**
   ```tsx
   <ServiceRequestForm>
     - Service Type: Dropdown (Foto, Input Data, Full Package)
     - Estimated Items: Number input
     - Budget Range: Min-Max slider
     - Preferred Date: Date picker
     - Notes: Textarea
   </ServiceRequestForm>
   ```

3. **Auto-Location Detection**
   ```typescript
   const businessLocation = await supabase
     .from('businesses')
     .select('city, district, latitude, longitude')
     .eq('id', businessId)
     .single()
   ```

4. **Submit Request**
   ```typescript
   await supabase.from('service_requests').insert({
     business_id: businessId,
     requested_by: userId,
     service_type: 'product_photography',
     title: 'Foto 100 Produk Fashion',
     description: 'Butuh foto profesional untuk semua produk baju...',
     estimated_items: 100,
     service_location: businessLocation.address,
     city: businessLocation.city,
     district: businessLocation.district,
     budget_min: 150000,
     budget_max: 300000,
     preferred_date: '2025-12-10',
     status: 'pending'
   })
   ```

5. **Notification to Nearby Rangers**
   - Match by city/district
   - Filter by skills matching service_type
   - Send push notification / email

---

### Feature 2: Job Marketplace (Ranger Side)

**User Story:**
> "Sebagai mahasiswa, saya ingin lihat job yang available di area saya dan ambil yang cocok dengan skill saya."

**Rangers Dashboard Components:**

1. **Available Jobs List**
   ```typescript
   const availableJobs = await supabase
     .from('service_requests')
     .select('*, businesses(name, city)')
     .eq('status', 'pending')
     .eq('city', rangerProfile.city) // Location matching
     .order('created_at', { ascending: false })
   ```

2. **Job Card Display**
   ```tsx
   <JobCard>
     <h3>{request.title}</h3>
     <Badge>{request.service_type}</Badge>
     <Location>{request.city} • {calculateDistance()} km</Location>
     <Budget>Rp {request.budget_min} - Rp {request.budget_max}</Budget>
     <Button onClick={claimJob}>Ambil Job Ini</Button>
   </JobCard>
   ```

3. **Claim Job Logic**
   ```typescript
   await supabase
     .from('service_requests')
     .update({
       assigned_ranger_id: rangerProfileId,
       assigned_at: new Date(),
       status: 'assigned'
     })
     .eq('id', requestId)
     .eq('status', 'pending') // Prevent race condition
   ```

---

### Feature 3: Temporary Access Session

**Security Logic:**

1. **Create Session on Job Start**
   ```typescript
   const session = await supabase.from('service_sessions').insert({
     service_request_id: requestId,
     business_id: request.business_id,
     ranger_id: rangerProfileId,
     access_granted_at: new Date(),
     access_expires_at: new Date(request.deadline), // Auto-expire
     is_active: true,
     can_create_products: true,
     can_edit_products: true,
     can_upload_images: true,
     can_view_financials: false // Privacy!
   })
   ```

2. **Middleware Check on Every Request**
   ```typescript
   // middleware.ts
   export async function checkRangerAccess(req, businessId) {
     const rangerId = await getRangerIdFromSession(req)
     
     const session = await supabase
       .from('service_sessions')
       .select('*')
       .eq('ranger_id', rangerId)
       .eq('business_id', businessId)
       .eq('is_active', true)
       .single()
       
     if (!session) throw new UnauthorizedError()
     if (new Date() > new Date(session.access_expires_at)) {
       await expireSession(session.id)
       throw new SessionExpiredError()
     }
     
     return session
   }
   ```

3. **Track Ranger Activity**
   ```typescript
   // Setiap kali Ranger create product
   await supabase.rpc('increment_session_stats', {
     session_id: sessionId,
     stat_type: 'products_added'
   })
   ```

4. **Auto-Expire Cron Job**
   ```typescript
   // Supabase Edge Function (scheduled daily)
   export async function expireOldSessions() {
     await supabase
       .from('service_sessions')
       .update({
         is_active: false,
         ended_at: new Date(),
         end_reason: 'expired'
       })
       .eq('is_active', true)
       .lt('access_expires_at', new Date())
   }
   ```

---

### Feature 4: Portfolio Builder

**Auto-capture Portfolio:**

```typescript
// Ketika job selesai
async function completeJob(requestId: string) {
  const request = await getServiceRequest(requestId)
  const session = await getActiveSession(requestId)
  
  // Create portfolio entry
  await supabase.from('ranger_portfolio').insert({
    ranger_id: request.assigned_ranger_id,
    service_request_id: requestId,
    title: request.title,
    description: request.description,
    service_type: request.service_type,
    items_completed: session.products_added,
    duration_hours: calculateDuration(request.assigned_at, new Date()),
    is_public: true,
    is_featured: false
  })
  
  // Update request status
  await supabase
    .from('service_requests')
    .update({
      status: 'completed',
      completed_at: new Date()
    })
    .eq('id', requestId)
  
  // End session
  await endSession(session.id, 'completed')
}
```

---

### Feature 5: Review & Rating System

**UMKM Submit Review:**
```typescript
async function submitReview(reviewData) {
  const review = await supabase.from('service_reviews').insert({
    service_request_id: reviewData.requestId,
    business_id: reviewData.businessId,
    ranger_id: reviewData.rangerId,
    overall_rating: reviewData.rating, // 1-5
    quality_rating: reviewData.quality,
    speed_rating: reviewData.speed,
    communication_rating: reviewData.communication,
    review_text: reviewData.text,
    is_public: true
  })
  
  // Trigger akan auto-update average_rating di ranger_profiles
}
```

**Ranger Response:**
```typescript
await supabase
  .from('service_reviews')
  .update({
    ranger_response: 'Terima kasih feedback-nya!',
    ranger_responded_at: new Date()
  })
  .eq('id', reviewId)
  .eq('ranger_id', rangerProfileId) // Ensure ownership
```

---

## 🚧 Development Phases

### Phase 1: Foundation (Week 1-2)
**Status:** ✅ **COMPLETED**

- [x] Database schema design
- [x] TypeScript types definition
- [x] SQL migration file
- [x] UI buttons "Panggil Ranger" (disabled/soon)
- [x] Rangers dashboard page (coming soon state)
- [x] Documentation

---

### Phase 2: Core Backend (Week 3-4)
**Status:** ⏳ **PLANNED**

- [ ] Row Level Security (RLS) policies
- [ ] API routes for service requests
- [ ] Geo-matching algorithm (Rangers by location)
- [ ] Session management middleware
- [ ] Auto-expire cron job

**API Endpoints:**
```
POST   /api/rangers/register
GET    /api/rangers/profile/:id
PUT    /api/rangers/profile/:id

POST   /api/service-requests
GET    /api/service-requests
GET    /api/service-requests/:id
PATCH  /api/service-requests/:id/claim
PATCH  /api/service-requests/:id/complete

POST   /api/service-sessions
GET    /api/service-sessions/active
PATCH  /api/service-sessions/:id/end

POST   /api/reviews
GET    /api/reviews/ranger/:rangerId
```

---

### Phase 3: UMKM UI (Week 5)
**Status:** ⏳ **PLANNED**

- [ ] Service Request Modal
- [ ] Request tracking page
- [ ] Ranger selection UI (if multiple available)
- [ ] Real-time status updates (WebSocket/Polling)
- [ ] Review submission form

---

### Phase 4: Rangers App (Week 6-7)
**Status:** ⏳ **PLANNED**

- [ ] Rangers dashboard (real implementation)
- [ ] Available jobs list with filtering
- [ ] Claim job functionality
- [ ] On-site mode (special UI saat kerja di lokasi UMKM)
- [ ] Portfolio management
- [ ] Earnings tracker

---

### Phase 5: Marketplace Features (Week 8+)
**Status:** ⏳ **FUTURE**

- [ ] Contract templates
- [ ] Service packages (bundle pricing)
- [ ] Referral system (Rangers refer Rangers)
- [ ] Talent leaderboard
- [ ] Batch job assignment (1 Ranger → Multiple UMKM)

---

## 🔐 Security Considerations

### 1. Data Privacy
**Problem:** Ranger punya akses ke data bisnis UMKM.

**Solution:**
- ❌ **NO ACCESS** to financial data (incomes, expenses, profit)
- ✅ **LIMITED ACCESS** only to products & customer data yang relevan
- ⏱️ **TIME-BOUND** session dengan auto-expire
- 📝 **AUDIT LOG** setiap aksi Ranger tercatat

```typescript
// RLS Policy Example
CREATE POLICY "Rangers can only view products during active session"
ON products FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM service_sessions
    WHERE ranger_id IN (
      SELECT id FROM ranger_profiles WHERE user_id = auth.uid()
    )
    AND is_active = true
  )
);
```

---

### 2. Payment Security
**Problem:** Rangers bisa claim earnings yang bukan haknya.

**Solution:**
- 💰 Earnings hanya bisa di-withdraw setelah UMKM confirm job completion
- 🔒 Payment processing via platform (escrow model)
- 📊 Transparent earnings breakdown

---

### 3. Quality Control
**Problem:** Rangers abal-abal bisa merusak data UMKM.

**Solution:**
- ✅ **Verification Required:** KTM/ijazah upload, phone verification
- ⭐ **Rating Threshold:** Average < 3.0 stars = Auto-suspend
- 👀 **Admin Review:** First 3 jobs di-review manual oleh superuser
- 📸 **Before/After Photos:** Required untuk photo services

---

## 💼 Business Logic

### Pricing Model

| Service Type | Base Price | Per-Item Price | Estimated Duration |
|-------------|-----------|----------------|-------------------|
| Product Photography | Rp 50,000 | Rp 5,000 | 2 hours |
| Data Entry | Rp 30,000 | Rp 2,000 | 3 hours |
| Full Concierge | Rp 150,000 | Rp 10,000 | 4 hours |
| Catalog Design | Rp 75,000 | - | 4 hours |
| Copywriting | Rp 40,000 | Rp 3,000 | 2 hours |
| Social Media Post | Rp 50,000 | - | 2 hours |
| Marketplace Optimization | Rp 100,000 | - | 3 hours |

**Dynamic Pricing:**
```typescript
function calculatePrice(serviceType, itemCount) {
  const config = SERVICE_TYPE_CONFIGS[serviceType]
  return config.basePrice + (config.pricePerItem * itemCount)
}

// Example:
calculatePrice('product_photography', 100)
// = 50,000 + (5,000 × 100) = Rp 550,000
```

---

### Revenue Split (Platform vs Ranger)

**Model 1: Commission-based (Initial)**
- Ranger: 80%
- Platform: 20%

**Model 2: Subscription (Future)**
- Rangers pay monthly subscription (Rp 25K)
- Keep 100% of earnings
- Access to premium features (priority matching, analytics)

---

### Matching Algorithm

**Geo-based Matching:**
```typescript
async function findNearbyRangers(request: ServiceRequest) {
  // 1. Find rangers in same city
  let rangers = await supabase
    .from('ranger_profiles')
    .select('*')
    .eq('city', request.city)
    .eq('is_verified', true)
    .eq('is_available', true)
    .contains('skills', [getRequiredSkill(request.service_type)])
    .order('average_rating', { ascending: false })
    
  // 2. If < 3 rangers, expand to nearby cities
  if (rangers.length < 3) {
    rangers = await findInNearbyCities(request.province)
  }
  
  // 3. Calculate distance and sort
  const rangersWithDistance = rangers.map(r => ({
    ...r,
    distance: calculateDistance(
      request.latitude, request.longitude,
      r.latitude, r.longitude
    )
  }))
  
  return rangersWithDistance
    .filter(r => r.distance <= 10) // Max 10km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5) // Top 5 closest
}
```

---

## ✅ Testing Checklist

### Unit Tests
- [ ] `calculatePrice()` - Dynamic pricing
- [ ] `findNearbyRangers()` - Geo-matching
- [ ] `checkRangerSession()` - Access control
- [ ] `expireOldSessions()` - Auto-expiry

### Integration Tests
- [ ] Full service request flow (UMKM → Ranger → Complete)
- [ ] Session lifecycle (create → active → expired)
- [ ] Review submission → Rating update
- [ ] Earnings calculation → Payment processing

### E2E Tests
- [ ] UMKM dapat create request
- [ ] Ranger dapat claim job
- [ ] Ranger dapat input data selama session active
- [ ] Session auto-expire setelah deadline
- [ ] Review submission mengupdate average_rating

---

## 📊 Success Metrics

### Phase 1 (Validation)
- [ ] 10 Rangers registered & verified
- [ ] 5 UMKM create service requests
- [ ] 3 jobs completed successfully
- [ ] Average rating > 4.0 stars

### Phase 2 (Revenue)
- [ ] 100 jobs completed per month
- [ ] Rp 5 Juta total GMV (Gross Merchandise Value)
- [ ] 80% job completion rate
- [ ] < 5% complaint rate

### Phase 3 (Scale)
- [ ] 500 active Rangers
- [ ] 1000 UMKM using service
- [ ] Rp 50 Juta monthly GMV
- [ ] Expansion to 5 cities

---

## 🎓 Training & Onboarding

### Ranger Onboarding Checklist
1. ✅ Sign up & KTM verification
2. ✅ Complete profile (skills, location, portfolio)
3. ✅ Watch tutorial video (30 mins)
4. ✅ Pass quiz (product photography basics, customer service)
5. ✅ Mock job simulation
6. ✅ First 3 jobs supervised by platform

### UMKM Tutorial
1. Video: "Cara Panggil Katalara Ranger"
2. FAQ: "Apakah data saya aman?"
3. Best Practices: "Cara siapkan produk untuk foto"

---

## 📝 Next Steps

1. **Immediate (This Week):**
   - ✅ Run SQL migration: `05_rangers_ecosystem.sql`
   - ✅ Deploy Rangers dashboard page to staging
   - [ ] Create API route structure

2. **Short-term (Next 2 Weeks):**
   - [ ] Implement service request modal
   - [ ] Build Rangers job marketplace
   - [ ] Test session access control

3. **Mid-term (Next Month):**
   - [ ] Pilot with 5 UMKM + 10 Rangers di Banjarnegara
   - [ ] Collect feedback & iterate
   - [ ] Refine pricing model

4. **Long-term (Quarter 1 2026):**
   - [ ] Expand to 3 cities (Banjarnegara, Purwokerto, Yogyakarta)
   - [ ] Launch referral program
   - [ ] Build B2G dashboard for government monitoring

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-02  
**Maintainer:** Katalara Dev Team  

---

## 🤝 Contributing

Untuk menambahkan fitur baru ke Rangers ecosystem:

1. Fork dokumentasi ini
2. Tambahkan spesifikasi fitur di section yang relevan
3. Update database schema jika perlu
4. Tambahkan test cases
5. Submit PR untuk review

---

**End of Roadmap**
