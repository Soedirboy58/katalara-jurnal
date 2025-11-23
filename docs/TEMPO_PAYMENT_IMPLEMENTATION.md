# TEMPO PAYMENT & SERVICE PRODUCTS - IMPLEMENTATION GUIDE

## 🎯 Overview
Update Input Pendapatan dengan 2 fitur besar:
1. **Tempo/Credit Payment** - Track piutang dengan due date
2. **Service Products** - Layanan jasa setara dengan produk fisik
3. **Transactions Table** - Tabel transaksi dengan pagination, bulk actions, print (struk/invoice), WhatsApp share

## 📋 Database Changes (SUDAH SELESAI)

### 1. Incomes Table - New Columns
```sql
-- Payment tracking
payment_type VARCHAR(20) DEFAULT 'cash'
payment_status VARCHAR(20) DEFAULT 'Lunas'
due_date DATE
customer_phone VARCHAR(20)
service_duration INTEGER

-- Indexes
CREATE INDEX idx_incomes_payment_status ON incomes(payment_status);
CREATE INDEX idx_incomes_due_date ON incomes(due_date);
```

### 2. Products Table - Service Support
```sql
ALTER TABLE products
ADD COLUMN product_type VARCHAR(20) DEFAULT 'physical',
ADD COLUMN service_duration INTEGER;

-- Sample service products
INSERT INTO products (name, product_type, price, service_duration)
VALUES
  ('Potong Rambut', 'service', 50000, 30),
  ('Service Berkala', 'service', 150000, 60),
  ('Konsultasi 1 Jam', 'service', 200000, 60);
```

## 🎨 UI Components BARU

### 1. PrintModal (`/components/income/PrintModal.tsx`) ✅ CREATED
**Features:**
- 2 modes: Struk (80mm thermal) dan Invoice (A4)
- jsPDF for PDF generation
- WhatsApp sharing integration
- Preview before print

**Usage:**
```tsx
<PrintModal
  isOpen={printModalOpen}
  onClose={() => setPrintModalOpen(false)}
  incomeData={selectedTransaction}
  businessName="Toko Saya"
/>
```

### 2. TransactionsTable (`/components/income/TransactionsTable.tsx`) ✅ CREATED
**Features:**
- Pagination (10/25/50/100 per page)
- Bulk selection with checkboxes
- Bulk actions: Preview, Delete, Print
- Status badges (Lunas/Pending/Jatuh Tempo)
- Responsive table

**Usage:**
```tsx
<TransactionsTable
  transactions={transactions}
  businessName="Toko Saya"
  onRefresh={() => fetchTransactions()}
/>
```

## 🔧 Hooks Update

### useProducts Hook - Filter by Product Type ✅ UPDATED
```tsx
// Filter physical products only
const { products } = useProducts({ productType: 'physical' })

// Filter service products only
const { products } = useProducts({ productType: 'service' })
```

## 📝 Input Pendapatan Updates (PENDING)

### New State Variables Needed:
```tsx
const [paymentType, setPaymentType] = useState<'cash' | 'tempo'>('cash')
const [tempoDays, setTempoDays] = useState(7)
const [dueDate, setDueDate] = useState('')
const [customerPhone, setCustomerPhone] = useState('')
const [transactions, setTransactions] = useState<any[]>([])
const [businessName, setBusinessName] = useState('Toko Saya')
```

### UI Sections to Add:

