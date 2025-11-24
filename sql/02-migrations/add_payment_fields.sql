-- ============================================================================
-- ADD PAYMENT FIELDS TO BUSINESS_STOREFRONTS
-- Support for QRIS image and bank account information
-- ============================================================================

-- Add QRIS image field
ALTER TABLE public.business_storefronts 
ADD COLUMN IF NOT EXISTS qris_image_url TEXT;

-- Add bank account fields
ALTER TABLE public.business_storefronts 
ADD COLUMN IF NOT EXISTS bank_name TEXT;

ALTER TABLE public.business_storefronts 
ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

ALTER TABLE public.business_storefronts 
ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.business_storefronts.qris_image_url IS 'URL to uploaded QRIS image for payment';
COMMENT ON COLUMN public.business_storefronts.bank_name IS 'Bank name for transfer payment (e.g., BCA, Mandiri)';
COMMENT ON COLUMN public.business_storefronts.bank_account_number IS 'Bank account number for transfer';
COMMENT ON COLUMN public.business_storefronts.bank_account_holder IS 'Account holder name';
