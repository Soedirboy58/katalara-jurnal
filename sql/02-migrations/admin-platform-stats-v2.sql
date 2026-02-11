-- =====================================================
-- ADMIN PLATFORM STATS (V2)
-- Extends `admin_platform_stats` so feature adoption reflects
-- actual platform modules (transactions/sales, suppliers, loans, investments).
--
-- Run this in Supabase SQL Editor (prod/staging) to keep the admin dashboard
-- synced with actual platform data.
-- =====================================================

CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT
  -- User counts
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND is_active = true) as active_users,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND is_approved = false) as pending_approval,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '1 day') as new_today,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '7 days') as new_this_week,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'user' AND created_at > NOW() - INTERVAL '30 days') as new_this_month,

  -- Transaction counts (last 30 days)
  (SELECT COUNT(*) FROM incomes WHERE created_at > NOW() - INTERVAL '30 days') as income_transactions_30d,
  (SELECT COUNT(*) FROM expenses WHERE created_at > NOW() - INTERVAL '30 days') as expense_transactions_30d,
  (SELECT COUNT(*) FROM transactions WHERE transaction_date > NOW() - INTERVAL '30 days') as sales_transactions_30d,

  -- Financial totals (last 30 days)
  -- NOTE: This view is designed to tolerate schema differences across environments.
  -- It reads columns via `to_jsonb(row)->>'col'` so missing columns return NULL instead of erroring.
  (SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(to_jsonb(i)->>'grand_total', '')::numeric,
        NULLIF(to_jsonb(i)->>'amount', '')::numeric,
        NULLIF(to_jsonb(i)->>'total', '')::numeric,
        0
      )
    ), 0)
    FROM incomes i
    WHERE i.created_at > NOW() - INTERVAL '30 days'
  ) as total_revenue_30d,

  (SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(to_jsonb(e)->>'grand_total', '')::numeric,
        NULLIF(to_jsonb(e)->>'amount', '')::numeric,
        NULLIF(to_jsonb(e)->>'total', '')::numeric,
        0
      )
    ), 0)
    FROM expenses e
    WHERE e.created_at > NOW() - INTERVAL '30 days'
  ) as total_expenses_30d,

  (SELECT COALESCE(SUM(
      COALESCE(
        NULLIF(to_jsonb(t)->>'total', '')::numeric,
        NULLIF(to_jsonb(t)->>'grand_total', '')::numeric,
        NULLIF(to_jsonb(t)->>'amount', '')::numeric,
        0
      )
    ), 0)
    FROM transactions t
    WHERE t.transaction_date > NOW() - INTERVAL '30 days'
  ) as total_sales_30d,

  -- Object counts
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM suppliers) as total_suppliers,

  -- Feature adoption: distinct users with at least 1 record
  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(i)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(i)->>'user_id','')::uuid
    ))
   FROM incomes i
  ) as users_with_income,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(e)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(e)->>'user_id','')::uuid
    ))
   FROM expenses e
  ) as users_with_expenses,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(t)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(t)->>'user_id','')::uuid
    ))
   FROM transactions t
  ) as users_with_sales,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(p)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(p)->>'user_id','')::uuid
    ))
   FROM products p
  ) as users_with_products,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(c)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(c)->>'user_id','')::uuid
    ))
   FROM customers c
  ) as users_with_customers,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(s)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(s)->>'user_id','')::uuid
    ))
   FROM suppliers s
  ) as users_with_suppliers,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(l)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(l)->>'user_id','')::uuid
    ))
   FROM loans l
  ) as users_with_loans,

  (SELECT COUNT(DISTINCT COALESCE(
      NULLIF(to_jsonb(iv)->>'owner_id','')::uuid,
      NULLIF(to_jsonb(iv)->>'user_id','')::uuid
    ))
   FROM investments iv
  ) as users_with_investments,

  -- Adoption rates (percentage of total users)
  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(i)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(i)->>'user_id','')::uuid
      ))::numeric FROM incomes i)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as income_adoption_rate,

  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(e)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(e)->>'user_id','')::uuid
      ))::numeric FROM expenses e)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as expense_adoption_rate,

  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(t)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(t)->>'user_id','')::uuid
      ))::numeric FROM transactions t)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as sales_adoption_rate,

  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(s)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(s)->>'user_id','')::uuid
      ))::numeric FROM suppliers s)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as suppliers_adoption_rate,

  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(l)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(l)->>'user_id','')::uuid
      ))::numeric FROM loans l)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as loans_adoption_rate,

  CASE
    WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'user') > 0
    THEN ROUND(
      (SELECT COUNT(DISTINCT COALESCE(
        NULLIF(to_jsonb(iv)->>'owner_id','')::uuid,
        NULLIF(to_jsonb(iv)->>'user_id','')::uuid
      ))::numeric FROM investments iv)
      / (SELECT COUNT(*)::numeric FROM user_profiles WHERE role = 'user')
      * 100,
      1
    )
    ELSE 0
  END as investments_adoption_rate;

GRANT SELECT ON admin_platform_stats TO authenticated;
