import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch customer by ID or list all
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    const active = searchParams.get('active') !== 'false' // Default true

    if (customerId) {
      // Fetch single customer
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('owner_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data
      })
    } else {
      // Fetch all customers
      let query = supabase
        .from('customers')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (active) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validation
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama pelanggan wajib diisi' },
        { status: 400 }
      )
    }

    // Check duplicate name (optional - can be removed if you want to allow same names)
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('owner_id', user.id)
      .ilike('name', body.name.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Pelanggan dengan nama ini sudah ada' },
        { status: 400 }
      )
    }

    const customerData = {
      owner_id: user.id,
      name: body.name.trim(),
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pelanggan berhasil ditambahkan'
    })
  } catch (error: any) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update customer
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name) updateData.name = body.name.trim()
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', body.id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pelanggan berhasil diupdate'
    })
  } catch (error: any) {
    console.error('PATCH /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete customer (set is_active = false)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID required' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) {
      console.error('Error deleting customer:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pelanggan berhasil dihapus'
    })
  } catch (error: any) {
    console.error('DELETE /api/customers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
