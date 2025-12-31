# Product Synchronization Testing Guide

## Overview
This guide provides step-by-step instructions for testing the product synchronization feature between Input-Expense, Products, and Input-Income.

## Prerequisites
1. Database migrations must be applied:
   ```bash
   # Apply the get_products_with_stock migration
   psql -f sql/02-migrations/2025-12-31-add-get-products-with-stock-function.sql
   ```

2. Ensure the following database functions exist:
   - `record_stock_movement()`
   - `get_current_stock()`
   - `get_products_with_stock()`

## Test Case 1: Add New Product via Input Expense ✅

### Objective
Verify that a new product can be created from the expense form and automatically synced to the products table.

### Steps
1. Navigate to **Input Expense** page (`/dashboard/input-expenses`)
2. Fill in basic expense information:
   - Transaction Date: Today
   - Category Type: Operating
   - Category: Bahan Baku (Raw Materials)
3. In the Items section, click **"+ Buat Produk Baru"**
4. Fill in the product modal:
   - Name: "Teh Hijau"
   - Cost Price: 30000
   - Selling Price: 45000
   - Unit: kg
   - Track Inventory: ✓ (checked)
   - Min Stock Alert: 5
5. Click **Save** in the modal
6. Observe:
   - ✅ Product should be auto-selected in the expense form
   - ✅ Price per unit should be auto-filled with 30000
   - ✅ Unit should be set to "kg"
7. Add quantity: 20
8. Click **"+ Tambah"** to add the item
9. Submit the expense
10. Verify in database:
    ```sql
    SELECT * FROM products WHERE name = 'Teh Hijau';
    -- Should show: cost_price=30000, selling_price=45000, unit='kg'
    
    SELECT * FROM product_stock_movements WHERE product_id = '<product_id>';
    -- Should show: quantity=20, movement_type='in'
    
    SELECT get_current_stock('<product_id>');
    -- Should return: 20
    ```

### Expected Results
- ✅ Product "Teh Hijau" exists in products table
- ✅ `cost_price` = 30000, `selling_price` = 45000
- ✅ Stock movement recorded: +20 kg
- ✅ Current stock: 20 kg
- ✅ Product appears in Input Income dropdown

---

## Test Case 2: Update Cost Price via Input Expense ✅

### Objective
Verify that purchasing an existing product updates its cost price and increases stock.

### Steps
1. Navigate to **Input Expense** page
2. Select expense category: Bahan Baku
3. In the product dropdown, search and select **"Kopi Arabica"** (or "Teh Hijau" from Test Case 1)
4. Notice the auto-filled cost price (previous purchase price)
5. Change the price per unit to **55000** (simulating price increase from supplier)
6. Set quantity: **30 kg**
7. Add item and submit expense
8. Verify in database:
    ```sql
    SELECT cost_price, updated_at FROM products WHERE name = 'Kopi Arabica';
    -- Should show: cost_price=55000, updated_at=<recent timestamp>
    
    SELECT * FROM product_stock_movements 
    WHERE product_id = '<product_id>' 
    ORDER BY created_at DESC LIMIT 1;
    -- Should show: quantity=30, movement_type='in'
    
    SELECT get_current_stock('<product_id>');
    -- Should return: previous_stock + 30
    ```

### Expected Results
- ✅ `products.cost_price` = 55000 (updated from previous value)
- ✅ `products.updated_at` is recent
- ✅ Stock movement: +30 kg
- ✅ Current stock = previous + 30 kg
- ✅ `expense_items` contains snapshot with price 55000

---

## Test Case 3: Sell Product with Profit Tracking ✅

### Objective
Verify that selling a product auto-fills prices, calculates profit, and reduces stock.

### Steps
1. Navigate to **Input Income** page (`/dashboard/input-income`)
2. Select income category: **Product Sales**
3. In the product selection dropdown, choose **"Kopi Arabica"**
4. Observe auto-filled values:
   - ✅ Price per unit = 75000 (from `products.selling_price`)
   - ✅ Unit = "kg" (from `products.unit`)
