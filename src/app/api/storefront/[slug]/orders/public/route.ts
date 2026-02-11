import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_public_order_status', {
      p_slug: slug,
      p_code: code,
    });

    if (error) {
      console.error('Public order status error:', error);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Public order status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
