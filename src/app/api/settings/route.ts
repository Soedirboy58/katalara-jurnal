import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Get settings from business_configurations
    const { data: config, error: configError } = await supabase
      .from('business_configurations')
      .select('daily_expense_limit, daily_revenue_target, enable_expense_notifications, notification_threshold, track_roi, roi_period')
      .eq('user_id', user.id)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Settings error:', configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: config || {
        daily_expense_limit: null,
        daily_revenue_target: null,
        enable_expense_notifications: true,
        notification_threshold: 80,
        track_roi: true,
        roi_period: 'monthly'
      }
    })
  } catch (error: any) {
    console.error('Error in settings API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
