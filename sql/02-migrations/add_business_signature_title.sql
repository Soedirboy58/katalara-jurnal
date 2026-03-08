-- Add signature title field for documents (PO/Invoice)
ALTER TABLE public.business_configurations
ADD COLUMN IF NOT EXISTS business_signature_title TEXT;

COMMENT ON COLUMN public.business_configurations.business_signature_title IS 'Title/position displayed under signature on documents';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
