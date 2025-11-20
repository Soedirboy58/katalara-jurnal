# 🛒 LAPAK ONLINE - MINI E-COMMERCE UMKM

## 🎯 Konsep Overview

**Lapak Online** adalah fitur e-commerce pribadi untuk UMKM yang terintegrasi dengan sistem Katalara. Setiap UMKM mendapatkan toko online sendiri yang bisa di-share via QR code atau link.

---

## 📊 Fitur Utama

### 1. **Storefront (Toko Online)**
- URL unik: `katalara.com/lapak/[business-slug]`
- Display semua produk dari database user
- Layout grid responsive (mobile & desktop)
- Search & filter produk
- Kategori produk

### 2. **Product Display**
- Product card dengan foto, nama, harga
- Badge: "Stok Habis", "Promo", "Terlaris"
- Rating & review (future)
- Click untuk detail produk

### 3. **Product Detail Modal/Page**
- Foto produk (galeri jika multi foto)
- Nama, harga, deskripsi lengkap
- Stok tersedia
- Varian produk (size, warna, dll)
- Quantity selector
- Button: "Tambah ke Keranjang" & "Beli Sekarang"

### 4. **Shopping Cart**
- Floating cart button (bottom right)
- Badge counter jumlah item
- Mini cart popup
- Multi-select produk
- Edit quantity
- Subtotal calculation
- Button checkout

### 5. **Checkout Flow**
- Form: Nama, No HP, Alamat
- Catatan untuk penjual
- Pilih metode pengiriman (pickup/delivery)
- Summary order
- Button: "Kirim Pesanan via WhatsApp"

### 6. **Floating WhatsApp Chat**
- Icon WA floating (bottom left)
- Click → Direct ke WA Business owner
- Pre-filled message template

### 7. **Share & Marketing**
- QR Code generator
- Copy link button
- Share ke social media (FB, IG, Twitter)
- Embed widget untuk website

### 8. **Dashboard Management**
- Halaman "Lapak Saya" di dashboard
- Enable/disable lapak online
- Customize tema warna
- Upload logo toko
- Set WA Business number
- View analytics (visitors, clicks)

---

## 🎨 Design Mockup

### A. Storefront Page Layout
```
┌─────────────────────────────────────────┐
│  [LOGO]  Toko ABC     [🔍 Search]  [🛒3]│  ← Header
├─────────────────────────────────────────┤
│  [Banner/Cover Image]                   │  ← Hero Section
│  "Selamat datang di Toko ABC"           │
├─────────────────────────────────────────┤
│  [Kategori: Semua | Makanan | Minuman] │  ← Category Filter
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │  ← Product Grid
│  │ Foto │  │ Foto │  │ Foto │         │
│  │ Roti │  │ Kue  │  │ Kopi │         │
│  │ 15k  │  │ 20k  │  │ 10k  │         │
│  │[+🛒] │  │[+🛒] │  │[+🛒] │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ Foto │  │ Foto │  │ Foto │         │
│  │...   │  │...   │  │...   │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
├─────────────────────────────────────────┤
│  📍 Alamat Toko                         │  ← Footer
│  📞 Kontak                              │
│  ⏰ Jam Buka                            │
└─────────────────────────────────────────┘

[💬 WA]  ← Floating (bottom left)
         [🛒 3]  ← Floating cart (bottom right)
```

### B. Product Detail Modal
```
┌─────────────────────────────────────────┐
│  [X Close]                              │
│                                         │
│  ┌─────────────────┐                   │
│  │                 │                   │
│  │   Foto Produk   │  ← Main Image    │
│  │                 │                   │
│  └─────────────────┘                   │
│  [📷][📷][📷][📷]  ← Thumbnails       │
│                                         │
│  Roti Sobek Coklat                     │  ← Product Name
│  ⭐⭐⭐⭐⭐ (24 review)                  │
│                                         │
│  Rp 15.000                             │  ← Price
│  Stok: 50 pcs                          │
│                                         │
│  Deskripsi:                            │
│  Roti sobek lembut dengan toping       │
│  coklat premium. Cocok untuk sarapan.  │
│                                         │
│  Varian: [Coklat] [Keju] [Original]   │  ← Variants
│                                         │
│  Jumlah: [−] [1] [+]                   │  ← Quantity
│                                         │
│  [🛒 Tambah ke Keranjang] [💚 Beli]   │  ← Actions
└─────────────────────────────────────────┘
```

