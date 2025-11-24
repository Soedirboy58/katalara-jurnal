-- Add store configuration columns to business_configurations table

-- Add store location column
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS store_location TEXT;

-- Add store hours column
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS store_hours TEXT;

-- Add WhatsApp number column
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add phone number column
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN business_configurations.store_location IS 'Physical store address for online storefront';
COMMENT ON COLUMN business_configurations.store_hours IS 'Store operating hours (e.g., Senin-Sabtu: 08:00-20:00)';
COMMENT ON COLUMN business_configurations.whatsapp_number IS 'WhatsApp number for customer orders (format: 628xxx)';
COMMENT ON COLUMN business_configurations.phone_number IS 'Alternative phone number for contact';
