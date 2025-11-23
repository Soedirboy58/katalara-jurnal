import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Fetch incomes with filtering
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const incomeType = searchParams.get('income_type')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('incomes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('income_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('income_date', startDate)
    }
    if (endDate) {
      query = query.lte('income_date', endDate)
    }
    if (incomeType) {
      query = query.eq('income_type', incomeType)
    }
    if (category) {
      query = query.eq('category', category)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching incomes:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      count: count || 0
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new income
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Validate required fields
    if (!body.income_date || !body.income_type || !body.category || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare income data
    const incomeData = {
      user_id: user.id,
      income_date: body.income_date,
      income_type: body.income_type,
      category: body.category,
      amount: body.amount,
      description: body.description || null,
      notes: body.notes || null,
      payment_method: body.payment_method || 'Tunai',
      // Payment tracking fields
      payment_type: body.payment_type || 'cash',
      payment_status: body.payment_status || 'Lunas',
      due_date: body.due_date || null,
      customer_id: body.customer_id || null, // FIXED: customer reference
      // Product sales specific
      product_id: body.product_id || null,
      quantity: body.quantity || null,
      price_per_unit: body.price_per_unit || null,
      // Multi-items data (if applicable)
      line_items: body.line_items || null,
      subtotal: body.subtotal || null,
      discount: body.discount || null,
      tax_ppn: body.tax_ppn || null,
      tax_pph: body.tax_pph || null,
      other_fees: body.other_fees || null,
      down_payment: body.down_payment || null,
      remaining: body.remaining || null
    }

    // Insert income
    const { data, error } = await supabase
      .from('incomes')
      .insert(incomeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating income:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // If product sales, update product stock (reduce)
    if (body.category === 'product_sales') {
      console.log('🔍 Product sales detected, updating stock...')
      console.log('📦 Body data:', { 
        category: body.category, 
        has_line_items: !!body.line_items,
        line_items_type: typeof body.line_items,
        line_items_raw: body.line_items,
        single_product_id: body.product_id 
      })
      
      // Parse line_items if it's a JSON string
      let lineItemsArray = body.line_items
      if (typeof body.line_items === 'string') {
        try {
          lineItemsArray = JSON.parse(body.line_items)
          console.log('📋 Parsed line_items from JSON string:', lineItemsArray)
        } catch (e) {
          console.error('❌ Failed to parse line_items JSON:', e)
          lineItemsArray = []
        }
      }
      
      // Handle multi-items (line_items)
      if (lineItemsArray && Array.isArray(lineItemsArray) && lineItemsArray.length > 0) {
        console.log('📋 Processing multi-items...', lineItemsArray.length, 'items')
        for (const item of lineItemsArray) {
          if (item.product_id && item.quantity) {
            console.log(`  🔸 Item: ${item.product_id}, Qty: ${item.quantity}`)
            
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('stock_quantity, track_inventory, name')
              .eq('id', item.product_id)
              .single()

            if (productError) {
              console.error(`  ❌ Error fetching product:`, productError)
              continue
            }

            console.log(`  📦 Current stock: ${product.stock_quantity}, Track: ${product.track_inventory}`)

            if (product && product.track_inventory) {
              const newStock = (product.stock_quantity || 0) - parseFloat(item.quantity)
              console.log(`  ➡️ Reducing stock from ${product.stock_quantity} to ${newStock}`)
              
              const { error: updateError } = await supabase
                .from('products')
                .update({ stock_quantity: newStock })
                .eq('id', item.product_id)
              
              if (updateError) {
                console.error(`  ❌ Error updating stock:`, updateError)
              } else {
                console.log(`  ✅ Stock updated successfully for ${product.name}`)
              }
            } else {
              console.log(`  ⏭️ Skipping ${product?.name || 'product'} - track_inventory is false`)
            }
          }
        }
      }
      // Handle single item (legacy)
      else if (body.product_id && body.quantity) {
        console.log('📦 Processing single item (legacy)...')
        console.log(`  🔸 Product ID: ${body.product_id}, Qty: ${body.quantity}`)
        
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock_quantity, track_inventory, name')
          .eq('id', body.product_id)
          .single()

        if (productError) {
          console.error(`  ❌ Error fetching product:`, productError)
        } else {
          console.log(`  📦 Current stock: ${product.stock_quantity}, Track: ${product.track_inventory}`)
          
          if (product && product.track_inventory) {
            const newStock = product.stock_quantity - body.quantity
            console.log(`  ➡️ Reducing stock from ${product.stock_quantity} to ${newStock}`)
            
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', body.product_id)
            
            if (updateError) {
              console.error(`  ❌ Error updating stock:`, updateError)
            } else {
              console.log(`  ✅ Stock updated successfully for ${product.name}`)
            }
          } else {
            console.log(`  ⏭️ Skipping - track_inventory is false`)
          }
        }
      } else {
        console.log('⚠️ No product_id or line_items found in request')
      }
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pendapatan berhasil dicatat'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update existing income
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    // Prepare update data (exclude user_id from updates)
    const incomeData = {
      income_date: updateData.income_date,
      income_type: updateData.income_type,
      category: updateData.category,
      amount: updateData.amount,
      description: updateData.description || null,
      notes: updateData.notes || null,
      payment_method: updateData.payment_method || 'Tunai',
      payment_type: updateData.payment_type || 'cash',
      payment_status: updateData.payment_status || 'Lunas',
      due_date: updateData.due_date || null,
      customer_id: updateData.customer_id || null,
      product_id: updateData.product_id || null,
      quantity: updateData.quantity || null,
      price_per_unit: updateData.price_per_unit || null,
      line_items: updateData.line_items || null,
      subtotal: updateData.subtotal || null,
      discount: updateData.discount || null,
      tax_ppn: updateData.tax_ppn || null,
      tax_pph: updateData.tax_pph || null,
      other_fees: updateData.other_fees || null,
      down_payment: updateData.down_payment || null,
      remaining: updateData.remaining || null
    }

    // Update income (only user's own income)
    const { data, error } = await supabase
      .from('incomes')
      .update(incomeData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating income:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Income not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaksi berhasil diupdate'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete income(s)
export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No IDs provided' },
        { status: 400 }
      )
    }

    // Delete incomes (only user's own incomes)
    const { error } = await supabase
      .from('incomes')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting incomes:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} pendapatan berhasil dihapus`
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