### C. Shopping Cart Popup
```
┌─────────────────────────────────────────┐
│  Keranjang Belanja               [X]    │
├─────────────────────────────────────────┤
│  [✓] [📷] Roti Sobek      [−][2][+]    │
│         Rp 15.000 x 2 = 30.000         │
├─────────────────────────────────────────┤
│  [✓] [📷] Kopi Hitam      [−][1][+]    │
│         Rp 10.000 x 1 = 10.000         │
├─────────────────────────────────────────┤
│  [ ] [📷] Kue Kering      [−][3][+]    │
│         Rp 20.000 x 3 = 60.000         │
├─────────────────────────────────────────┤
│  Subtotal (2 item): Rp 40.000          │
│  [Hapus yang dipilih] [Checkout →]     │
└─────────────────────────────────────────┘
```

### D. Checkout Page
```
┌─────────────────────────────────────────┐
│  Checkout                               │
├─────────────────────────────────────────┤
│  Data Pembeli                           │
│  ┌─────────────────────────────────────┐│
│  │ Nama Lengkap: [____________]        ││
│  │ No HP/WA:     [____________]        ││
│  │ Alamat:       [____________]        ││
│  │               [____________]        ││
│  └─────────────────────────────────────┘│
│                                         │
│  Metode Pengiriman                     │
│  ○ Pickup di toko                      │
│  ● Diantar (ongkir sesuai jarak)       │
│                                         │
│  Catatan untuk Penjual (Opsional)     │
│  ┌─────────────────────────────────────┐│
│  │ [_____________________________]     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Ringkasan Pesanan                     │
│  • Roti Sobek x2 = Rp 30.000           │
│  • Kopi Hitam x1 = Rp 10.000           │
│  ──────────────────────────────        │
│  Subtotal:  Rp 40.000                  │
│  Ongkir:    (Hubungi penjual)          │
│  ──────────────────────────────        │
│  Total:     Rp 40.000                  │
│                                         │
│  [📱 Kirim Pesanan via WhatsApp]       │
└─────────────────────────────────────────┘
```

---

## 🔄 User Flow

### Flow 1: Customer View Product
```
1. Customer buka link: katalara.com/lapak/toko-abc
   ↓
2. Lihat grid produk
   ↓
3. Click produk → Modal detail muncul
   ↓
4. Baca deskripsi, pilih varian, set quantity
   ↓
5. Click "Tambah ke Keranjang"
   ↓
6. Badge cart +1, popup notif "Ditambahkan ke keranjang"
```

### Flow 2: Customer Checkout
```
1. Click floating cart button
   ↓
2. Cart popup muncul, lihat item
   ↓
3. Select item yang mau dibeli (checkbox)
   ↓
4. Click "Checkout"
   ↓
5. Isi form (nama, HP, alamat)
   ↓
6. Click "Kirim Pesanan via WhatsApp"
   ↓
7. Redirect ke WA dengan pre-filled message:
   
   "Halo *Toko ABC*, saya mau pesan:
   
   📦 *Pesanan:*
   - Roti Sobek x2 = Rp 30.000
   - Kopi Hitam x1 = Rp 10.000
   
   💰 *Total: Rp 40.000*
   
   👤 *Data Pembeli:*
   Nama: Budi Santoso
   HP: 081234567890
   Alamat: Jl. Merdeka No. 123, Jakarta
   
   🚚 Metode: Diantar
   
   📝 Catatan: Tolong kirim sore ya
   
   Terima kasih!"
```

### Flow 3: Owner Share Lapak
```
1. Owner buka Dashboard → Menu "Lapak Saya"
   ↓
2. Enable lapak online (toggle)
   ↓
3. Customize tema, upload logo, set WA number
   ↓
4. Click "Generate QR Code"
   ↓
5. Download QR code image
   ↓
6. Copy link lapak
   ↓
7. Share di:
   - Instagram bio
   - Facebook page
   - WhatsApp status
   - Print di struk/packaging
```

