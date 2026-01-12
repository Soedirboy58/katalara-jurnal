import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isMissingColumnError = (err: any, columnName: string) => {
  const code = (err?.code || err?.error_code || '').toString().toUpperCase()
  if (code === '42703') return true

  const msg = (err?.message || err?.details || '').toString().toLowerCase()
  const col = columnName.toLowerCase()
  if (!msg.includes('does not exist')) return false
  return msg.includes(col) && msg.includes('column')
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings from business_configurations (schema-drift safe)
    // - some environments use `user_id`, others use `owner_id`
    // - some columns may be missing, so we select `*` and normalize
    const defaults = {
      daily_expense_limit: null,
      daily_revenue_target: null,
      enable_expense_notifications: true,
      notification_threshold: 80,
      track_roi: true,
      roi_period: 'monthly'
    }

    let config: any = null
    let configError: any = null

    ;({ data: config, error: configError } = await supabase
      .from('business_configurations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle())

    if (configError && isMissingColumnError(configError, 'user_id')) {
      ;({ data: config, error: configError } = await supabase
        .from('business_configurations')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle())
    }

    if (configError && configError.code !== 'PGRST116') {
      console.error('Settings error:', configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    const normalized = {
      daily_expense_limit: config?.daily_expense_limit ?? defaults.daily_expense_limit,
      daily_revenue_target: config?.daily_revenue_target ?? defaults.daily_revenue_target,
      enable_expense_notifications:
        config?.enable_expense_notifications ?? defaults.enable_expense_notifications,
      notification_threshold: config?.notification_threshold ?? defaults.notification_threshold,
      track_roi: config?.track_roi ?? defaults.track_roi,
      roi_period: config?.roi_period ?? defaults.roi_period
    }

    return NextResponse.json({ success: true, data: normalized })
  } catch (error: any) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