5. Set quantity: **15**
6. Notice in the items table:
   - Harga Jual: Rp 75,000
   - Harga Beli: Rp 55,000 (from `products.cost_price`)
   - Profit: Rp 20,000 per kg
   - Total Profit: Rp 300,000 (green text)
7. Submit the income transaction
8. Verify in database:
    ```sql
    SELECT * FROM income_items WHERE product_id = '<product_id>' 
    ORDER BY created_at DESC LIMIT 1;
    -- Should show: price_per_unit=75000, buy_price=55000
    
    SELECT * FROM product_stock_movements 
    WHERE product_id = '<product_id>' AND movement_type = 'out'
    ORDER BY created_at DESC LIMIT 1;
    -- Should show: quantity=15, movement_type='out'
    
    SELECT get_current_stock('<product_id>');
    -- Should return: previous_stock - 15
    ```

### Expected Results
- ✅ Auto-fill works correctly (selling_price, cost_price, unit)
- ✅ Profit calculation: 20,000 per unit, 300,000 total
- ✅ Stock movement: -15 kg
- ✅ Current stock reduced by 15 kg
- ✅ Profit data saved in income_items

---

## Test Case 4: Stock Insufficient Validation ✅

### Objective
Verify that the system prevents selling more than available stock.

### Steps
1. Navigate to **Input Income** page
2. Select **"Teh Hijau"** (current stock should be 20 kg from Test Case 1)
3. Attempt to add quantity: **25 kg** (more than available)
4. Click **"+ Tambah"**
5. Observe validation:
   - ❌ Alert should appear: "⚠️ Stok tidak cukup! Stok tersedia: 20 kg, Yang diminta: 25 kg"
   - ❌ Item should NOT be added to the transaction
6. Change quantity to **10 kg** (within stock)
7. Click **"+ Tambah"** again
8. ✅ Item should be added successfully

### Expected Results
- ✅ Alert shown when quantity exceeds stock
- ✅ Transaction prevented from proceeding
- ✅ Valid quantity allowed to proceed

---

## Test Case 5: Sell Below Cost Price Warning ⚠️

### Objective
Verify that users are warned when selling below cost price.

### Steps
1. Navigate to **Input Income** page
2. Select a product with known cost price (e.g., "Kopi Arabica" with cost_price=55000)
3. Manually change the selling price to **50000** (below cost price)
4. Set quantity: **5**
5. Click **"+ Tambah"**
6. Observe confirmation dialog:
   - ⚠️ Warning message appears
   - Shows: Harga Beli: Rp 55,000
   - Shows: Harga Jual: Rp 50,000
   - Shows: Rugi per unit: Rp 5,000
   - Asks: "Apakah Anda yakin ingin melanjutkan?"
7. Click **Cancel** - item should NOT be added
8. Repeat and click **OK** - item SHOULD be added with negative profit

### Expected Results
- ✅ Warning shown when price < cost_price
- ✅ User can cancel the operation
- ✅ User can proceed if intentional (e.g., clearance sale)
- ✅ Negative profit displayed in red in the table

---

## Test Case 6: Duplicate Product Prevention ✅

### Objective
Verify that the same product cannot be added twice in one transaction.

### Steps
**For Input Expense:**
1. Add "Kopi Arabica" with qty 10
2. Try to add "Kopi Arabica" again with qty 5
3. ❌ Alert should appear: "Produk 'Kopi Arabica' sudah ada dalam daftar!"

**For Input Income:**
1. Add "Teh Hijau" with qty 5
2. Try to add "Teh Hijau" again with qty 3
3. ❌ Alert should appear: "Produk 'Teh Hijau' sudah ada dalam daftar!"

### Expected Results
- ✅ Duplicate detection works in both expense and income forms
- ✅ Clear error message shown
- ✅ Transaction integrity maintained

---

## Test Case 7: Real-time Stock Display in Dropdown 📊

### Objective
Verify that product dropdowns show current stock and status.

