# Input Income - 5 Critical Improvements

## Status: Partially Implemented ✅❌

---

## **1. ✅ FIXED: Custom Unit Input**
**Problem**: Dropdown satuan terbatas (pcs, kg, jam, dll) → user tidak bisa input "rim", "kodi", "bungkus", "rol", dll.

**Solution Implemented**:
- ✅ Added "➕ Satuan Lain..." option at bottom of unit dropdown
- ✅ When selected, shows text input for custom unit
- ✅ Custom value saved to product and reused in form
- ✅ Works for both physical products and services

**Code Changes**:
- Added state: `customUnitValue`
- Updated dropdown to include `<option value="__CUSTOM__">➕ Satuan Lain...</option>`
- Conditional input shown when `quickProductUnit === '__CUSTOM__'`
- Logic in `handleQuickAddProduct()` uses `finalUnit = quickProductUnit === '__CUSTOM__' ? customUnitValue : quickProductUnit`

---

## **2. ✅ FIXED: Buy Price Only for Physical Products**
**Problem**: Service/jasa diminta input "harga beli" → tidak relevan (jasa tidak ada COGS)

**Solution Implemented**:
- ✅ Conditional rendering: `{quickAddType === 'physical' && <div>Harga Beli...</div>}`
- ✅ Validation updated: buy price only required for physical products
- ✅ For services, `buyPrice = 0` automatically
- ✅ Label changed: "Harga Jual" for products, "Harga Layanan" for services

**Code Changes**:
- Wrapped buy price field in `{quickAddType === 'physical' && (...)}`
- Updated validation: `if (quickAddType === 'physical' && !quickProductBuyPrice) {...}`
- Set `buyPrice = quickAddType === 'physical' ? parseFloat(...) : 0`

---

## **3. ✅ FIXED: Unit Field Locked After Product Selected**
**Problem**: User bisa ganti satuan setelah pilih produk → inkonsisten dengan database produk

**Solution Implemented**:
- ✅ Unit field changed from dropdown to **read-only text input**
- ✅ Value auto-populated from product database when product selected
- ✅ Background gray + cursor not-allowed to show it's locked
- ✅ Helpful message: "🔒 Satuan otomatis dari data produk. Edit di menu Produk jika perlu ubah."

**Code Changes**:
```tsx
<input
  type="text"
  value={customUnit}
  readOnly
  disabled={!selectedProductId}
  className="...bg-gray-100...cursor-not-allowed"
  placeholder="Pilih produk dulu"
/>
```

---

## **4. ❌ TODO: Customer Database & Modal Selector**
**Problem**: 
- No customer address field
- No customer ID/number
- No database of saved customers
- No anonymous option for users who don't need customer tracking

**Solution Required**:
### A. Database Schema (SQL Ready)
- ✅ Created `sql/create_customers_table.sql`:
  ```sql
  CREATE TABLE customers (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES auth.users,
    customer_number VARCHAR(50) UNIQUE, -- CUST-001, CUST-002
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    company_name VARCHAR(255),
    tax_id VARCHAR(50), -- NPWP
    total_transactions INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_transaction_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  ALTER TABLE incomes ADD COLUMN customer_id UUID REFERENCES customers(id);
  ```

### B. UI Components Needed
1. **Customer Input Button** (replace text input):
   ```tsx
   <button onClick={() => setShowCustomerModal(true)}>
     {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : 'Pilih Pelanggan'}
   </button>
   <label>
     <input type="checkbox" checked={isAnonymous} onChange={...} />
     Anonymous (Tanpa Nama)
   </label>
   ```

2. **Customer Selector Modal**:
   - Search bar
   - List of existing customers (name, phone, last transaction)
   - "➕ Tambah Pelanggan Baru" button
   - "Skip (Anonymous)" option

3. **Quick Add Customer Modal**:
   ```tsx
   Fields:
   - Nama Pelanggan *
   - No. Telepon/WhatsApp *
   - Email (optional)
   - Alamat (optional)
   - Nama Perusahaan (optional)
   - NPWP (optional)
   ```

### C. Functions Needed
```typescript
// Fetch customers
const fetchCustomers = async () => {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('owner_id', user.id)
    .order('name')
  setCustomers(data || [])
}

// Quick add customer
const handleQuickAddCustomer = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  // Generate customer number
  const customerNumber = await generateCustomerNumber(user.id)
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      owner_id: user.id,
      customer_number: customerNumber,
      name: quickCustomerName,
      phone: quickCustomerPhone,
      email: quickCustomerEmail,
      address: quickCustomerAddress
    })
    .select()
    .single()
  
  if (!error) {
    setSelectedCustomerId(data.id)
    setCustomerName(data.name)
    setCustomerPhone(data.phone)
    fetchCustomers() // Refresh list
  }
}

// Generate customer number
const generateCustomerNumber = async (userId: string) => {
  const { data } = await supabase
    .rpc('generate_customer_number', { user_id: userId })
  return data // Returns "CUST-001", "CUST-002", etc
}
```

### D. Integration with handleSubmit
```typescript
const handleSubmit = async (e) => {
  // ...existing code...
  
  const incomeData = {
    // ...existing fields...
    customer_id: isAnonymous ? null : selectedCustomerId,
    customer_name: isAnonymous ? null : customerName,
    customer_phone: isAnonymous ? null : customerPhone
  }
  
  // After successful save, update customer stats
  if (selectedCustomerId && !isAnonymous) {
    await supabase.rpc('update_customer_stats', {
      customer_id: selectedCustomerId,
      transaction_amount: calculateGrandTotal()
    })
  }
}
```