#### 1. Payment Method Section (setelah customer_name field)
```tsx
{/* Payment Method */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Metode Pembayaran
  </label>
  <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="Tunai">💵 Tunai</option>
    <option value="Transfer">🏦 Transfer Bank</option>
    <option value="QRIS">📱 QRIS</option>
    <option value="E-Wallet">💳 E-Wallet (GoPay, OVO, Dana)</option>
  </select>
</div>

{/* Payment Type */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Jenis Pembayaran
  </label>
  <div className="grid grid-cols-2 gap-4">
    <button
      type="button"
      onClick={() => {
        setPaymentType('cash')
        setDueDate('')
      }}
      className={`p-4 border-2 rounded-lg ${
        paymentType === 'cash'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-2xl mb-1">💵</div>
      <div className="font-semibold">Lunas</div>
      <div className="text-xs text-gray-500">Bayar langsung</div>
    </button>
    
    <button
      type="button"
      onClick={() => setPaymentType('tempo')}
      className={`p-4 border-2 rounded-lg ${
        paymentType === 'tempo'
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-2xl mb-1">📅</div>
      <div className="font-semibold">Kredit/Tempo</div>
      <div className="text-xs text-gray-500">Bayar nanti</div>
    </button>
  </div>
</div>

{/* Tempo Duration - shown when payment_type === 'tempo' */}
{paymentType === 'tempo' && (
  <>
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="font-semibold text-orange-900 mb-1">
            Pembayaran Tempo (Piutang)
          </h4>
          <p className="text-sm text-orange-800">
            Transaksi ini akan dicatat sebagai <strong>piutang</strong> yang perlu ditagih.
            Sistem akan otomatis mengingatkan saat mendekati jatuh tempo.
          </p>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Jangka Waktu Tempo
      </label>
      <div className="grid grid-cols-4 gap-2">
        {[7, 14, 30, 60].map(days => (
          <button
            key={days}
            type="button"
            onClick={() => {
              setTempoDays(days)
              const due = new Date()
              due.setDate(due.getDate() + days)
              setDueDate(due.toISOString().split('T')[0])
            }}
            className={`px-4 py-3 border-2 rounded-lg font-semibold ${
              tempoDays === days
                ? 'border-orange-500 bg-orange-50 text-orange-900'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {days} Hari
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Jatuh Tempo
      </label>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
      {dueDate && (
        <p className="text-sm text-gray-600 mt-1">
          📅 Jatuh tempo: {new Date(dueDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Nomor WhatsApp Customer <span className="text-red-500">*</span>
      </label>
      <input
        type="tel"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        placeholder="08123456789"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-1">
        Untuk reminder dan kirim invoice via WhatsApp
      </p>
    </div>
  </>
)}
```

#### 2. Service Product Selector (untuk category === 'service_income')
```tsx
{category === 'service_income' && (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pilih Layanan Jasa <span className="text-red-500">*</span>
      </label>
      <select
        value={selectedProductId}
        onChange={(e) => {
          setSelectedProductId(e.target.value)
          const product = products.find(p => p.id === e.target.value)
          if (product) {
            setPricePerUnit(product.price.toString())
          }
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">-- Pilih Layanan --</option>
        {products.map((product: any) => (
          <option key={product.id} value={product.id}>
            {product.name} - Rp {product.price.toLocaleString('id-ID')}
            {product.service_duration && ` (${product.service_duration} menit)`}
          </option>
        ))}
      </select>
      {loadingProducts && (
        <p className="text-xs text-gray-500 mt-1">Loading layanan...</p>
      )}
    </div>

    {selectedProductId && (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Sesi
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => handleNumberInput(e, setQuantity)}
              placeholder="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Harga per Sesi
            </label>
            <input
              type="text"
              value={formatNumber(pricePerUnit)}
              onChange={(e) => handleNumberInput(e, setPricePerUnit)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Total Calculation */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Pendapatan:</span>
            <span className="text-2xl font-bold text-green-700">
              Rp {calculateTotal().toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </>
    )}
  </>
)}
```

#### 3. Transaction Fetch Function
```tsx
const fetchTransactions = async () => {
  setLoadingTransactions(true)
  try {
    const response = await fetch('/api/income?limit=10')
    const result = await response.json()
    
    if (result.success) {
      setTransactions(result.data || [])
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
  } finally {
    setLoadingTransactions(false)
  }
}

// Call in useEffect
useEffect(() => {
  fetchTransactions()
}, [])
```

#### 4. Updated handleSubmit
```tsx
const payload = {
  income_date: transactionDate,
  income_type: incomeType,
  category,
  amount: finalAmount,
  description: description || null,
  notes: notes || null,
  payment_method: paymentMethod,
  // Payment tracking
  payment_type: paymentType,
  payment_status: paymentType === 'tempo' ? 'Pending' : 'Lunas',
  due_date: paymentType === 'tempo' ? dueDate : null,
  customer_phone: paymentType === 'tempo' ? customerPhone : null,
  // Product/Service specific
  product_id: ['product_sales', 'service_income'].includes(category) ? selectedProductId : null,
  quantity: ['product_sales', 'service_income'].includes(category) ? parseInt(quantity.replace(/\./g, '')) : null,
  price_per_unit: ['product_sales', 'service_income'].includes(category) ? parseInt(pricePerUnit.replace(/\./g, '')) : null,
  customer_name: customerName || null,
  service_duration: category === 'service_income' ? serviceProducts.find(p => p.id === selectedProductId)?.service_duration : null
}

const response = await fetch('/api/income', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})

if (response.ok) {
  showToast('success', '✅ Pendapatan berhasil disimpan!')
  resetForm()
  fetchKpiStats()
  fetchTransactions() // Refresh transactions table
}
```

#### 5. Replace "Recent Transactions" placeholder
```tsx
{/* Recent Transactions */}
<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
  
  {loadingTransactions ? (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-500 mt-4">Loading transaksi...</p>
    </div>
  ) : (
    <TransactionsTable
      transactions={transactions}
      businessName={businessName}
      onRefresh={fetchTransactions}
    />
  )}
</div>
```

## 🚀 NEXT STEPS

1. ✅ Run database migrations in Supabase SQL Editor:
   - `sql/create_incomes_table.sql` (updated)
   - `sql/add_service_products.sql` (new)

2. ⏳ Update `src/app/dashboard/input-income/page.tsx`:
   - Add new state variables
   - Add Payment Method & Type sections
   - Add Tempo payment warning & due date picker
   - Add Service product selector for `service_income` category
   - Update payload in handleSubmit
   - Add fetchTransactions() function
   - Replace placeholder with <TransactionsTable />

3. ⏳ Test flow:
   - Physical product sale with cash
   - Physical product sale with tempo (7 days)
   - Service income (salon) with cash
   - Service income (bengkel) with tempo (30 days)
   - Print struk vs invoice
   - WhatsApp share

4. ⏳ Deploy to Vercel
   - `npm run build` to check for errors
   - `vercel --prod` to deploy

## 📊 Expected User Flow

### Scenario 1: Penjualan Produk Tempo
1. User pilih **Operasional → Penjualan Produk**
2. Pilih produk dari dropdown
3. Input jumlah & harga
4. Input nama customer
5. Pilih metode: Transfer
6. Pilih jenis: **Kredit/Tempo**
7. Pilih: **30 Hari**
8. Input nomor WA customer: 08123456789
9. Submit → Tersimpan dengan status "Pending"
10. User bisa langsung cetak invoice & kirim ke WA

### Scenario 2: Pendapatan Jasa
1. User pilih **Operasional → Pendapatan Jasa**
2. Pilih layanan dari dropdown (Potong Rambut)
3. Input jumlah sesi: 2
4. Harga auto-fill: 50.000
5. Total: 100.000
6. Input nama customer (optional)
7. Pilih pembayaran Lunas/Tempo
8. Submit → Tersimpan
9. Muncul di tabel transaksi terakhir

### Scenario 3: Bulk Print Invoice
1. User lihat tabel transaksi terakhir
2. Centang 3 transaksi
3. Klik "Cetak"
4. Pilih mode: Invoice
5. Preview muncul
6. Download PDF atau Kirim WA

## 🎨 Brand Consistency
- Dodger Blue (#1088ff) untuk CTA buttons
- Green untuk success/lunas
- Orange untuk warning/tempo
- Red untuk overdue
- Ripe Lemon (#f1c800) untuk highlights

## 📦 Dependencies
- jsPDF ✅ INSTALLED
- All Supabase methods working
- No additional npm packages needed
