-- Check business configuration for user
SELECT 
  user_id,
  business_name,
  business_type,
  daily_sales_target,
  monthly_expense_limit,
  created_at
FROM business_configurations
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1';

-- Check if user has profile
SELECT 
  user_id,
  business_name,
  created_at
FROM user_profiles
WHERE user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1';

-- Check actual expenses this month
SELECT 
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount,
  MIN(expense_date) as earliest_date,
  MAX(expense_date) as latest_date
FROM expenses
WHERE (owner_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1' OR user_id = '3fe248a4-bfa3-456d-b9dd-d0b7730337a1')
  AND expense_date >= DATE_TRUNC('month', CURRENT_DATE);
