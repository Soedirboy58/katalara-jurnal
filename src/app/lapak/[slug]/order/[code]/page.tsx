import Link from 'next/link';

interface OrderTrackingPageProps {
  params: Promise<{ slug: string; code: string }>;
}

async function getOrderStatus(slug: string, code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.katalara.com';
  const res = await fetch(`${baseUrl}/api/storefront/${slug}/orders/public?code=${encodeURIComponent(code)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.data || null;
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { slug, code } = await params;
  const order = await getOrderStatus(slug, code);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Order tidak ditemukan</h1>
          <p className="text-sm text-gray-600">Periksa kembali link tracking Anda.</p>
          <Link href={`/lapak/${slug}`} className="inline-flex mt-4 text-blue-600 text-sm hover:underline">
            Kembali ke Lapak
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: 'Menunggu Konfirmasi',
    confirmed: 'Dikonfirmasi',
    preparing: 'Sedang Disiapkan',
    shipped: 'Dikirim',
    completed: 'Selesai',
    canceled: 'Dibatalkan',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Tracking Order</h1>
        <p className="text-sm text-gray-500 mb-4">{order.storefront_name}</p>

        <div className="space-y-2 text-sm text-gray-700">
          <div><strong>Kode:</strong> {order.order_code}</div>
          <div><strong>Status:</strong> {statusLabel[order.status] || order.status}</div>
          <div><strong>Nama:</strong> {order.customer_name || '-'}</div>
          <div><strong>Total:</strong> Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}</div>
          <div><strong>Pembayaran:</strong> {order.payment_method || '-'}</div>
        </div>

        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Items</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {(order.order_items || []).map((item: any, idx: number) => (
              <li key={`${item.product_id || item.product_name}-${idx}`}>
                {item.product_name} × {item.quantity} — Rp {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('id-ID')}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <Link href={`/lapak/${slug}`} className="text-blue-600 text-sm hover:underline">
            Kembali ke Lapak
          </Link>
        </div>
      </div>
    </div>
  );
}
