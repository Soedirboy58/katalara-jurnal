-- Unify the sales/transactions system schema for Katalara Next.js
-- Goal: make Next.js "transactions" flow work even if existing DB uses owner_id or user_id.
--
-- This patch:
-- - Ensures tables exist: customers, products (adds owner_id/user_id compatibility), transactions, transaction_items, payments
-- - Ensures BOTH user_id and owner_id columns exist (and are backfilled) so PostgREST queries don't break
-- - Creates/updates generate_invoice_number(user_id) to work with the unified schema
-- - Creates/updates stock_movements + adjust_stock RPC to work whether ownership column is owner_id or user_id
-- - Adds basic RLS policies based on COALESCE(user_id, owner_id)

-- =====================================================
-- Helpers
-- =====================================================

-- Ensure UUID helpers exist (Supabase usually has these enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  -- Ensure required extensions exist
  -- (uuid_generate_v4 is used widely)
  PERFORM 1;
EXCEPTION WHEN OTHERS THEN
  -- no-op
  NULL;
END $$;

-- =====================================================
-- CUSTOMERS
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.customers') IS NULL THEN
    CREATE TABLE public.customers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      owner_id UUID,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      total_transactions INTEGER DEFAULT 0,
      total_purchase NUMERIC DEFAULT 0,
      last_transaction_date TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Ensure timestamps exist (older schemas may miss these)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Ensure both ownership columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN user_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='customers' AND column_name='owner_id'
    ) THEN
      EXECUTE 'UPDATE public.customers SET user_id = owner_id WHERE user_id IS NULL';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN owner_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='customers' AND column_name='user_id'
    ) THEN
      EXECUTE 'UPDATE public.customers SET owner_id = user_id WHERE owner_id IS NULL';
    END IF;
  END IF;

  -- Backfill whichever is missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='owner_id'
  ) THEN
    EXECUTE 'UPDATE public.customers SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='customers' AND column_name='user_id'
  ) THEN
    EXECUTE 'UPDATE public.customers SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL';
  END IF;

  CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
  CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
  CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
END $$;

-- =====================================================
-- PRODUCTS
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.products') IS NULL THEN
    CREATE TABLE public.products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      owner_id UUID,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT DEFAULT 'pcs',
      price NUMERIC NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Ensure timestamps exist (older schemas may miss these)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN user_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='products' AND column_name='owner_id'
    ) THEN
      EXECUTE 'UPDATE public.products SET user_id = owner_id WHERE user_id IS NULL';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN owner_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='products' AND column_name='user_id'
    ) THEN
      EXECUTE 'UPDATE public.products SET owner_id = user_id WHERE owner_id IS NULL';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='owner_id'
  ) THEN
    EXECUTE 'UPDATE public.products SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='user_id'
  ) THEN
    EXECUTE 'UPDATE public.products SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL';
  END IF;

  -- Inventory columns (safe adds)
  ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT 'pcs',
    ADD COLUMN IF NOT EXISTS buy_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sell_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_restock_date TIMESTAMPTZ;

  -- Keep sell_price aligned with legacy price when applicable (only if legacy column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='price'
  ) THEN
    EXECUTE 'UPDATE public.products SET sell_price = price WHERE (sell_price = 0 OR sell_price IS NULL) AND price IS NOT NULL';
  END IF;

  CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
  CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
  CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(owner_id, stock_quantity);
END $$;

-- =====================================================
-- TRANSACTIONS
-- =====================================================

DO $$
DECLARE
  v_tx_id_type TEXT;
  v_items_tx_id_type TEXT;
  v_pay_tx_id_type TEXT;
  v_suffix TEXT;
  v_con RECORD;
  v_idx RECORD;
  v_tbl_oid OID;
