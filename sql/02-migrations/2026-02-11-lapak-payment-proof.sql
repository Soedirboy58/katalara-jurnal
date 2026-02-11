-- =====================================================
-- Lapak Order: Payment Proof Support
-- Adds payment proof URL + order code columns and storage bucket policies
-- =====================================================

-- Add columns if missing
ALTER TABLE public.storefront_orders
  ADD COLUMN IF NOT EXISTS order_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_order_code ON public.storefront_orders(order_code);

-- Storage bucket for payment proofs (public read for WA link)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lapak-payments', 'lapak-payments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for public checkout uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public upload payment proofs'
  ) THEN
    CREATE POLICY "Public upload payment proofs"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'lapak-payments');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read payment proofs'
  ) THEN
    CREATE POLICY "Public read payment proofs"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'lapak-payments');
  END IF;
END $$;