---

## 🗂️ Database Schema

### Tabel: `business_storefronts`
```sql
CREATE TABLE business_storefronts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id),
  slug VARCHAR(100) UNIQUE NOT NULL,  -- e.g., "toko-abc"
  is_active BOOLEAN DEFAULT true,
  
  -- Branding
  store_name VARCHAR(200),
  logo_url TEXT,
  cover_image_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#1088ff',
  
  -- Contact Info
  whatsapp_number VARCHAR(20),
  address TEXT,
  operating_hours JSONB,  -- {"senin": "08:00-17:00", ...}
  
  -- Settings
  allow_online_payment BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  
  -- Analytics
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel: `cart_sessions` (Optional - untuk save cart)
```sql
CREATE TABLE cart_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) UNIQUE,  -- Browser fingerprint
  storefront_id UUID REFERENCES business_storefronts(id),
  cart_items JSONB,  -- [{product_id, quantity, variant}]
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── lapak/
│   │   └── [slug]/
│   │       ├── page.tsx           ← Main storefront
│   │       └── checkout/
│   │           └── page.tsx       ← Checkout page
│   │
│   └── dashboard/
│       └── lapak/
│           └── page.tsx           ← Manage lapak dashboard
│
├── components/
│   ├── storefront/
│   │   ├── StorefrontHeader.tsx   ← Logo, search, cart
│   │   ├── ProductGrid.tsx        ← Grid of products
│   │   ├── ProductCard.tsx        ← Single product card
│   │   ├── ProductDetailModal.tsx ← Product detail popup
│   │   ├── CategoryFilter.tsx     ← Filter by category
│   │   ├── ShoppingCart.tsx       ← Cart popup
│   │   ├── FloatingCartButton.tsx ← Floating cart icon
│   │   ├── FloatingWhatsApp.tsx   ← Floating WA icon
│   │   └── CheckoutForm.tsx       ← Checkout form
│   │
│   └── dashboard/
│       └── lapak/
│           ├── LapakSettings.tsx  ← Settings panel
│           ├── QRCodeGenerator.tsx ← QR code
│           └── ShareButtons.tsx    ← Social share
│
└── lib/
    └── storefront/
        ├── cart.ts                ← Cart logic
        ├── whatsapp.ts            ← WA message formatter
        └── qrcode.ts              ← QR generation
```

---

## 🎨 Component Specs

### 1. ProductCard Component
```tsx
interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image_url: string
    stock: number
    category: string
    is_featured: boolean
  }
  onAddToCart: (productId: string) => void
  onViewDetail: (productId: string) => void
}