BEGIN
  -- If existing tables use BIGINT ids (legacy), rename them out of the way.
  -- Next.js expects UUID keys for transactions and related tables.
  v_suffix := to_char(now(), 'YYYYMMDD_HH24MISS');

  IF to_regclass('public.transactions') IS NOT NULL THEN
    SELECT data_type INTO v_tx_id_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='id';

    IF v_tx_id_type IS NOT NULL AND lower(v_tx_id_type) <> 'uuid' THEN
      EXECUTE format('ALTER TABLE public.transactions RENAME TO %I', 'transactions_legacy_' || v_suffix);
    END IF;
  END IF;

  IF to_regclass('public.transaction_items') IS NOT NULL THEN
    SELECT data_type INTO v_items_tx_id_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transaction_items' AND column_name='transaction_id';

    IF v_items_tx_id_type IS NOT NULL AND lower(v_items_tx_id_type) <> 'uuid' THEN
      EXECUTE format('ALTER TABLE public.transaction_items RENAME TO %I', 'transaction_items_legacy_' || v_suffix);
    END IF;
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    SELECT data_type INTO v_pay_tx_id_type
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payments' AND column_name='transaction_id';

    IF v_pay_tx_id_type IS NOT NULL AND lower(v_pay_tx_id_type) <> 'uuid' THEN
      EXECUTE format('ALTER TABLE public.payments RENAME TO %I', 'payments_legacy_' || v_suffix);
    END IF;
  END IF;

  IF to_regclass('public.transactions') IS NULL THEN
    CREATE TABLE public.transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      owner_id UUID,
      invoice_number TEXT NOT NULL,
      transaction_date TIMESTAMPTZ DEFAULT NOW(),
      customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      payment_type TEXT DEFAULT 'cash',
      due_date DATE,
      subtotal NUMERIC NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'percentage',
      discount_value NUMERIC DEFAULT 0,
      discount_amount NUMERIC DEFAULT 0,
      ppn_rate NUMERIC DEFAULT 11,
      ppn_amount NUMERIC DEFAULT 0,
      pph_rate NUMERIC DEFAULT 0,
      pph_amount NUMERIC DEFAULT 0,
      total NUMERIC NOT NULL DEFAULT 0,
      paid_amount NUMERIC DEFAULT 0,
      remaining_amount NUMERIC DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Ensure timestamps exist (older schemas may miss these)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Ensure invoice_number exists (some older schemas used different naming)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='invoice_number'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN invoice_number TEXT;
  END IF;

  -- Optional: category for income classification (produk/jasa/lain-lain)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='category'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN category TEXT;
  END IF;

  -- Drop any legacy/global uniqueness on invoice_number alone.
  -- We want invoice_number to be unique PER USER (user_id, invoice_number), not globally.
  -- If a global unique constraint/index exists, new users will always collide on INV-YYYY-0001.
  BEGIN
    SELECT c.oid INTO v_tbl_oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'transactions';

    IF v_tbl_oid IS NOT NULL THEN
      -- Drop UNIQUE constraints that only cover (invoice_number)
      FOR v_con IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = v_tbl_oid
          AND contype = 'u'
          AND array_length(conkey, 1) = 1
          AND (
            SELECT attname
            FROM pg_attribute
            WHERE attrelid = v_tbl_oid AND attnum = conkey[1]
          ) = 'invoice_number'
      LOOP
        EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', v_con.conname);
      END LOOP;

      -- Drop ANY UNIQUE constraints that involve invoice_number but NOT user_id.
      -- (Covers composite constraints like UNIQUE(invoice_number, transaction_date) or other legacy patterns.)
      FOR v_con IN
        SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = v_tbl_oid
          AND contype = 'u'
      LOOP
        IF v_con.def ILIKE '%invoice_number%'
           AND v_con.def NOT ILIKE '%user_id%'
        THEN
          EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', v_con.conname);
        END IF;
      END LOOP;

      -- Drop standalone UNIQUE indexes that only cover (invoice_number)
      FOR v_idx IN
        SELECT i.relname AS index_name
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = v_tbl_oid AND a.attnum = ANY(ix.indkey)
        WHERE ix.indrelid = v_tbl_oid
          AND ix.indisunique = true
          AND ix.indisprimary = false
        GROUP BY i.relname
        HAVING COUNT(*) = 1 AND MAX(a.attname) = 'invoice_number'
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', v_idx.index_name);
      END LOOP;

      -- Drop ANY UNIQUE indexes that involve invoice_number but NOT user_id.
      -- (Covers expression-based indexes, partial indexes, etc.)
      FOR v_idx IN
        SELECT i.relname AS index_name, pg_get_indexdef(i.oid) AS def
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        WHERE ix.indrelid = v_tbl_oid
          AND ix.indisunique = true
          AND ix.indisprimary = false
      LOOP
        IF v_idx.def ILIKE '%invoice_number%'
           AND v_idx.def NOT ILIKE '%user_id%'
        THEN
          EXECUTE format('DROP INDEX IF EXISTS public.%I', v_idx.index_name);
        END IF;
      END LOOP;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- best-effort; ignore
    NULL;
  END;

  -- Ensure transaction_date exists (needed for listing/sorting + index)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='transaction_date'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN transaction_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Ensure customer_id exists (needed for filtering + index)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN customer_id UUID;
  END IF;

  -- Best-effort FK to customers (skip if incompatible)
  BEGIN
    IF to_regclass('public.customers') IS NOT NULL THEN
      EXECUTE 'ALTER TABLE public.transactions ADD CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL';
    END IF;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN undefined_table THEN NULL;
    WHEN undefined_column THEN NULL;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN user_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='transactions' AND column_name='owner_id'
    ) THEN
      EXECUTE 'UPDATE public.transactions SET user_id = owner_id WHERE user_id IS NULL';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN owner_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='transactions' AND column_name='user_id'
    ) THEN
      EXECUTE 'UPDATE public.transactions SET owner_id = user_id WHERE owner_id IS NULL';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='owner_id'
  ) THEN
    EXECUTE 'UPDATE public.transactions SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='user_id'
  ) THEN
    EXECUTE 'UPDATE public.transactions SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL';
  END IF;

  -- Unique invoice per user (best-effort)
  -- Use a UNIQUE INDEX (more idempotent across divergent schemas).
  -- Some databases may already have a constraint/index named uniq_user_invoice;
  -- creating a new constraint can fail with "relation already exists".
  BEGIN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_invoice ON public.transactions(user_id, invoice_number)';
  EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
    WHEN unique_violation THEN NULL;
    WHEN invalid_table_definition THEN NULL;
  END;

  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON public.transactions(owner_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
  CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(payment_status);
  CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON public.transactions(invoice_number);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
END $$;

-- =====================================================
-- TRANSACTION_ITEMS
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.transaction_items') IS NULL THEN
    CREATE TABLE public.transaction_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      qty NUMERIC NOT NULL,
      unit TEXT NOT NULL,
      price NUMERIC NOT NULL,
      subtotal NUMERIC NOT NULL,
      stock_deducted BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  ALTER TABLE public.transaction_items
    ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;

  CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON public.transaction_items(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items(product_id);
END $$;

-- =====================================================
-- PAYMENTS (optional)
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.payments') IS NULL THEN
    CREATE TABLE public.payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
      payment_date TIMESTAMPTZ DEFAULT NOW(),
      amount NUMERIC NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments(transaction_id);
  END IF;
END $$;

-- =====================================================
-- STOCK_MOVEMENTS + adjust_stock RPC
-- =====================================================

DO $$
BEGIN
  IF to_regclass('public.stock_movements') IS NULL THEN
    CREATE TABLE public.stock_movements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      owner_id UUID,
      movement_type TEXT NOT NULL,
      quantity_change NUMERIC NOT NULL,
      stock_before NUMERIC NOT NULL,
      stock_after NUMERIC NOT NULL,
      reference_type TEXT,
      reference_id UUID,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stock_movements' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN user_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='stock_movements' AND column_name='owner_id'
    ) THEN
      EXECUTE 'UPDATE public.stock_movements SET user_id = owner_id WHERE user_id IS NULL';
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stock_movements' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN owner_id UUID;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='stock_movements' AND column_name='user_id'
    ) THEN
      EXECUTE 'UPDATE public.stock_movements SET owner_id = user_id WHERE owner_id IS NULL';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stock_movements' AND column_name='owner_id'
  ) THEN
    EXECUTE 'UPDATE public.stock_movements SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='stock_movements' AND column_name='user_id'
  ) THEN
    EXECUTE 'UPDATE public.stock_movements SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL';
  END IF;

  CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON public.stock_movements(user_id);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_owner_id ON public.stock_movements(owner_id);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(created_at);
