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

  const statusSteps = [
    { key: 'pending', label: 'Order Dibuat' },
    { key: 'confirmed', label: 'Order Diproses' },
    { key: 'preparing', label: 'Siap Dikirim' },
    { key: 'shipped', label: 'Dalam Pengiriman' },
    { key: 'completed', label: 'Selesai' },
  ];

  const currentIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCanceled = order.status === 'canceled';

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

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Status Pengiriman</h2>
          <div className="space-y-3">
            {statusSteps.map((step, idx) => {
              const isDone = !isCanceled && currentIndex >= idx;
              const isCurrent = !isCanceled && currentIndex === idx;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? 'bg-green-600 border-green-600 text-white'
                          : isCanceled
                            ? 'border-red-400 text-red-500'
                            : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div
                        className={`w-px h-6 ${
                          isDone ? 'bg-green-600' : isCanceled ? 'bg-red-200' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </div>
                    {isCurrent && !isCanceled && (
                      <div className="text-xs text-blue-600">Sedang berlangsung</div>
                    )}
                  </div>
                </div>
              );
            })}
            {isCanceled && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-red-500 text-red-600 flex items-center justify-center text-[10px] font-bold">
                  !
                </div>
                <div className="text-sm font-medium text-red-600">Order dibatalkan</div>
              </div>
            )}
          </div>
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
