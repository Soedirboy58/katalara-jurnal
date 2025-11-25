-- Add missing columns to profiles table for User Menu feature

-- Add address column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add phone column if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add business_type column if not exists  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Missing columns added to profiles table';
  RAISE NOTICE '✅ address, phone, business_type columns ready';
END $$;
