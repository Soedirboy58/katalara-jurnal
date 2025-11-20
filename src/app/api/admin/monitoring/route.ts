// ============================================================================
// API: ADMIN MONITORING
// ============================================================================
// GET: Get monitoring data (bug reports, user stats, activity)
// Restricted to admin users only
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      .eq('id', user.id)
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
  // Total users
  const { count: totalUsers } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
  
  // Active users (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: activeUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', sevenDaysAgo.toISOString())
  
  // Total bug reports
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
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const { data: recentUsers } = await supabase
    .from('user_profiles')
    .select('id, full_name, created_at')
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
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
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
  const sortBy = searchParams.get('sortBy') || 'last_active_at'
  const limit = parseInt(searchParams.get('limit') || '100')
  
  const { data: stats } = await supabase
    .from('user_stats')
    .select(`
      *,
      user_profiles!inner(id, full_name, email, phone)
    `)
    .order(sortBy, { ascending: false })
    .limit(limit)
  
  return stats || []
}

// Helper: Get activity log
async function getActivityLog(supabase: any, searchParams: URLSearchParams) {
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  let query = supabase
    .from('user_activity_log')
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
      .eq('id', user.id)
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
