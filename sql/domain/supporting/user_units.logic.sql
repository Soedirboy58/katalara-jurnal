-- =====================================================
-- DOMAIN: SUPPORTING
-- TABLE: user_unit_settings
-- BUSINESS LOGIC (Functions + Triggers + Views)
-- =====================================================

-- =====================================================
-- FUNCTION 1: Get User Unit Settings
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_unit_settings(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  has_physical_products BOOLEAN,
  has_services BOOLEAN,
  physical_units TEXT[],
  service_units TEXT[],
  custom_physical_units TEXT[],
  custom_service_units TEXT[],
  default_physical_unit VARCHAR,
  default_service_unit VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uus.id,
    uus.user_id,
    uus.has_physical_products,
    uus.has_services,
    uus.physical_units,
    uus.service_units,
    uus.custom_physical_units,
    uus.custom_service_units,
    uus.default_physical_unit,
    uus.default_service_unit,
    uus.created_at,
    uus.updated_at
  FROM user_unit_settings uus
  WHERE uus.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_unit_settings IS 'Retrieve unit settings for specific user';

-- =====================================================
-- FUNCTION 2: Initialize Default Settings
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_user_unit_settings(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if settings already exist
  SELECT id INTO v_id
  FROM user_unit_settings
  WHERE user_id = p_user_id;
  
  IF v_id IS NOT NULL THEN
    RETURN v_id; -- Already exists
  END IF;
  
  -- Create default settings
  INSERT INTO user_unit_settings (
    user_id,
    has_physical_products,
    has_services,
    physical_units,
    service_units,
    custom_physical_units,
    custom_service_units,
    default_physical_unit,
    default_service_unit
  ) VALUES (
    p_user_id,
    true,
    false,
    ARRAY['pcs', 'unit', 'pasang', 'lusin', 'box'],
    ARRAY['jam', 'hari', 'bulan', 'proyek', 'orang'],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    'pcs',
    'jam'
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_user_unit_settings IS 'Create default unit settings for new user';

-- =====================================================
-- FUNCTION 3: Add Custom Physical Unit
-- =====================================================
CREATE OR REPLACE FUNCTION add_custom_physical_unit(
  p_user_id UUID,
  p_custom_unit TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_existing TEXT[];
BEGIN
  -- Get current custom units
  SELECT custom_physical_units INTO v_existing
  FROM user_unit_settings
  WHERE user_id = p_user_id;
  
  -- Check if already exists
  IF p_custom_unit = ANY(v_existing) THEN
    RETURN false; -- Already exists
  END IF;
  
  -- Add new custom unit
  UPDATE user_unit_settings
  SET custom_physical_units = array_append(custom_physical_units, p_custom_unit),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_custom_physical_unit IS 'Add custom unit for physical products';

-- =====================================================
-- FUNCTION 4: Add Custom Service Unit
-- =====================================================
CREATE OR REPLACE FUNCTION add_custom_service_unit(
  p_user_id UUID,
  p_custom_unit TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_existing TEXT[];
BEGIN
  -- Get current custom units
  SELECT custom_service_units INTO v_existing
  FROM user_unit_settings
  WHERE user_id = p_user_id;
  
  -- Check if already exists
  IF p_custom_unit = ANY(v_existing) THEN
    RETURN false; -- Already exists
  END IF;
  
  -- Add new custom unit
  UPDATE user_unit_settings
  SET custom_service_units = array_append(custom_service_units, p_custom_unit),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_custom_service_unit IS 'Add custom unit for services';

-- =====================================================
-- FUNCTION 5: Remove Custom Physical Unit
-- =====================================================
CREATE OR REPLACE FUNCTION remove_custom_physical_unit(
  p_user_id UUID,
  p_custom_unit TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_unit_settings
  SET custom_physical_units = array_remove(custom_physical_units, p_custom_unit),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_custom_physical_unit IS 'Remove custom physical product unit';

-- =====================================================
-- FUNCTION 6: Remove Custom Service Unit
-- =====================================================
CREATE OR REPLACE FUNCTION remove_custom_service_unit(
  p_user_id UUID,
  p_custom_unit TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_unit_settings
  SET custom_service_units = array_remove(custom_service_units, p_custom_unit),
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_custom_service_unit IS 'Remove custom service unit';

-- =====================================================
-- FUNCTION 7: Update Default Units
-- =====================================================
CREATE OR REPLACE FUNCTION update_default_units(
  p_user_id UUID,
  p_default_physical VARCHAR DEFAULT NULL,
  p_default_service VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_unit_settings
  SET 
    default_physical_unit = COALESCE(p_default_physical, default_physical_unit),
    default_service_unit = COALESCE(p_default_service, default_service_unit),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_default_units IS 'Update default unit preferences';

-- =====================================================
-- FUNCTION 8: Get All Available Units (combined)
-- =====================================================
CREATE OR REPLACE FUNCTION get_all_available_units(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_settings
  FROM user_unit_settings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;
  
  v_result := jsonb_build_object(
    'physical', jsonb_build_object(
      'standard', to_jsonb(v_settings.physical_units),
      'custom', to_jsonb(v_settings.custom_physical_units),
      'default', v_settings.default_physical_unit
    ),
    'service', jsonb_build_object(
      'standard', to_jsonb(v_settings.service_units),
      'custom', to_jsonb(v_settings.custom_service_units),
      'default', v_settings.default_service_unit
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_all_available_units IS 'Get all available units (standard + custom) for user';

-- =====================================================
-- TRIGGER: Update Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_unit_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_unit_settings_timestamp
  BEFORE UPDATE ON user_unit_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_unit_settings_timestamp();

COMMENT ON TRIGGER trigger_update_user_unit_settings_timestamp ON user_unit_settings 
IS 'Auto-update updated_at timestamp on row modification';

-- =====================================================
-- VIEW: User Unit Settings Summary
-- =====================================================
CREATE OR REPLACE VIEW user_unit_settings_summary AS
SELECT 
  uus.user_id,
  up.full_name,
  up.business_name,
  uus.has_physical_products,
  uus.has_services,
  array_length(uus.physical_units, 1) AS physical_unit_count,
  array_length(uus.service_units, 1) AS service_unit_count,
  array_length(uus.custom_physical_units, 1) AS custom_physical_count,
  array_length(uus.custom_service_units, 1) AS custom_service_count,
  uus.default_physical_unit,
  uus.default_service_unit,
  uus.created_at,
  uus.updated_at
FROM user_unit_settings uus
LEFT JOIN user_profiles up ON uus.user_id = up.user_id;

COMMENT ON VIEW user_unit_settings_summary IS 'Summary view of user unit settings with profile info';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUPPORTING Domain - User Unit Settings Logic Created';
  RAISE NOTICE '   - Functions: 8 (get, initialize, add/remove custom, update defaults, get all)';
  RAISE NOTICE '   - Triggers: 1 (timestamp update)';
  RAISE NOTICE '   - Views: 1 (summary with profile)';
END $$;
