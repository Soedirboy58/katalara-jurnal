-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_type_mappings
-- LOGIC: Functions & Triggers
-- =====================================================

-- =====================================================
-- FUNCTION: Classify business by keywords
-- Auto-detect business category from description
-- =====================================================
CREATE OR REPLACE FUNCTION classify_business_by_keywords(p_description TEXT)
RETURNS TABLE (
  category TEXT,
  confidence FLOAT,
  matched_keywords TEXT[]
) AS $$
DECLARE
  v_description_lower TEXT := LOWER(p_description);
  v_result RECORD;
  v_total_words INTEGER;
  v_match_count INTEGER;
  v_matched_keywords TEXT[];
BEGIN
  -- Count total words in description (rough estimate)
  v_total_words := array_length(string_to_array(v_description_lower, ' '), 1);
  
  IF v_total_words IS NULL OR v_total_words = 0 THEN
    v_total_words := 1; -- Prevent division by zero
  END IF;
  
  -- Find matching categories
  FOR v_result IN
    SELECT
      btm.category,
      btm.keywords
    FROM business_type_mappings btm
  LOOP
    v_match_count := 0;
    v_matched_keywords := ARRAY[]::TEXT[];
    
    -- Check each keyword
    FOR i IN 1..array_length(v_result.keywords, 1) LOOP
      IF v_description_lower LIKE '%' || v_result.keywords[i] || '%' THEN
        v_match_count := v_match_count + 1;
        v_matched_keywords := array_append(v_matched_keywords, v_result.keywords[i]);
      END IF;
    END LOOP;
    
    -- Calculate confidence (matched keywords / total keywords in category)
    IF v_match_count > 0 THEN
      RETURN QUERY SELECT
        v_result.category,
        LEAST(
          (v_match_count::FLOAT / GREATEST(array_length(v_result.keywords, 1), 1)) * 0.7 + -- 70% weight on keyword match
          (LEAST(v_match_count, v_total_words)::FLOAT / v_total_words) * 0.3, -- 30% weight on coverage
          1.0
        ) AS confidence,
        v_matched_keywords;
    END IF;
  END LOOP;
  
  -- Return results ordered by confidence
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get business type by category
-- Retrieve full info for a specific category
-- =====================================================
CREATE OR REPLACE FUNCTION get_business_type_by_category(p_category TEXT)
RETURNS TABLE (
  id UUID,
  category TEXT,
  keywords TEXT[],
  indicators TEXT[],
  examples TEXT[],
  description TEXT,
  recommended_features TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    btm.id,
    btm.category,
    btm.keywords,
    btm.indicators,
    btm.examples,
    btm.description,
    btm.recommended_features
  FROM business_type_mappings btm
  WHERE btm.category = p_category;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get all business types
-- List all available categories
-- =====================================================
CREATE OR REPLACE FUNCTION get_all_business_types()
RETURNS TABLE (
  id UUID,
  category TEXT,
  description TEXT,
  example_count INTEGER,
  keyword_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    btm.id,
    btm.category,
    btm.description,
    array_length(btm.examples, 1) AS example_count,
    array_length(btm.keywords, 1) AS keyword_count
  FROM business_type_mappings btm
  ORDER BY btm.category;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Search business types by keyword
-- Find categories matching a specific keyword
-- =====================================================
CREATE OR REPLACE FUNCTION search_business_types_by_keyword(p_keyword TEXT)
RETURNS TABLE (
  category TEXT,
  description TEXT,
  examples TEXT[]
) AS $$
DECLARE
  v_keyword_lower TEXT := LOWER(p_keyword);
BEGIN
  RETURN QUERY
  SELECT
    btm.category,
    btm.description,
    btm.examples
  FROM business_type_mappings btm
  WHERE v_keyword_lower = ANY(btm.keywords)
  ORDER BY btm.category;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get recommended features for category
-- =====================================================
CREATE OR REPLACE FUNCTION get_recommended_features(p_category TEXT)
RETURNS TEXT[] AS $$
DECLARE
  v_features TEXT[];
BEGIN
  SELECT recommended_features INTO v_features
  FROM business_type_mappings
  WHERE category = p_category;
  
  RETURN COALESCE(v_features, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Update business type mapping
-- Admin function to update category data
-- =====================================================
CREATE OR REPLACE FUNCTION update_business_type_mapping(
  p_category TEXT,
  p_keywords TEXT[] DEFAULT NULL,
  p_indicators TEXT[] DEFAULT NULL,
  p_examples TEXT[] DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_recommended_features TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE business_type_mappings
  SET
    keywords = COALESCE(p_keywords, keywords),
    indicators = COALESCE(p_indicators, indicators),
    examples = COALESCE(p_examples, examples),
    description = COALESCE(p_description, description),
    recommended_features = COALESCE(p_recommended_features, recommended_features),
    updated_at = NOW()
  WHERE category = p_category;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get category usage statistics
-- How many users are using each category
-- =====================================================
CREATE OR REPLACE FUNCTION get_category_usage_statistics()
RETURNS TABLE (
  category TEXT,
  user_count BIGINT,
  percentage FLOAT,
  avg_confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.business_category AS category,
    COUNT(*)::BIGINT AS user_count,
    ROUND(
      (COUNT(*)::FLOAT / NULLIF((SELECT COUNT(*) FROM business_configurations WHERE onboarding_completed = TRUE), 0)) * 100,
      2
    ) AS percentage,
    ROUND(AVG(bc.classification_confidence)::NUMERIC, 2) AS avg_confidence
  FROM business_configurations bc
  WHERE bc.onboarding_completed = TRUE
  GROUP BY bc.business_category
  ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_business_types_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- TRIGGER 1: Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_business_types_updated_at ON business_type_mappings;
CREATE TRIGGER update_business_types_updated_at
  BEFORE UPDATE ON business_type_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_types_timestamp();

-- =====================================================
-- VIEW: Business Type Summary
-- Overview of all categories with statistics
-- =====================================================
CREATE OR REPLACE VIEW business_type_summary AS
SELECT
  btm.id,
  btm.category,
  btm.description,
  array_length(btm.keywords, 1) AS keyword_count,
  array_length(btm.indicators, 1) AS indicator_count,
  array_length(btm.examples, 1) AS example_count,
  array_length(btm.recommended_features, 1) AS feature_count,
  COALESCE(
    (SELECT COUNT(*)::BIGINT
     FROM business_configurations bc
     WHERE bc.business_category = btm.category
       AND bc.onboarding_completed = TRUE),
    0
  ) AS user_count,
  btm.created_at,
  btm.updated_at
FROM business_type_mappings btm
ORDER BY btm.category;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION classify_business_by_keywords IS 'Auto-classify business from description using keyword matching';
COMMENT ON FUNCTION get_business_type_by_category IS 'Get full details for a specific business category';
COMMENT ON FUNCTION get_all_business_types IS 'List all available business categories';
COMMENT ON FUNCTION search_business_types_by_keyword IS 'Find categories matching a specific keyword';
COMMENT ON FUNCTION get_recommended_features IS 'Get recommended platform features for a category';
COMMENT ON FUNCTION update_business_type_mapping IS 'Admin function: Update category data';
COMMENT ON FUNCTION get_category_usage_statistics IS 'Analytics: Category usage by users';
COMMENT ON VIEW business_type_summary IS 'Overview of all categories with metadata and usage stats';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Type Mappings Logic Created';
  RAISE NOTICE '   - Functions: 7 (classification, search, analytics, updates)';
  RAISE NOTICE '   - Triggers: 1 (timestamp update)';
  RAISE NOTICE '   - View: business_type_summary (category overview with stats)';
  RAISE NOTICE '   - Features: Keyword-based classification, category management';
END $$;