---

## **5. ✅ CONFIRMED: Cross-Module Sync**
**Question**: Apakah quick add di Input Pendapatan otomatis masuk ke menu lain?

**Answer**:
- ✅ **Products**: YA - Quick add produk/layanan langsung masuk ke database `products` table, otomatis muncul di menu Produk
- ❌ **Customers**: BELUM - Karena belum ada table customers (point #4 harus dikerjakan dulu)
- ✅ **Transactions**: YA - Setiap save pendapatan masuk ke `incomes` table, otomatis muncul di TransactionsTable component

**Implementation**:
```typescript
// Product quick add - already synced ✅
await supabase.from('products').insert(productData)
await refreshProducts() // Re-fetch from database

// Customer quick add - needs implementation ❌
await supabase.from('customers').insert(customerData)
await fetchCustomers() // Re-fetch from database

// Transaction save - already synced ✅
await fetch('/api/income', { method: 'POST', body: incomeData })
await fetchTransactions() // Refresh table
```

---

## **Implementation Priority**

### **Phase 1: Completed ✅**
- [x] Custom unit input with "Satuan Lain..."
- [x] Conditional buy price (only for physical products)
- [x] Lock unit field after product selected
- [x] Update validation logic
- [x] Create customers table SQL migration

### **Phase 2: TODO (High Priority) 🔴**
- [ ] Run `create_customers_table.sql` migration in Supabase
- [ ] Add customer state variables (DONE ✅)
- [ ] Create `fetchCustomers()` function
- [ ] Create Customer Selector Modal UI
- [ ] Create Quick Add Customer Modal UI
- [ ] Implement `handleQuickAddCustomer()`
- [ ] Update header customer input to button
- [ ] Add anonymous checkbox
- [ ] Integrate customer_id in handleSubmit
- [ ] Create customer stats update RPC function

### **Phase 3: Polish (Medium Priority) 🟡**
- [ ] Add customer search in modal
- [ ] Add customer edit functionality
- [ ] Add customer transaction history view
- [ ] Add customer filters (active/inactive)
- [ ] Mobile responsive customer modal

---

## **Files Changed**

1. ✅ `page.tsx` - Added states, updated validation, locked unit, custom unit input
2. ✅ `create_customers_table.sql` - Database schema for customers
3. ❌ `page.tsx` - Customer modal (TODO)
4. ❌ `/api/customers/route.ts` - CRUD API for customers (TODO)

---

## **Testing Checklist**

### Completed Features ✅
- [x] Quick add physical product without custom unit
- [x] Quick add physical product with custom unit ("rim", "kodi", etc)
- [x] Quick add service without buy price (should skip)
- [x] Quick add service with custom unit
- [x] Unit field locked after product selected
- [x] Unit field shows gray background when locked
- [x] Validation: buy price required only for physical
- [x] Custom unit value saved to product
- [x] Custom unit appears in form after save

### Pending Features ❌
- [ ] Run customers migration
- [ ] Open customer modal from header
- [ ] Select existing customer from list
- [ ] Quick add new customer from modal
- [ ] Anonymous checkbox disables customer fields
- [ ] Customer data saved to database
- [ ] Customer ID linked to income record
- [ ] Customer appears in Pelanggan menu (once built)
- [ ] Customer stats auto-update after transaction

---

## **User Guide Summary**

### ✅ How to Use Custom Units
1. Click "➕ Tambah Produk/Layanan Baru" in dropdown
2. In modal, select "Satuan" dropdown
3. Scroll to bottom and select "➕ Satuan Lain..."
4. Text input appears - type custom unit (e.g., "rim", "kodi", "bungkus")
5. Fill other fields and save
6. Custom unit automatically used in form, locked after product selected

### ✅ Physical Product vs Service
- **Physical Product**: Requires buy price + sell price
- **Service**: Only sell price (buy price hidden/not required)

### ✅ Unit Field Behavior
- **Before product selected**: Disabled, placeholder "Pilih produk dulu"
- **After product selected**: Locked (gray, read-only) with message "🔒 Satuan otomatis dari data produk"
- **To change unit**: Must edit in Produk menu, not in transaction form

### ❌ Customer Management (Coming Soon)
- Click "Pilih Pelanggan" button → modal opens
- Select from existing customers OR click "➕ Tambah Baru"
- Check "Anonymous" if no customer tracking needed
- Customer address, phone, email saved for invoices
- Customer stats auto-updated (total spent, last transaction)

---

## **Next Steps**

1. **URGENT**: Run `create_customers_table.sql` in Supabase SQL Editor
2. **HIGH**: Implement customer modal UI (2-3 hours work)
3. **HIGH**: Create customer API endpoints
4. **MEDIUM**: Add customer search and filters
5. **MEDIUM**: Build dedicated Pelanggan menu page
6. **LOW**: Customer analytics dashboard

---

## **Questions for User**

1. ✅ Custom unit implementation - Approved?
2. ✅ Buy price conditional logic - Correct?
3. ✅ Unit lock behavior - Acceptable?
4. ❌ Customer modal design - Need mockup/reference image?
5. ❌ Anonymous option - Always show or only for certain categories?
6. ❌ Customer fields priority - Which are most important? (name, phone, address, email, company, tax ID)

