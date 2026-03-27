-- Add purchase unit conversion fields to products
-- Use case: buy in dus/box, stock and sell in kg/pcs/etc

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS purchase_unit TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS purchase_conversion_qty NUMERIC(15,3);

COMMENT ON COLUMN public.products.unit IS 'Base stock and selling unit for the product';
COMMENT ON COLUMN public.products.purchase_unit IS 'Default supplier purchase unit when different from base unit';
COMMENT ON COLUMN public.products.purchase_conversion_qty IS 'How many base units are contained in 1 purchase_unit';

NOTIFY pgrst, 'reload schema';