### Steps
1. Navigate to **Input Expense** page
2. Click on the product dropdown (or start typing)
3. Observe each product entry shows:
   - Product name
   - Unit (e.g., "kg", "pcs")
   - **Current stock** (e.g., "Stok: 40 kg")
   - Stock status indicator:
     - 🟢 Green for sufficient stock
     - 🟡 Yellow with ⚠️ for low stock (< min_stock_alert)
     - 🔴 Red for out of stock (0)
   - Cost price for expenses / Selling price for income

### Expected Results
- ✅ All products show real-time stock
- ✅ Color-coded status indicators
- ✅ Low stock warning visible
- ✅ Stock updated after transactions

---

## Integration Test: Full Workflow 🔄

### Objective
Test the complete flow from purchase to sale with profit tracking.

### Steps
1. **Purchase Product**
   - Create expense for 50 kg "Kopi Arabica" @ Rp 50,000/kg
   - Verify: cost_price = 50000, stock = 50
2. **Update Price**
   - Purchase another 30 kg @ Rp 55,000/kg
   - Verify: cost_price = 55000, stock = 80
3. **First Sale**
   - Sell 20 kg @ Rp 75,000/kg
   - Verify: profit = 20,000/kg, stock = 60
4. **Second Sale**
   - Sell 15 kg @ Rp 75,000/kg
   - Verify: profit = 20,000/kg, stock = 45
5. **Check Stock Movement History**
   ```sql
   SELECT * FROM product_stock_movements 
   WHERE product_id = '<kopi_arabica_id>' 
   ORDER BY created_at;
   ```
   Should show:
   - IN: +50 (first purchase)
   - IN: +30 (second purchase)
   - OUT: -20 (first sale)
   - OUT: -15 (second sale)
6. **Verify Profit Tracking**
   ```sql
   SELECT SUM((price_per_unit - buy_price) * qty) as total_profit
   FROM income_items
   WHERE product_id = '<kopi_arabica_id>';
   ```
   Should return: 700,000 (35 kg × 20,000)

### Expected Results
- ✅ All stock movements recorded correctly
- ✅ Cost price updates on new purchases
- ✅ Profit calculated accurately
- ✅ Stock balance matches expectations

---

## Troubleshooting

### Issue: Products not showing in dropdown
**Solution:**
- Check if products are active: `SELECT * FROM products WHERE is_active = TRUE`
- Verify RPC function exists: `SELECT get_products_with_stock('<user_id>')`

### Issue: Stock not updating
**Solution:**
- Check if `record_stock_movement` function exists
- Verify permissions: User must have EXECUTE on the function
- Check trigger on product_stock_movements table

### Issue: Profit not calculating
**Solution:**
- Ensure `cost_price` is set in products table
- Verify `buy_price` is being passed in LineItemsBuilder
- Check income_items table has buy_price column

---

## Success Metrics

All test cases should pass with:
- ✅ 100% data integrity (no orphaned records)
- ✅ Accurate stock calculations
- ✅ Correct profit tracking
- ✅ Proper validation prevents errors
- ✅ User-friendly error messages
- ✅ Real-time UI updates

---

## Next Steps After Testing

1. **Monitor Production Usage**
   - Track stock movement accuracy
   - Monitor profit calculation correctness
   - Check for edge cases reported by users

2. **Performance Optimization** (if needed)
   - Index optimization on product_stock_movements
   - Cache frequently accessed products
   - Optimize RPC function queries

3. **Feature Enhancements** (future)
   - Batch stock adjustments
   - Stock transfer between locations
   - Low stock email notifications
   - Profit margin analytics dashboard

---

## Contact

For issues or questions about product synchronization:
- Check code in: `src/app/dashboard/input-expenses/page.tsx`
- Check code in: `src/app/dashboard/input-income/page.tsx`
- Database functions: `sql/domain/inventory/`
- Migration: `sql/02-migrations/2025-12-31-add-get-products-with-stock-function.sql`
