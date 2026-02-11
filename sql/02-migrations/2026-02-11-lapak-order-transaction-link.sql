-- =====================================================
-- Lapak Order: Link to Sales Transaction
-- Adds transaction_id column for confirmed orders
-- =====================================================

ALTER TABLE public.storefront_orders
  ADD COLUMN IF NOT EXISTS transaction_id UUID;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_transaction_id ON public.storefront_orders(transaction_id);
