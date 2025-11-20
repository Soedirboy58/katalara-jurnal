// ============================================================================
// API: BUG REPORTS
// ============================================================================
// POST: Submit bug report
// GET: Get user's bug reports
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: Submit Bug Report
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user (optional - bisa anonymous juga)
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { 
      title, 
      description, 
      category, 
      severity,
      page_url,
      browser_info,
      device_info,
      screenshot_url,
      error_message,
      user_email,
      user_phone,
      user_name
    } = body
    
    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }
    
    // Insert bug report
    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        user_id: user?.id || null,
        title,
        description,
        category,
        severity: severity || 'medium',
        status: 'new',
        page_url,
        browser_info,
        device_info,
        screenshot_url,
        error_message,
        user_email: user_email || user?.email,
        user_phone,
        user_name
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error submitting bug report:', error)
      return NextResponse.json(
        { error: 'Failed to submit bug report' },
        { status: 500 }
      )
    }
    
    // Log activity
    if (user?.id) {
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          action: 'submit_bug_report',
          page: page_url,
          details: {
            bug_id: data.id,
            category,
            severity
          }
        })
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Bug report submitted successfully. Thank you for your feedback!' 
    })
    
  } catch (error) {
    console.error('Error in bug report API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get user's bug reports
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
    
    // Get bug reports
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bug reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bug reports' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('Error in bug reports GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
