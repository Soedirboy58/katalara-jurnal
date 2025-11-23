-- Create table to track customer orders from WhatsApp checkout
CREATE TABLE IF NOT EXISTS public.storefront_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.business_storefronts(id) ON DELETE CASCADE,
  
  -- Customer info
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  
  -- Order details
  order_items JSONB NOT NULL, -- Array of {product_id, product_name, quantity, price}
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50), -- 'qris', 'transfer', 'cash'
  delivery_method VARCHAR(100),
  
  -- Tracking
  session_id VARCHAR(100),
  user_agent TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_storefront_orders_storefront_id ON public.storefront_orders(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_created_at ON public.storefront_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_status ON public.storefront_orders(status);

-- Enable RLS
ALTER TABLE public.storefront_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see orders for their own storefronts
CREATE POLICY "Users can view own storefront orders"
  ON public.storefront_orders
  FOR SELECT
  USING (
    storefront_id IN (
      SELECT id FROM public.business_storefronts 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow inserting orders (for public checkout)
CREATE POLICY "Anyone can create orders"
  ON public.storefront_orders
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own storefront orders
CREATE POLICY "Users can update own storefront orders"
  ON public.storefront_orders
  FOR UPDATE
  USING (
    storefront_id IN (
      SELECT id FROM public.business_storefronts 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_storefront_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_storefront_orders_updated_at_trigger
  BEFORE UPDATE ON public.storefront_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_storefront_orders_updated_at();

-- Add order count to analytics view (optional - for quick stats)
COMMENT ON TABLE public.storefront_orders IS 'Tracks customer orders from WhatsApp checkout for analytics and order management';
