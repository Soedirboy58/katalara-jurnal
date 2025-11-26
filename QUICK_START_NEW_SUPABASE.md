# 🚀 QUICK START - Deploy ke Supabase Baru

## Status Saat Ini ✅

- ✅ Frontend refactored (Income module: 3140 → 185 lines)
- ✅ .env.local updated dengan credentials baru
- ✅ SQL deployment scripts ready
- ✅ Git pushed (commit: 616fc23)

---

## 📝 Langkah Deployment (5-10 menit)

### **Step 1: Buka Supabase Dashboard**

1. Buka https://supabase.com/dashboard
2. Pilih project: `zhuxonyuksnhplxinikl`
3. Klik **SQL Editor** di sidebar kiri

### **Step 2: Deploy Database Schema**

**Cara Cepat (All-in-One)**:

1. Buka file: `sql/deploy_all_in_one.sql`
2. Copy **SELURUH ISI** file (600 lines)
3. Paste ke SQL Editor
4. Klik **Run** (atau tekan Ctrl+Enter)
5. Tunggu ~30 detik sampai selesai
6. Lihat hasil di Output panel

**Expected Output**:
```
✅ DEPLOYMENT SUCCESSFUL!
10 tables created

Table Name              | Domain
------------------------|------------------
business_profiles       | 🔵 CORE
onboarding_steps        | 🔵 CORE
products                | 📦 INVENTORY
product_stock_movements | 📦 INVENTORY
customers               | 💰 FINANCE
suppliers               | 💰 FINANCE
incomes                 | 💰 FINANCE
income_items            | 💰 FINANCE
expenses                | 💰 FINANCE
expense_items           | 💰 FINANCE
```

**Alternatif (Step-by-Step)**:
- Ikuti guide di: `sql/DEPLOY_TO_NEW_SUPABASE.md`
- Deploy per domain (CORE → INVENTORY → FINANCE)

### **Step 3: Verify Deployment**

Run query ini di SQL Editor:

```sql
-- Check semua tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS enabled (harus semua true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🧪 Testing Frontend

### **Step 1: Run Development Server**

```bash
cd katalara-nextjs
npm run dev
```

Buka: http://localhost:3000

### **Step 2: Test User Registration**

1. Klik **Sign Up** / **Daftar**
2. Isi email & password
3. Check email untuk konfirmasi (atau langsung login jika email confirmation disabled)
4. Login dengan credentials baru

### **Step 3: Test Business Profile**

1. Setelah login, akan redirect ke onboarding atau dashboard
2. Isi business profile (nama usaha, telepon, alamat)
3. Submit

Verify di Supabase:
```sql
SELECT * FROM business_profiles;
```

### **Step 4: Test Income Module (Refactored!)**

1. Buka: http://localhost:3000/dashboard/input-income
2. Test form input:
   - Pilih tanggal transaksi
   - Pilih tipe pendapatan (Operating)
   - Masukkan customer name atau centang "Anonim"
   - Tambah line item:
     - Nama produk
     - Quantity
     - Harga per unit
   - Lihat summary (subtotal, diskon, PPN, total)
   - Klik **Simpan Transaksi**

3. Check database:
```sql
-- Check income record
SELECT * FROM incomes ORDER BY created_at DESC LIMIT 1;

-- Check income items
SELECT * FROM income_items ORDER BY created_at DESC LIMIT 5;
```

4. Test table features:
   - Pagination
   - Filter by date
   - Delete transaction
   - Print invoice (if modal opens)

---

## ✅ Success Checklist

- [ ] Supabase SQL deployment berhasil (10 tables)
- [ ] RLS policies enabled (all tables)
- [ ] Dev server running (npm run dev)
- [ ] User registration berhasil
- [ ] Business profile tersimpan
- [ ] Income form terbuka tanpa error
- [ ] Transaction berhasil disimpan
- [ ] Data muncul di table
- [ ] Database record tersimpan (check SQL)
- [ ] No console errors di browser

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Check .env.local sudah benar
- Restart dev server (Ctrl+C, lalu npm run dev)

### Error: "relation does not exist"
- Schema belum di-deploy
- Run `sql/deploy_all_in_one.sql` di Supabase SQL Editor

### Error: "permission denied for table"
- RLS policies belum di-deploy
- Check `deploy_all_in_one.sql` sudah dijalankan lengkap

### Error: "new row violates row-level security policy"
- User belum login / auth.uid() null
- Logout dan login ulang
- Check browser cookies

### Form tidak muncul / blank page
- Check browser console (F12)
- Check TypeScript errors: `npm run type-check`
- Check file ada: `src/app/dashboard/input-income/page.tsx`

---

## 🎯 Next Steps Setelah Testing Berhasil

### **Phase 3: Expenses Module Refactoring**

Refactor `app/dashboard/input-expense/page.tsx` (~2,765 lines) dengan pattern yang sama:

**To Create**:
- `modules/finance/components/expenses/ExpensesForm.tsx`
- `modules/finance/components/expenses/ExpenseItemsBuilder.tsx`
- `modules/finance/components/expenses/ExpensesTableWrapper.tsx`
- `modules/finance/hooks/useExpenses.ts`

**Target**: ~200 lines page wrapper, 90% reduction

---

## 📞 Support

**Documentation**:
- Frontend structure: `frontend-STRUCTURE.md`
- Income refactoring report: `INCOME_MODULE_REFACTORING_COMPLETED.md`
- SQL deployment guide: `sql/DEPLOY_TO_NEW_SUPABASE.md`

**Quick Links**:
- Supabase Dashboard: https://supabase.com/dashboard/project/zhuxonyuksnhplxinikl
- SQL Editor: https://supabase.com/dashboard/project/zhuxonyuksnhplxinikl/sql/new
- Logs: https://supabase.com/dashboard/project/zhuxonyuksnhplxinikl/logs/explorer

---

**Estimated Time**: 
- Database deployment: 5 minutes
- Frontend testing: 10 minutes
- **Total**: 15 minutes

**Ready to go?** 🚀

1. Deploy `sql/deploy_all_in_one.sql` ke Supabase
2. Run `npm run dev`
3. Test Income module
4. Report hasil testing
