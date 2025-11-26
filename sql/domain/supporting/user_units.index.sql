-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: user_unit_settings
-- INDEXES & CONSTRAINTS
-- =====================================================

-- =====================================================
-- INDEXES
-- =====================================================

-- Index 1: Fast lookup by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_user_units_user_id
  ON user_unit_settings(user_id);

-- Index 2: Business type filter (physical products)
CREATE INDEX IF NOT EXISTS idx_user_units_has_physical
  ON user_unit_settings(has_physical_products)
  WHERE has_physical_products = true;

-- Index 3: Business type filter (services)
CREATE INDEX IF NOT EXISTS idx_user_units_has_services
  ON user_unit_settings(has_services)
  WHERE has_services = true;

-- Index 4: GIN index for physical_units array search
CREATE INDEX IF NOT EXISTS idx_user_units_physical_gin
  ON user_unit_settings USING GIN (physical_units);

-- Index 5: GIN index for service_units array search
CREATE INDEX IF NOT EXISTS idx_user_units_service_gin
  ON user_unit_settings USING GIN (service_units);

-- Index 6: GIN index for custom_physical_units array search
CREATE INDEX IF NOT EXISTS idx_user_units_custom_physical_gin
  ON user_unit_settings USING GIN (custom_physical_units);

-- Index 7: GIN index for custom_service_units array search
CREATE INDEX IF NOT EXISTS idx_user_units_custom_service_gin
  ON user_unit_settings USING GIN (custom_service_units);

-- Index 8: Default physical unit (for analytics)
CREATE INDEX IF NOT EXISTS idx_user_units_default_physical
  ON user_unit_settings(default_physical_unit);

-- Index 9: Default service unit (for analytics)
CREATE INDEX IF NOT EXISTS idx_user_units_default_service
  ON user_unit_settings(default_service_unit);

-- Index 10: Created date (for analytics)
CREATE INDEX IF NOT EXISTS idx_user_units_created_at
  ON user_unit_settings(created_at DESC);

-- Index 11: Updated date (for recent changes)
CREATE INDEX IF NOT EXISTS idx_user_units_updated_at
  ON user_unit_settings(updated_at DESC);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Constraint 1: User ID must be unique (one config per user)
-- Already defined in schema: UNIQUE(user_id)

-- Constraint 2: Physical units array must not be empty if has_physical_products
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_physical_not_empty
  CHECK (
    NOT has_physical_products 
    OR array_length(physical_units, 1) > 0
  );

-- Constraint 3: Service units array must not be empty if has_services
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_service_not_empty
  CHECK (
    NOT has_services 
    OR array_length(service_units, 1) > 0
  );

-- Constraint 4: Physical units array must not contain empty strings
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_physical_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(physical_units) AS u WHERE length(trim(u)) = 0
  ));

-- Constraint 5: Service units array must not contain empty strings
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_service_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(service_units) AS u WHERE length(trim(u)) = 0
  ));

-- Constraint 6: Custom physical units array must not contain empty strings
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_custom_physical_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(custom_physical_units) AS u WHERE length(trim(u)) = 0
  ));

-- Constraint 7: Custom service units array must not contain empty strings
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_custom_service_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(custom_service_units) AS u WHERE length(trim(u)) = 0
  ));

-- Constraint 8: Default physical unit must not be empty
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_default_physical_not_empty
  CHECK (length(trim(default_physical_unit)) > 0);

-- Constraint 9: Default service unit must not be empty
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_default_service_not_empty
  CHECK (length(trim(default_service_unit)) > 0);

-- Constraint 10: Updated timestamp must be >= created timestamp
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_timestamps_logic
  CHECK (updated_at >= created_at);

-- Constraint 11: At least one business type must be enabled
ALTER TABLE user_unit_settings
  ADD CONSTRAINT chk_user_units_at_least_one_type
  CHECK (has_physical_products OR has_services);

-- =====================================================
-- STATISTICS FOR QUERY PLANNER
-- =====================================================

-- Increase statistics target for user_id (frequent WHERE clause)
ALTER TABLE user_unit_settings
  ALTER COLUMN user_id SET STATISTICS 1000;

-- Increase statistics for physical_units (GIN index optimization)
ALTER TABLE user_unit_settings
  ALTER COLUMN physical_units SET STATISTICS 500;

-- Increase statistics for service_units (GIN index optimization)
ALTER TABLE user_unit_settings
  ALTER COLUMN service_units SET STATISTICS 500;

-- Increase statistics for default units (frequent GROUP BY)
ALTER TABLE user_unit_settings
  ALTER COLUMN default_physical_unit SET STATISTICS 300;

ALTER TABLE user_unit_settings
  ALTER COLUMN default_service_unit SET STATISTICS 300;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON INDEX idx_user_units_user_id IS 'Fast lookup by user_id (primary query pattern)';
COMMENT ON INDEX idx_user_units_has_physical IS 'Filter users with physical products';
COMMENT ON INDEX idx_user_units_has_services IS 'Filter users with services';
COMMENT ON INDEX idx_user_units_physical_gin IS 'GIN index for physical_units array search';
COMMENT ON INDEX idx_user_units_service_gin IS 'GIN index for service_units array search';
COMMENT ON INDEX idx_user_units_custom_physical_gin IS 'GIN index for custom_physical_units array search';
COMMENT ON INDEX idx_user_units_custom_service_gin IS 'GIN index for custom_service_units array search';
COMMENT ON INDEX idx_user_units_default_physical IS 'Analytics on most popular default physical units';
COMMENT ON INDEX idx_user_units_default_service IS 'Analytics on most popular default service units';

COMMENT ON CONSTRAINT chk_user_units_physical_not_empty ON user_unit_settings IS 'Physical units array cannot be empty if has_physical_products=true';
COMMENT ON CONSTRAINT chk_user_units_service_not_empty ON user_unit_settings IS 'Service units array cannot be empty if has_services=true';
COMMENT ON CONSTRAINT chk_user_units_physical_no_empty ON user_unit_settings IS 'Physical units cannot contain empty strings';
COMMENT ON CONSTRAINT chk_user_units_service_no_empty ON user_unit_settings IS 'Service units cannot contain empty strings';
COMMENT ON CONSTRAINT chk_user_units_custom_physical_no_empty ON user_unit_settings IS 'Custom physical units cannot contain empty strings';
COMMENT ON CONSTRAINT chk_user_units_custom_service_no_empty ON user_unit_settings IS 'Custom service units cannot contain empty strings';
COMMENT ON CONSTRAINT chk_user_units_default_physical_not_empty ON user_unit_settings IS 'Default physical unit cannot be empty';
COMMENT ON CONSTRAINT chk_user_units_default_service_not_empty ON user_unit_settings IS 'Default service unit cannot be empty';
COMMENT ON CONSTRAINT chk_user_units_timestamps_logic ON user_unit_settings IS 'Updated timestamp must be >= created timestamp';
COMMENT ON CONSTRAINT chk_user_units_at_least_one_type ON user_unit_settings IS 'At least one business type (physical or service) must be enabled';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - User Unit Settings Indexes & Constraints Created';
  RAISE NOTICE '   - Indexes: 11 (user_id, business types, GIN arrays, defaults, timestamps)';
  RAISE NOTICE '   - Constraints: 11 (validation, array integrity, timestamp logic, business type)';
  RAISE NOTICE '   - Statistics: Optimized for query planner';
END $$;