END $$;

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id UUID,
  p_quantity_change NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_uid UUID;
  v_product RECORD;
BEGIN
  v_uid := auth.uid();

  -- Ensure ownership columns are filled
  UPDATE public.products SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;
  UPDATE public.products SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND COALESCE(user_id, owner_id) = v_uid
    AND COALESCE(track_inventory, true) = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Product not found or inventory tracking disabled'
    );
  END IF;

  IF (COALESCE(v_product.stock_quantity, 0) + p_quantity_change) < 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Insufficient stock'
    );
  END IF;

  INSERT INTO public.stock_movements (
    product_id,
    user_id,
    owner_id,
    movement_type,
    quantity_change,
    stock_before,
    stock_after,
    reference_type,
    notes
  ) VALUES (
    p_product_id,
    v_uid,
    v_uid,
    'adjustment',
    p_quantity_change,
    COALESCE(v_product.stock_quantity, 0),
    COALESCE(v_product.stock_quantity, 0) + p_quantity_change,
    'manual',
    COALESCE(p_notes, 'Manual stock adjustment')
  );

  UPDATE public.products
  SET
    stock_quantity = COALESCE(stock_quantity, 0) + p_quantity_change,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Stock adjusted successfully',
    'previous_stock', COALESCE(v_product.stock_quantity, 0),
    'new_stock', COALESCE(v_product.stock_quantity, 0) + p_quantity_change
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.adjust_stock(UUID, NUMERIC, TEXT) TO authenticated;

