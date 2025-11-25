-- Add settings columns to business_configurations table
-- For General Settings page functionality

-- Appearance settings
ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto'));

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en'));

-- Regional settings
ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'dd/mm/yyyy' CHECK (date_format IN ('dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'));

-- Notification settings
ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;

-- Alert settings
ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS expense_alerts BOOLEAN DEFAULT TRUE;

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS expense_threshold BIGINT DEFAULT 1000000;

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS low_stock_alerts BOOLEAN DEFAULT TRUE;

ALTER TABLE public.business_configurations 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Add comments for documentation
COMMENT ON COLUMN public.business_configurations.theme IS 'UI theme preference: light, dark, or auto';
COMMENT ON COLUMN public.business_configurations.language IS 'Preferred language: id (Indonesian) or en (English)';
COMMENT ON COLUMN public.business_configurations.currency IS 'Currency code (e.g., IDR, USD, EUR)';
COMMENT ON COLUMN public.business_configurations.date_format IS 'Date display format preference';
COMMENT ON COLUMN public.business_configurations.email_notifications IS 'Enable email notifications';
COMMENT ON COLUMN public.business_configurations.push_notifications IS 'Enable browser push notifications';
COMMENT ON COLUMN public.business_configurations.expense_alerts IS 'Enable alerts for large expenses';
COMMENT ON COLUMN public.business_configurations.expense_threshold IS 'Threshold amount (in Rupiah) for expense alerts';
COMMENT ON COLUMN public.business_configurations.low_stock_alerts IS 'Enable low stock alerts';
COMMENT ON COLUMN public.business_configurations.low_stock_threshold IS 'Minimum stock quantity before alert';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Settings columns added to business_configurations table';
  RAISE NOTICE '✅ General Settings page is now ready to use';
END $$;
