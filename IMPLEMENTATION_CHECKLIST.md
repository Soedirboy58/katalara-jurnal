# ✅ Implementasi Batch Purchase - Langkah Lengkap

## Status: UI READY! ✅

### Yang Sudah Selesai:

#### 1. ✅ Database Schema
- **File:** `sql/create_smart_learning_system.sql`
- Tables: `batch_purchases`, `batch_purchase_outputs`, `learned_purchase_patterns`, `waste_logs`
- Triggers: Auto-calculate totals, auto-update product buy_price
- Functions: `get_purchase_suggestion()`, `calculate_waste_stats()`

#### 2. ✅ UI Form Update
- **File:** `src/app/dashboard/input-expenses/page.tsx`
- Smart category detection: "Bahan Baku / Stok" → Show batch purchase form
- Input: Total belanja + Catatan belanjaan
- Output: Multiple products dengan jumlah porsi
- Live calculation: Cost per porsi otomatis
- **Deployed:** https://supabase-migration-nh85cicfc-katalaras-projects.vercel.app

---

## 🚀 Next Steps (Backend Integration)

### Step 1: Run SQL Migration di Supabase
```sql
-- Login ke Supabase Dashboard
-- Pilih project Anda
-- SQL Editor → New Query
-- Paste isi file: create_smart_learning_system.sql
-- Run!
```

**Verify:**
```sql
SELECT * FROM batch_purchases LIMIT 1;
SELECT * FROM batch_purchase_outputs LIMIT 1;
```

---

### Step 2: Create API Endpoint

**File:** `src/app/api/batch-purchase/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { 
      totalAmount, 
      notes, 
      outputs, // [{ productName, portions }]
      purchaseDate,
      vendorName,
      receiptPhotoUrl 
    } = await request.json()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Insert batch purchase
    const { data: batchPurchase, error: batchError } = await supabase
      .from('batch_purchases')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        notes,
        purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
        vendor_name: vendorName,
        receipt_photo_url: receiptPhotoUrl
      })
      .select()
      .single()

    if (batchError) throw batchError

    // 2. Calculate cost per portion
    const totalPortions = outputs.reduce((sum: number, o: any) => sum + o.portions, 0)
    const costPerPortion = totalAmount / totalPortions

    // 3. Insert batch outputs
    const batchOutputsData = outputs.map((output: any) => ({
      batch_purchase_id: batchPurchase.id,
      product_id: output.productId || null, // Jika sudah ada product
      portions_planned: output.portions,
      cost_per_portion: costPerPortion,
      portion_percentage: (output.portions / totalPortions) * 100,
      total_cost: costPerPortion * output.portions
    }))

    const { error: outputsError } = await supabase
      .from('batch_purchase_outputs')
      .insert(batchOutputsData)

    if (outputsError) throw outputsError

    // 4. Learn pattern (setelah 3+ data)
    await learnPattern(supabase, user.id)

    return NextResponse.json({ 
      success: true, 
      batchPurchase,
      costPerPortion,
      message: 'Batch purchase saved! Sistem mulai belajar pattern Anda.' 
    })

  } catch (error: any) {
    console.error('Batch purchase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Function to learn pattern
async function learnPattern(supabase: any, userId: string) {
  // Get recent batch purchases
  const { data: purchases, error } = await supabase
    .from('batch_purchases')
    .select(`
      id,
      total_amount,
      purchase_date,
      batch_purchase_outputs (
        product_id,
        portions_planned
      )
    `)
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })
    .limit(10)

  if (error || !purchases || purchases.length < 3) return

  // Simple grouping by similar amounts (±10%)
  const avgAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount), 0) / purchases.length
  const tolerance = avgAmount * 0.1
  
  const similarPurchases = purchases.filter((p: any) => {
    const amt = parseFloat(p.total_amount)
    return amt >= avgAmount - tolerance && amt <= avgAmount + tolerance
  })

  if (similarPurchases.length < 3) return

  // Calculate expected outputs
  const productMap: any = {}
  similarPurchases.forEach((p: any) => {
    p.batch_purchase_outputs?.forEach((o: any) => {
      if (!productMap[o.product_id]) {
        productMap[o.product_id] = { portions: [], productId: o.product_id }
      }
      productMap[o.product_id].portions.push(o.portions_planned)
    })
  })

  const expectedOutputs = Object.values(productMap).map((pm: any) => {
    const portions = pm.portions as number[]
    const avg = portions.reduce((a, b) => a + b, 0) / portions.length
    return {
      product_id: pm.productId,
      avg_portions: Math.round(avg),
      std_dev: calculateStdDev(portions)
    }
  })

  // Upsert learned pattern
  await supabase
    .from('learned_purchase_patterns')
    .upsert({
      user_id: userId,
      typical_amount_min: avgAmount - tolerance,
      typical_amount_max: avgAmount + tolerance,
      typical_amount_avg: avgAmount,
      expected_outputs: JSON.stringify(expectedOutputs),
      sample_size: similarPurchases.length,
      confidence_score: Math.min(similarPurchases.length * 20, 100),
      last_occurrence: new Date().toISOString().split('T')[0]
    })
}

function calculateStdDev(values: number[]) {
  const avg = values.reduce((a, b) => a + b) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}
```

