-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: activity_logs
-- SCHEMA DEFINITION
-- =====================================================

-- =====================================================
-- TABLE: activity_logs
-- Purpose: Audit trail for all user actions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action details
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.activity_logs IS 'Stores user activity audit trail for tracking all user actions in the system';
COMMENT ON COLUMN public.activity_logs.user_id IS 'Foreign key to auth.users';
COMMENT ON COLUMN public.activity_logs.action IS 'Action type (e.g., create_income, update_expense, delete_product)';
COMMENT ON COLUMN public.activity_logs.description IS 'Human-readable description of the action';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Additional context data as JSON (e.g., affected IDs, old/new values)';
COMMENT ON COLUMN public.activity_logs.ip_address IS 'IP address of the user (optional, for security audits)';
COMMENT ON COLUMN public.activity_logs.user_agent IS 'User agent string (browser/device info)';
COMMENT ON COLUMN public.activity_logs.created_at IS 'Timestamp when action was performed (immutable)';

-- =====================================================
-- ACTION CATEGORIES (for reference)
-- =====================================================

-- Income actions:
--   - create_income, update_income, delete_income
--   - create_income_line_item, update_income_line_item, delete_income_line_item

-- Expense actions:
--   - create_expense, update_expense, delete_expense
--   - create_expense_line_item, update_expense_line_item, delete_expense_line_item

-- Customer actions:
--   - create_customer, update_customer, delete_customer

-- Supplier actions:
--   - create_supplier, update_supplier, delete_supplier

-- Product actions:
--   - create_product, update_product, delete_product

-- User actions:
--   - login, logout, password_change, profile_update

-- Admin actions:
--   - approve_user, suspend_user, delete_user

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - Activity Logs Schema Created';
  RAISE NOTICE '   - Table: activity_logs';
  RAISE NOTICE '   - Purpose: Audit trail for all user actions';
  RAISE NOTICE '   - Features: Action tracking, metadata, IP/user agent, immutable logs';
END $$;
