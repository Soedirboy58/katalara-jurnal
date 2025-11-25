-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own activity logs
CREATE POLICY "Users can view own activity logs"
    ON public.activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users cannot update activity logs (append-only)
-- No UPDATE policy = activity logs are immutable

-- RLS Policy: Users cannot delete activity logs (audit trail)
-- No DELETE policy = activity logs are permanent

-- Add comment for documentation
COMMENT ON TABLE public.activity_logs IS 'Stores user activity audit trail for tracking all user actions in the system';
COMMENT ON COLUMN public.activity_logs.action IS 'Action type (e.g., create_income, update_expense, delete_product)';
COMMENT ON COLUMN public.activity_logs.description IS 'Human-readable description of the action';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Additional context data as JSON (e.g., affected IDs, old/new values)';