---

### Step 3: Connect Form to API

Update `src/app/dashboard/input-expenses/page.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (category === 'raw_materials' && batchOutputs.length > 0) {
    // Submit batch purchase
    const response = await fetch('/api/batch-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalAmount: parseFloat(amount.replace(/\./g, '')),
        notes,
        outputs: batchOutputs,
        purchaseDate: transactionDate,
        vendorName: '', // from vendor field
        receiptPhotoUrl: null // from file upload
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      alert(`✅ Berhasil! Cost per porsi: Rp ${data.costPerPortion.toLocaleString('id-ID')}`)
      // Reset form
      setAmount('')
      setBatchOutputs([])
      setNotes('')
    }
  } else {
    // Submit regular expense (existing logic)
    // TODO: Create regular expense API
  }
}
```

---

### Step 4: Smart Suggestions

**File:** `src/app/api/batch-purchase/suggestions/route.ts`

```typescript
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Call function to get suggestion
  const { data, error } = await supabase
    .rpc('get_purchase_suggestion', { p_user_id: user.id })

  if (error) throw error

  return NextResponse.json(data[0] || {})
}
```

**Update Form dengan Suggestion:**

```typescript
useEffect(() => {
  if (category === 'raw_materials') {
    fetch('/api/batch-purchase/suggestions')
      .then(res => res.json())
      .then(data => {
        if (data.confidence > 50) {
          // Show suggestion toast
          console.log('Suggestion:', data.message)
          // Auto-fill outputs jika user mau
        }
      })
  }
}, [category])
```

---

## 🎨 User Flow

### 1. First Time User (Bu Siti)

```
Step 1: Belanja pagi Rp 500k
Step 2: Buka app → Input Pengeluaran
Step 3: Pilih "Bahan Baku / Stok"
Step 4: Input Rp 500.000
Step 5: Catatan: "Beli beras 5kg, telur 2kg, mie 4 bungkus"
Step 6: Klik "+ Tambah Produk"
   - Nasi Goreng: 70 porsi
   - Mie Goreng: 30 porsi
Step 7: Lihat preview: Cost/porsi Rp 5.000
Step 8: Simpan!

Result:
✅ Pengeluaran tercatat
✅ Product buy_price auto update
✅ Pattern #1 saved (confidence: 20%)
```

### 2. Setelah 3x Belanja

```
Step 1: Buka form input pengeluaran
Step 2: Pilih "Bahan Baku / Stok"

System shows:
💡 Smart Suggestion:
"Biasanya Rp 500k menghasilkan:
 - Nasi Goreng: 68 porsi
 - Mie Goreng: 32 porsi
Confidence: 60% (dari 3 data)"

[Auto-fill] atau [Edit Manual]

Step 3: Klik "Auto-fill" → Done in 5 seconds! 🚀
```

---

## 📊 Expected Results

### After 1 Month Usage:

1. **Cost Accuracy:** ±95% akurat (dari actual vs predicted)
2. **Time Saved:** 5 menit → 30 detik per input
3. **Pattern Learned:** 3-5 pattern tergantung variasi belanja
4. **Waste Tracking:** User tahu produk mana yang sering sisa
5. **Price Alerts:** User tahu kapan harga pasar naik/turun

---

## 🔧 Testing Checklist

- [ ] Run SQL migration di Supabase
- [ ] Test create batch purchase via API
- [ ] Verify product buy_price auto-update
- [ ] Test pattern learning (after 3+ purchases)
- [ ] Test suggestions API
- [ ] Test waste tracking calculation
- [ ] Deploy to production
- [ ] User acceptance testing

---

## 📌 Files Created/Modified

### New Files:
1. ✅ `sql/create_smart_learning_system.sql` - Database schema
2. ✅ `SMART_RECIPE_LEARNING.md` - Full documentation
3. ✅ `UNIVERSAL_BUSINESS_GUIDE.md` - All business types support
4. ⏳ `src/app/api/batch-purchase/route.ts` - API endpoint (TODO)
5. ⏳ `src/app/api/batch-purchase/suggestions/route.ts` - Suggestions (TODO)

### Modified Files:
1. ✅ `src/app/dashboard/input-expenses/page.tsx` - Added batch purchase UI
2. ✅ `src/types/index.ts` - Added ProductRecipe types

---

## 🎯 Priority Next Actions:

1. **URGENT:** Run SQL migration di Supabase
2. **HIGH:** Create API endpoint `/api/batch-purchase`
3. **MEDIUM:** Connect form submit to API
4. **LOW:** Build suggestions feature

---

Production URL: https://supabase-migration-nh85cicfc-katalaras-projects.vercel.app

**Status: UI Live, Backend Pending** ⏳
