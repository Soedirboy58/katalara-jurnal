-- =====================================================
-- DOMAIN: CORE
-- TABLE: business_type_mappings
-- INDEXES & CONSTRAINTS
-- =====================================================

-- =====================================================
-- INDEXES
-- =====================================================

-- Index 1: Fast category lookup (already unique in schema, but explicit index)
CREATE INDEX IF NOT EXISTS idx_business_types_category
  ON business_type_mappings(category);

-- Index 2: GIN index for keyword search (array contains)
CREATE INDEX IF NOT EXISTS idx_business_types_keywords_gin
  ON business_type_mappings USING GIN (keywords);

-- Index 3: GIN index for indicators search
CREATE INDEX IF NOT EXISTS idx_business_types_indicators_gin
  ON business_type_mappings USING GIN (indicators);

-- Index 4: Text search on description (future full-text search)
CREATE INDEX IF NOT EXISTS idx_business_types_description_trgm
  ON business_type_mappings USING gin (description gin_trgm_ops);

-- Index 5: Recommended features (which platform features to enable)
CREATE INDEX IF NOT EXISTS idx_business_types_features_gin
  ON business_type_mappings USING GIN (recommended_features);

-- Index 6: Sort by usage count (most popular categories)
CREATE INDEX IF NOT EXISTS idx_business_types_usage_count
  ON business_type_mappings(usage_count DESC);

-- Index 7: Sort by creation date (newest categories)
CREATE INDEX IF NOT EXISTS idx_business_types_created_at
  ON business_type_mappings(created_at DESC);

-- Index 8: Sort by last update (recently modified)
CREATE INDEX IF NOT EXISTS idx_business_types_updated_at
  ON business_type_mappings(updated_at DESC);

-- =====================================================
-- CONSTRAINTS
-- =====================================================

-- Constraint 1: Category must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_category_not_empty
  CHECK (length(trim(category)) > 0);

-- Constraint 2: Keywords array must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_keywords_not_empty
  CHECK (array_length(keywords, 1) > 0);

-- Constraint 3: Indicators array must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_indicators_not_empty
  CHECK (array_length(indicators, 1) > 0);

-- Constraint 4: Examples array must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_examples_not_empty
  CHECK (array_length(examples, 1) > 0);

-- Constraint 5: Description must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_description_not_empty
  CHECK (length(trim(description)) > 0);

-- Constraint 6: Recommended features array must not be empty
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_features_not_empty
  CHECK (array_length(recommended_features, 1) > 0);

-- Constraint 7: Usage count must be non-negative
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_usage_count_positive
  CHECK (usage_count >= 0);

-- Constraint 8: Category must be in proper case (Title Case)
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_category_format
  CHECK (category = initcap(category));

-- Constraint 9: Keywords array must not contain empty strings
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_keywords_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(keywords) AS k WHERE length(trim(k)) = 0
  ));

-- Constraint 10: Indicators array must not contain empty strings
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_indicators_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(indicators) AS i WHERE length(trim(i)) = 0
  ));

-- Constraint 11: Examples array must not contain empty strings
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_examples_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(examples) AS e WHERE length(trim(e)) = 0
  ));

-- Constraint 12: Features array must not contain empty strings
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_features_no_empty
  CHECK (NOT EXISTS (
    SELECT 1 FROM unnest(recommended_features) AS f WHERE length(trim(f)) = 0
  ));

-- Constraint 13: Updated timestamp must be >= created timestamp
ALTER TABLE business_type_mappings
  ADD CONSTRAINT chk_business_types_timestamps_logic
  CHECK (updated_at >= created_at);

-- =====================================================
-- STATISTICS FOR QUERY PLANNER
-- =====================================================

-- Increase statistics target for category (frequent WHERE/GROUP BY)
ALTER TABLE business_type_mappings
  ALTER COLUMN category SET STATISTICS 1000;

-- Increase statistics for keywords (GIN index optimization)
ALTER TABLE business_type_mappings
  ALTER COLUMN keywords SET STATISTICS 500;

-- Increase statistics for usage_count (frequent ORDER BY)
ALTER TABLE business_type_mappings
  ALTER COLUMN usage_count SET STATISTICS 500;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON INDEX idx_business_types_category IS 'Fast lookup by business category';
COMMENT ON INDEX idx_business_types_keywords_gin IS 'GIN index for keyword array search (classify_business_by_keywords)';
COMMENT ON INDEX idx_business_types_indicators_gin IS 'GIN index for indicators array search';
COMMENT ON INDEX idx_business_types_description_trgm IS 'Trigram index for fuzzy text search on description';
COMMENT ON INDEX idx_business_types_features_gin IS 'GIN index for recommended features array';
COMMENT ON INDEX idx_business_types_usage_count IS 'Sort by most popular categories';
COMMENT ON INDEX idx_business_types_created_at IS 'Sort by newest categories';
COMMENT ON INDEX idx_business_types_updated_at IS 'Sort by recently modified categories';

COMMENT ON CONSTRAINT chk_business_types_category_not_empty ON business_type_mappings IS 'Category must not be empty string';
COMMENT ON CONSTRAINT chk_business_types_keywords_not_empty ON business_type_mappings IS 'Keywords array must contain at least one element';
COMMENT ON CONSTRAINT chk_business_types_indicators_not_empty ON business_type_mappings IS 'Indicators array must contain at least one element';
COMMENT ON CONSTRAINT chk_business_types_examples_not_empty ON business_type_mappings IS 'Examples array must contain at least one element';
COMMENT ON CONSTRAINT chk_business_types_description_not_empty ON business_type_mappings IS 'Description must not be empty';
COMMENT ON CONSTRAINT chk_business_types_features_not_empty ON business_type_mappings IS 'Recommended features must contain at least one element';
COMMENT ON CONSTRAINT chk_business_types_usage_count_positive ON business_type_mappings IS 'Usage count cannot be negative';
COMMENT ON CONSTRAINT chk_business_types_category_format ON business_type_mappings IS 'Category must be in Title Case';
COMMENT ON CONSTRAINT chk_business_types_keywords_no_empty ON business_type_mappings IS 'Keywords array cannot contain empty strings';
COMMENT ON CONSTRAINT chk_business_types_indicators_no_empty ON business_type_mappings IS 'Indicators array cannot contain empty strings';
COMMENT ON CONSTRAINT chk_business_types_examples_no_empty ON business_type_mappings IS 'Examples array cannot contain empty strings';
COMMENT ON CONSTRAINT chk_business_types_features_no_empty ON business_type_mappings IS 'Features array cannot contain empty strings';
COMMENT ON CONSTRAINT chk_business_types_timestamps_logic ON business_type_mappings IS 'Updated timestamp must be >= created timestamp';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ CORE Domain - Business Type Mappings Indexes & Constraints Created';
  RAISE NOTICE '   - Indexes: 8 (category, GIN arrays, sorting)';
  RAISE NOTICE '   - Constraints: 13 (validation, format, array integrity, timestamp logic)';
  RAISE NOTICE '   - Statistics: Optimized for query planner';
END $$;
