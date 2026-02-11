// ============================================================================
// API: ADMIN MONITORING
// ============================================================================
// GET: Get monitoring data (bug reports, user stats, activity)
// Restricted to admin users only
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function isMissingRelationError(err: any) {
  const msg = String(err?.message || err?.details || '').toLowerCase()
  const code = String(err?.code || err?.error_code || '')
  return code === '42P01' || msg.includes('does not exist') || msg.includes('relation')
}

async function tableExists(supabase: any, table: string) {
  const { error } = await supabase.from(table).select('*').limit(1)
  if (!error) return true
  return !isMissingRelationError(error)
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin (check user_profiles table)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'overview'
    
    let responseData: any = {}
    
    // Get different data based on type
    switch (dataType) {
      case 'overview':
        // Get overview stats
        responseData = await getOverviewStats(supabase)
        break
        
      case 'bug_reports':
        // Get all bug reports
        responseData = await getBugReports(supabase, searchParams)
        break
        
      case 'user_stats':
        // Get user statistics
        responseData = await getUserStats(supabase, searchParams)
        break
        
      case 'activity_log':
        // Get activity log
        responseData = await getActivityLog(supabase, searchParams)
        break
        
      case 'notifications':
        // Get system notifications
        responseData = await getNotifications(supabase)
        break
        
      default:
        responseData = await getOverviewStats(supabase)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: responseData 
    })
    
  } catch (error) {
    console.error('Error in admin monitoring API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper: Get overview statistics
async function getOverviewStats(supabase: any) {
  // Total users (default: user_profiles; some environments have Auth users without user_profiles rows)
  const { count: totalProfileUsers } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')

  // Signup metrics
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const signups7dAgo = new Date(now)
  signups7dAgo.setDate(signups7dAgo.getDate() - 7)
  const signups30dAgo = new Date(now)
  signups30dAgo.setDate(signups30dAgo.getDate() - 30)

  const { count: newTodayFromProfiles } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', yesterday.toISOString())

  const { count: newThisWeekFromProfiles } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', signups7dAgo.toISOString())

  const { count: newThisMonthFromProfiles } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', signups30dAgo.toISOString())

  // Prefer Auth signups/counts when service role is available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let totalAuthUsers: number | null = null
  let newTodayFromAuth: number | null = null
  let newThisWeekFromAuth: number | null = null
  let newThisMonthFromAuth: number | null = null

  if (supabaseUrl && serviceKey) {
    const adminSupabase = createSupabaseJsClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Fetch users via Auth Admin API (pagination). This avoids relying on user_profiles being fully synced.
    const perPage = 1000
    const maxPages = 20
    const allUsers: any[] = []
    for (let page = 1; page <= maxPages; page += 1) {
      const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage })
      if (error) break
      const users = (data?.users || []) as any[]
      allUsers.push(...users)
      if (users.length < perPage) break
    }

    totalAuthUsers = allUsers.length

    const nowTs = now.getTime()
    const yTs = yesterday.getTime()
    const wTs = signups7dAgo.getTime()
    const mTs = signups30dAgo.getTime()

    const createdAts = allUsers
      .map((u) => (u?.created_at ? new Date(u.created_at).getTime() : null))
      .filter((t) => typeof t === 'number' && Number.isFinite(t)) as number[]

    newTodayFromAuth = createdAts.filter((t) => t >= yTs && t <= nowTs).length
    newThisWeekFromAuth = createdAts.filter((t) => t >= wTs && t <= nowTs).length
    newThisMonthFromAuth = createdAts.filter((t) => t >= mTs && t <= nowTs).length
  }

  // Active users (last 7 days) based on activity logs
  const activity7dAgo = new Date(now)
  activity7dAgo.setDate(activity7dAgo.getDate() - 7)

  // Active users (approx): distinct users with activity logs in last 7 days
  const activeUsers = await (async () => {
    const hasActivityLogs = await tableExists(supabase, 'activity_logs')
    const hasUserActivityLog = await tableExists(supabase, 'user_activity_log')

    const table = hasActivityLogs ? 'activity_logs' : hasUserActivityLog ? 'user_activity_log' : null
    if (!table) return 0

    const { data, error } = await supabase
      .from(table)
      .select('user_id,created_at')
      .gte('created_at', activity7dAgo.toISOString())
      .limit(10000)

    if (error) return 0
    const unique = new Set((data || []).map((r: any) => r.user_id).filter(Boolean))
    return unique.size
  })()
  const { count: totalBugs } = await supabase
    .from('bug_reports')
    .select('*', { count: 'exact', head: true })
  
  // Open bug reports
  const { count: openBugs } = await supabase
    .from('bug_reports')
    .select('*', { count: 'exact', head: true })
    .in('status', ['new', 'in_progress'])
  
  // Critical bugs
  const { count: criticalBugs } = await supabase
    .from('bug_reports')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')
    .in('status', ['new', 'in_progress'])
  
  // Unread notifications
  const { count: unreadNotifications } = await supabase
    .from('system_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  
  // Recent registrations (last 24 hours)
  const { data: recentUsers } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, created_at')
    .eq('role', 'user')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Bug reports by category
  const { data: bugsByCategory } = await supabase
    .from('bug_reports')
    .select('category')
    .then((result: any) => {
      const counts: Record<string, number> = {}
      result.data?.forEach((bug: any) => {
        counts[bug.category] = (counts[bug.category] || 0) + 1
      })
      return { data: counts }
    })
  
  return {
    totalUsers: (totalAuthUsers ?? totalProfileUsers ?? 0) || 0,
    totalAuthUsers: totalAuthUsers || 0,
    totalProfileUsers: totalProfileUsers || 0,
    missingProfiles: Math.max(0, (totalAuthUsers ?? 0) - (totalProfileUsers ?? 0)),
    activeUsers: activeUsers || 0,
    newToday: (newTodayFromAuth ?? newTodayFromProfiles ?? 0) || 0,
    newThisWeek: (newThisWeekFromAuth ?? newThisWeekFromProfiles ?? 0) || 0,
    newThisMonth: (newThisMonthFromAuth ?? newThisMonthFromProfiles ?? 0) || 0,
    totalBugs: totalBugs || 0,
    openBugs: openBugs || 0,
    criticalBugs: criticalBugs || 0,
    unreadNotifications: unreadNotifications || 0,
    recentUsers: recentUsers || [],
    bugsByCategory: bugsByCategory || {}
  }
}

// Helper: Get bug reports
async function getBugReports(supabase: any, searchParams: URLSearchParams) {
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  let query = supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (status) {
    query = query.eq('status', status)
  }
  
  if (severity) {
    query = query.eq('severity', severity)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching bug reports:', error)
    return []
  }
  
  return data || []
}

// Helper: Get user statistics
async function getUserStats(supabase: any, searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '100')

  const { data: profiles, error: profilesErr } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, business_name, created_at, role, is_active, is_approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (profilesErr) return []

  // Aggregate last activity + events last 7d from logs
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const hasActivityLogs = await tableExists(supabase, 'activity_logs')
  const hasUserActivityLog = await tableExists(supabase, 'user_activity_log')
  const logTable = hasActivityLogs ? 'activity_logs' : hasUserActivityLog ? 'user_activity_log' : null

  const activityByUser: Record<string, { last_active_at: string | null; events_7d: number }> = {}
  if (logTable) {
    const { data: logs } = await supabase
      .from(logTable)
      .select('user_id,created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000)

    for (const row of logs || []) {
      const userId = (row as any).user_id
      const createdAt = (row as any).created_at
      if (!userId) continue

      if (!activityByUser[userId]) {
        activityByUser[userId] = { last_active_at: createdAt || null, events_7d: 0 }
      }

      activityByUser[userId].events_7d += 1
      if (!activityByUser[userId].last_active_at && createdAt) {
        activityByUser[userId].last_active_at = createdAt
      }
    }
  }

  return (profiles || []).map((p: any) => ({
    user_id: p.user_id,
    full_name: p.full_name,
    business_name: p.business_name,
    created_at: p.created_at,
    role: p.role,
    is_active: p.is_active,
    is_approved: p.is_approved,
    last_active_at: activityByUser[p.user_id]?.last_active_at || null,
    events_7d: activityByUser[p.user_id]?.events_7d || 0,
  }))
}

// Helper: Get activity log
async function getActivityLog(supabase: any, searchParams: URLSearchParams) {
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const limit = parseInt(searchParams.get('limit') || '100')

  const hasActivityLogs = await tableExists(supabase, 'activity_logs')
  const hasUserActivityLog = await tableExists(supabase, 'user_activity_log')
  const logTable = hasActivityLogs ? 'activity_logs' : hasUserActivityLog ? 'user_activity_log' : null
  if (!logTable) return []

  let query = supabase
    .from(logTable)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  if (action) {
    query = query.eq('action', action)
  }
  
  const { data } = await query
  
  return data || []
}

// Helper: Get system notifications
async function getNotifications(supabase: any) {
  const { data } = await supabase
    .from('system_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return data || []
}

// POST: Mark notification as read
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { notificationId, action } = body
    
    if (action === 'mark_read' && notificationId) {
      await supabase
        .from('system_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
    }
    
    if (action === 'mark_all_read') {
      await supabase
        .from('system_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in admin monitoring POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