Features:
- Hover effect (scale & shadow)
- Badge: "Habis", "Promo", "Terlaris"
- Quick add to cart button
- Click card → open detail modal
```

### 2. FloatingCartButton Component
```tsx
Features:
- Fixed position bottom-right
- Badge counter (red circle)
- Bounce animation on add item
- Click → open cart popup
- Z-index high (above all)
```

### 3. FloatingWhatsApp Component
```tsx
Features:
- Fixed position bottom-left
- Green WA color
- Pulse animation
- Click → open WA with pre-filled message
- Conditional: Only show if WA number set
```

### 4. ProductDetailModal Component
```tsx
Features:
- Full-screen modal (mobile)
- Sidebar modal (desktop)
- Image gallery with thumbnails
- Variant selector (radio buttons)
- Quantity selector (+ - buttons)
- Stock indicator
- Add to cart / Buy now buttons
- Close button (X)
```

### 5. ShoppingCart Component
```tsx
Features:
- Slide-in from right
- List of cart items
- Checkbox for multi-select
- Quantity adjuster per item
- Delete selected button
- Subtotal calculation
- Checkout button
- Empty cart illustration
```

---

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - SSR for SEO
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **React State** - Cart management
- **LocalStorage** - Persist cart

### Backend
- **Supabase** - Database
- **Edge Functions** - Analytics tracking
- **Storage** - Product images

### Integrations
- **WhatsApp API** - Direct chat
- **QR Code Library** - `qrcode.react`
- **Share API** - Native share button

---

## 📊 Analytics & Tracking

### Metrics to Track
1. **Total Views** - Page visits
2. **Product Clicks** - Detail views
3. **Cart Adds** - Add to cart actions
4. **Checkout Starts** - Checkout page visits
5. **WhatsApp Clicks** - Conversion to WA
6. **Popular Products** - Most viewed/added
7. **Bounce Rate** - Exit without interaction

### Dashboard Display
- Total views (this week/month)
- Top 5 products
- Conversion funnel chart
- Traffic sources (QR/link/social)

---

## 🎯 MVP Features (Phase 1)

### Must Have
✅ Product display grid  
✅ Product detail modal  
✅ Shopping cart (floating + popup)  
✅ Checkout form  
✅ WhatsApp integration  
✅ QR code generator  
✅ Shareable link  
✅ Basic analytics  

### Nice to Have (Phase 2)
⏳ Search & filter  
⏳ Multiple product images  
⏳ Product variants (size, color)  
⏳ Custom theme colors  
⏳ Operating hours display  
⏳ Review & rating  
⏳ Promo/discount codes  

### Future (Phase 3)
🔮 Online payment (Midtrans)  
🔮 Order management system  
🔮 Customer database  
🔮 Email notifications  
🔮 Shipping integration  
🔮 Loyalty points  

---

## 🔐 Security & Privacy

### Public Storefront
- Read-only access to products
- No authentication required
- Rate limiting (prevent scraping)
- CORS for API calls

### Owner Dashboard
- Authentication required
- RLS (Row Level Security)
- Owner can only edit their lapak
- Image upload validation

### Customer Data
- Not stored in database (privacy)
- Passed directly to WhatsApp
- Optional: Save in order history (with consent)

---

## 📱 Mobile Optimization

### Responsive Design
- Grid: 2 columns (mobile), 3-4 columns (desktop)
- Touch-friendly buttons (min 44px)
- Bottom navigation (sticky)
- Swipeable product gallery
- Optimized images (WebP, lazy load)

### Performance
- SSR for fast initial load
- Image optimization (Next.js Image)
- Lazy load below fold
- Cache product list (5 min)
- Minimal JavaScript bundle

---

## 🎨 Theme Customization

### Owner Can Customize
1. **Primary Color** - Buttons, header, links
2. **Logo** - Upload custom logo
3. **Cover Image** - Hero banner
4. **Store Name** - Display name
5. **Description** - About store

### Pre-made Themes
- 🔵 **Blue Ocean** (Default)
- 🟢 **Green Fresh** (Food & beverage)
- 🟣 **Purple Luxury** (Fashion)
- 🟠 **Orange Energy** (Electronics)
- 🔴 **Red Passion** (Restaurant)

---

## 📝 WhatsApp Message Template

```
Halo *[STORE_NAME]*, saya mau pesan:

📦 *Pesanan:*
[PRODUCT_LIST]

💰 *Total: Rp [TOTAL_AMOUNT]*

👤 *Data Pembeli:*
Nama: [CUSTOMER_NAME]
HP: [CUSTOMER_PHONE]
Alamat: [CUSTOMER_ADDRESS]

🚚 Metode: [DELIVERY_METHOD]

📝 Catatan: [CUSTOMER_NOTES]

Terima kasih!

---
Dipesan via Katalara Lapak Online
[STORE_URL]
```

---

## 🎯 Success Metrics

### For UMKM Owner
- Increase online sales
- Reduce manual order taking
- Professional online presence
- Easy to share & market
- Track customer behavior

### For Customers
- Easy browsing experience
- Fast checkout (< 2 min)
- Direct communication with seller
- Mobile-friendly
- No registration required

---

**Status:** 📋 Konsep Complete  
**Next Step:** Build storefront page & components  
**Timeline:** 2-3 days for MVP

Mari kita mulai implementasi! 🚀
