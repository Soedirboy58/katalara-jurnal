import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type SuppliersUserColumn = 'owner_id' | 'user_id'

async function getSuppliersUserColumn(supabase: any): Promise<SuppliersUserColumn> {
  const isMissingColumn = (err: any, col: string) => {
    const code = (err?.code || err?.error_code || '').toString().toUpperCase()
    if (code === '42703') return true

    const msg = (err?.message || err?.details || '').toString().toLowerCase()
    const c = col.toLowerCase()

    if (code.startsWith('PGRST')) {
      if (msg.includes('schema cache') && msg.includes(c)) return true
      if (msg.includes('could not find') && msg.includes(c) && (msg.includes('column') || msg.includes('field'))) return true
      if (msg.includes('unknown field') && msg.includes(c)) return true
    }

    return (
      msg.includes('does not exist') &&
      (msg.includes(`suppliers.${c}`) ||
        msg.includes(`column suppliers.${c}`) ||
        msg.includes(`column "${c}"`) ||
        msg.includes(`"${c}" of relation "suppliers"`) ||
        msg.includes(` ${c} `))
    )
  }

  {
    const { error } = await supabase.from('suppliers').select('owner_id').limit(1)
    if (!error) return 'owner_id'
    if (!isMissingColumn(error, 'owner_id')) return 'owner_id'
  }

  {
    const { error } = await supabase.from('suppliers').select('user_id').limit(1)
    if (!error) return 'user_id'
    return 'user_id'
  }
}

// GET: Fetch all suppliers for logged-in user
export async function GET(request: Request) {
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
    const type = searchParams.get('type') // Filter by supplier_type
    const active = searchParams.get('active') !== 'false' // Default true
    
    const userCol = await getSuppliersUserColumn(supabase)

    let query = supabase
      .from('suppliers')
      .select('*')
      .eq(userCol, user.id)
      .order('name', { ascending: true })

    if (active) {
      query = query.eq('is_active', true)
    }

    if (type) {
      query = query.eq('supplier_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching suppliers:', error)
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
  } catch (error: any) {
    console.error('GET /api/suppliers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST: Create new supplier
export async function POST(request: Request) {
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
        { success: false, error: 'Nama supplier wajib diisi' },
        { status: 400 }
      )
    }

    // Check duplicate name
    const userCol = await getSuppliersUserColumn(supabase)

    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .eq(userCol, user.id)
      .ilike('name', body.name.trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Supplier dengan nama ini sudah ada' },
        { status: 400 }
      )
    }

    const supplierData = {
      [userCol]: user.id,
      name: body.name.trim(),
      supplier_type: body.supplier_type || 'finished_goods',
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Supplier berhasil ditambahkan'
    })
  } catch (error: any) {
    console.error('POST /api/suppliers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: Update supplier
export async function PATCH(request: Request) {
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
        { success: false, error: 'Supplier ID required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.name) updateData.name = body.name.trim()
    if (body.supplier_type !== undefined) updateData.supplier_type = body.supplier_type
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const userCol = await getSuppliersUserColumn(supabase)

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', body.id)
      .eq(userCol, user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating supplier:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Supplier berhasil diupdate'
    })
  } catch (error: any) {
    console.error('PATCH /api/suppliers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Soft delete supplier (set is_active = false)
export async function DELETE(request: Request) {
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
        { success: false, error: 'Supplier ID required' },
        { status: 400 }
      )
    }

    // Soft delete
    const userCol = await getSuppliersUserColumn(supabase)

    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq(userCol, user.id)

    if (error) {
      console.error('Error deleting supplier:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil dihapus'
    })
  } catch (error: any) {
    console.error('DELETE /api/suppliers error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
