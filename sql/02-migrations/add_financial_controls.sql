-- Add new columns to business_configurations for financial controls
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS daily_expense_limit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS daily_revenue_target DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS enable_expense_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS track_roi BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS roi_period VARCHAR(20) DEFAULT 'monthly';

-- Add comment
COMMENT ON COLUMN business_configurations.daily_expense_limit IS 'Maximum daily expense limit';
COMMENT ON COLUMN business_configurations.daily_revenue_target IS 'Daily revenue target';
COMMENT ON COLUMN business_configurations.enable_expense_notifications IS 'Enable expense limit notifications';
COMMENT ON COLUMN business_configurations.notification_threshold IS 'Percentage threshold for notifications (e.g., 80 = notify at 80% of limit)';
COMMENT ON COLUMN business_configurations.track_roi IS 'Enable ROI tracking';
COMMENT ON COLUMN business_configurations.roi_period IS 'ROI calculation period: daily, weekly, monthly';
