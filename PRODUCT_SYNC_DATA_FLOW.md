# Product Synchronization Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCT SYNCHRONIZATION SYSTEM                            │
│                           Data Flow Diagram                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  INPUT EXPENSE   │ (Pembelian/Purchase)
│   (page.tsx)     │
└────────┬─────────┘
         │
         │ 1. User fills expense form
         │ 2. Selects/Creates product
         │
         ▼
┌─────────────────────────────────────┐
│    QUICK ADD PRODUCT MODAL          │
│   (ProductModal.tsx)                │
│                                     │
│  ┌──────────────────────┐          │
│  │ Nama: Kopi Arabica   │          │
│  │ Harga Beli: 50000    │          │
│  │ Harga Jual: 75000    │          │
│  │ Satuan: kg           │          │
│  │ Track Inventory: ✓   │          │
│  └──────────────────────┘          │
│                                     │
│  [Save Product] ────────┐          │
└─────────────────────────┼──────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   PRODUCTS TABLE      │ ◄─── CENTRAL DATA
              │  (Master Product)     │
              │                       │
              │ • cost_price: 50000   │
              │ • selling_price: 75k  │
              │ • unit: kg            │
              │ • track_inventory: T  │
              └───────┬───────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ EXPENSE  │   │  STOCK   │   │  INCOME  │
│  ITEMS   │   │MOVEMENTS │   │  ITEMS   │
└──────────┘   └──────────┘   └──────────┘
  │                 │              │
  │ snapshot        │ tracking     │ snapshot
  │ price: 50k      │ +20 kg IN    │ price: 75k
  │                 │              │ buy_price: 50k
  │                 │              │ profit: 25k
  │                 │              │
  │                 ▼              │
  │         ┌──────────────┐      │
  │         │get_current_  │      │
  │         │  stock()     │      │
  │         │ Returns: 20  │      │
  │         └──────────────┘      │
  │                                │
  └────────────────┬───────────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │ PURCHASE COMPLETE    │
         │                      │
         │ Product: Kopi Arab.  │
         │ Qty: 20 kg           │
         │ Cost: Rp 50,000/kg   │
         │ Stock: 0 → 20 kg     │
         └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════


┌──────────────────┐
│  INPUT INCOME    │ (Penjualan/Sales)
│   (page.tsx)     │
└────────┬─────────┘
         │
         │ 1. Select product from dropdown
         │
         ▼
┌────────────────────────────────────────┐
│  useProductsWithStock Hook             │
│  (get_products_with_stock RPC)         │
│                                        │
│  Returns:                              │
│  {                                     │
│    id: "uuid",                         │
│    name: "Kopi Arabica",               │
│    cost_price: 50000,     ◄─ AUTO-FILL│
│    selling_price: 75000,  ◄─ AUTO-FILL│
│    unit: "kg",            ◄─ AUTO-FILL│
│    current_stock: 20,     ◄─ DISPLAY  │
│    stock_status: "sufficient"          │
│  }                                     │
└────────────────────────────────────────┘
         │
         │ 2. Auto-fill form
         │
         ▼
┌─────────────────────────────────────────┐
│   LineItemsBuilder                      │
│                                         │
│  Product: Kopi Arabica                  │
│  Qty: 10                                │
│  Harga Jual: Rp 75,000  (auto-filled)   │
│  Harga Beli: Rp 50,000  (auto-filled)   │
│  Unit: kg               (auto-filled)   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ VALIDATION CHECKS:               │  │
│  │ ✓ Stock available? (20 >= 10)    │  │
│  │ ✓ Price > 0?                     │  │
│  │ ✓ Qty > 0?                       │  │
│  │ ✓ No duplicates?                 │  │
│  │ ⚠️ Selling < Cost? (confirm)     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Add Item] ──────────┐                │
└───────────────────────┼─────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ PROFIT CALCULATION  │
              │                     │
              │ Profit/unit =       │
              │   75,000 - 50,000   │
              │ = Rp 25,000         │
              │                     │
              │ Total Profit =      │
              │   25,000 × 10       │
              │ = Rp 250,000        │
              └─────────┬───────────┘
                        │
                        ▼
                ┌───────────────┐
                │ SUBMIT INCOME │
                └───────┬───────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ INCOME   │ │  STOCK   │ │ INCOME   │
     │ RECORD   │ │ MOVEMENT │ │  ITEMS   │
     └──────────┘ └──────────┘ └──────────┘
      total: 750k   -10 kg OUT  buy_price: 50k
                    record_     profit: 250k
                    stock_
                    movement()
                        │
                        ▼
                  ┌──────────┐
                  │ PRODUCTS │
                  │ Table    │
                  └──────────┘
                   current_stock
                   via function:
                   20 - 10 = 10 kg