-- =====================================================
-- generate_invoice_number RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  last_number INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text), EXTRACT(YEAR FROM NOW())::int);
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Ensure ownership columns are filled
  UPDATE public.transactions SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;
  UPDATE public.transactions SET owner_id = user_id WHERE owner_id IS NULL AND user_id IS NOT NULL;

  SELECT COALESCE(
    MAX(
      SUBSTRING(invoice_number FROM '\\d+$')::INTEGER
    ), 0
  ) INTO last_number
  FROM public.transactions
  WHERE COALESCE(user_id, owner_id) = p_user_id
    AND invoice_number LIKE 'INV-' || current_year || '-%';

  RETURN 'INV-' || current_year || '-' || LPAD((last_number + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number(UUID) TO authenticated;

-- =====================================================
-- RLS (minimal, compatible with either column)
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Customers
DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_own" ON public.customers;
DROP POLICY IF EXISTS "customers_update_own" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_own" ON public.customers;

CREATE POLICY "customers_select_own" ON public.customers
FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "customers_insert_own" ON public.customers
FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "customers_update_own" ON public.customers
FOR UPDATE USING (COALESCE(user_id, owner_id) = auth.uid())
WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "customers_delete_own" ON public.customers
FOR DELETE USING (COALESCE(user_id, owner_id) = auth.uid());

-- Products
DROP POLICY IF EXISTS "products_select_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;
DROP POLICY IF EXISTS "products_delete_own" ON public.products;

CREATE POLICY "products_select_own" ON public.products
FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "products_insert_own" ON public.products
FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "products_update_own" ON public.products
FOR UPDATE USING (COALESCE(user_id, owner_id) = auth.uid())
WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "products_delete_own" ON public.products
FOR DELETE USING (COALESCE(user_id, owner_id) = auth.uid());

-- Transactions
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;

CREATE POLICY "transactions_select_own" ON public.transactions
FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "transactions_insert_own" ON public.transactions
FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "transactions_update_own" ON public.transactions
FOR UPDATE USING (COALESCE(user_id, owner_id) = auth.uid())
WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "transactions_delete_own" ON public.transactions
FOR DELETE USING (COALESCE(user_id, owner_id) = auth.uid());

-- Transaction items (inherit ownership via parent transaction)
DROP POLICY IF EXISTS "transaction_items_select_own" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert_own" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_update_own" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_delete_own" ON public.transaction_items;

CREATE POLICY "transaction_items_select_own" ON public.transaction_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "transaction_items_insert_own" ON public.transaction_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "transaction_items_update_own" ON public.transaction_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "transaction_items_delete_own" ON public.transaction_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

-- Payments (inherit ownership via parent transaction)
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_own" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_own" ON public.payments;

CREATE POLICY "payments_select_own" ON public.payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = payments.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "payments_insert_own" ON public.payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = payments.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "payments_update_own" ON public.payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = payments.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = payments.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

CREATE POLICY "payments_delete_own" ON public.payments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = payments.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);

-- Stock movements
DROP POLICY IF EXISTS "stock_movements_select_own" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_own" ON public.stock_movements;

CREATE POLICY "stock_movements_select_own" ON public.stock_movements
FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());

CREATE POLICY "stock_movements_insert_own" ON public.stock_movements
FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());