═══════════════════════════════════════════════════════════════════════════


                        STOCK MOVEMENT HISTORY
                        
┌─────────────────────────────────────────────────────────────────────────┐
│  product_stock_movements                                                │
├──────┬──────────┬──────────┬──────────┬─────────────┬──────────────────┤
│ Date │ Type     │ Quantity │ Ref Type │ Ref ID      │ Note             │
├──────┼──────────┼──────────┼──────────┼─────────────┼──────────────────┤
│ 31/12│ IN       │ +20      │ expense  │ exp_001     │ Pembelian via... │
│ 31/12│ OUT      │ -10      │ income   │ inc_001     │ Penjualan kpd... │
├──────┴──────────┴──────────┴──────────┴─────────────┴──────────────────┤
│ Current Stock = SUM(IN) - SUM(OUT) = 20 - 10 = 10 kg                   │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════


                    KEY FEATURES VISUALIZATION

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. AUTO-FILL ON PRODUCT SELECT                                        │
│     ┌──────────────┐                                                   │
│     │ Select: Kopi │ ──> Auto-fills:                                   │
│     │   Arabica    │     • Price: Rp 75,000 (selling_price)            │
│     └──────────────┘     • Unit: kg                                    │
│                          • Buy Price: Rp 50,000 (cost_price)           │
│                                                                         │
│  2. REAL-TIME STOCK DISPLAY                                            │
│     ┌────────────────────────────────────┐                             │
│     │ Kopi Arabica                       │                             │
│     │ 📦 kg | Stok: 10 kg | Rp 75,000    │                             │
│     │ ─────────────────────────────────  │                             │
│     │ Teh Hijau                          │                             │
│     │ 📦 kg | ⚠️ Stok: 3 kg (Rendah)     │                             │
│     └────────────────────────────────────┘                             │
│                                                                         │
│  3. PROFIT DISPLAY                                                     │
│     ┌────────────────────────────────────────────────────────────┐    │
│     │ Product     │ Qty │ Sell │ Buy  │ Profit │ Subtotal        │    │
│     ├─────────────┼─────┼──────┼──────┼────────┼─────────────────┤    │
│     │ Kopi Arab.  │ 10  │ 75k  │ 50k  │ 250k 🟢│ 750k            │    │
│     │ Gula Pasir  │ 5   │ 12k  │ 15k  │ -15k 🔴│ 60k             │    │
│     └─────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  4. VALIDATIONS                                                        │
│     ┌──────────────────────────────────────────┐                       │
│     │ ⚠️ Stok tidak cukup!                     │                       │
│     │    Tersedia: 10 kg                       │                       │
│     │    Diminta: 15 kg                        │                       │
│     │                                          │                       │
│     │    [OK]                                  │                       │
│     └──────────────────────────────────────────┘                       │
│                                                                         │
│     ┌──────────────────────────────────────────┐                       │
│     │ ⚠️ Harga jual lebih rendah dari beli!    │                       │
│     │    Harga Beli: Rp 50,000                 │                       │
│     │    Harga Jual: Rp 45,000                 │                       │
│     │    Rugi: Rp 5,000                        │                       │
│     │                                          │                       │
│     │    [Cancel]  [Lanjutkan]                 │                       │
│     └──────────────────────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════


                    DATABASE FUNCTIONS USED

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  get_products_with_stock(user_id)                                      │
│  ────────────────────────────────────────────────────────────          │
│  Returns all products with:                                            │
│  • Basic info (id, name, sku, category, unit)                          │
│  • Prices (cost_price, selling_price)                                  │
│  • Stock info (current_stock, min_stock_alert, stock_status)           │
│  • Active status                                                       │
│                                                                         │
│  Used by: Both expense & income dropdowns                              │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  record_stock_movement(product_id, quantity, type, ref_type, ref_id)  │
│  ────────────────────────────────────────────────────────────          │
│  Records stock changes:                                                │
│  • Type: 'in' (purchase), 'out' (sale), 'adjust' (manual)              │
│  • Links to source transaction (expense/income ID)                     │
│  • Validates: no negative stock on 'out' movements                     │
│  • Auto-calculates running totals                                      │
│                                                                         │
│  Used by: Expense submit, Income submit                                │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  get_current_stock(product_id)                                         │
│  ────────────────────────────────────────────────────────────          │
│  Calculates stock from movements:                                      │
│  • SUM(in) - SUM(out) + SUM(adjust)                                    │
│  • Real-time calculation                                               │
│  • Used in stock status determination                                  │
│                                                                         │
│  Used by: get_products_with_stock(), validations                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
