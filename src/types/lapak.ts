// ============================================================================
// TYPE DEFINITIONS - LAPAK ONLINE
// E-commerce Types for Storefront, Products, Cart, Analytics
// ============================================================================

export interface Storefront {
  id: string;
  user_id: string;
  
  // Identity
  slug: string;
  store_name: string;
  description?: string;
  
  // Branding
  logo_url?: string;
  cover_image_url?: string;
  theme_color: string;
  
  // Contact
  whatsapp_number: string;
  instagram_handle?: string;
  location_text?: string;
  
  // Status
  is_active: boolean;
  
  // Analytics
  total_views: number;
  total_clicks: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StorefrontProduct {
  id: string;
  storefront_id: string;
  user_id: string;
  
  // Product Info
  name: string;
  description?: string;
  category?: string;
  
  // Pricing
  price: number;
  compare_at_price?: number;
  
  // Inventory
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  
  // Media
  image_url?: string;
  image_urls?: string[];
  
  // Variants
  variants?: ProductVariant[];
  
  // Status
  is_visible: boolean;
  is_featured: boolean;
  
  // SEO
  seo_title?: string;
  seo_description?: string;
  
  // Analytics
  view_count: number;
  click_count: number;
  cart_add_count: number;
  
  // Sorting
  sort_order: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  name: string; // e.g., "Ukuran", "Warna"
  options: string[]; // e.g., ["S", "M", "L"], ["Merah", "Biru"]
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  price: number;
  quantity: number;
  variant?: string; // e.g., "Ukuran: M, Warna: Merah"
  notes?: string;
}

export interface CartSession {
  id: string;
  storefront_id: string;
  session_id: string;
  cart_items: CartItem[];
  
  // Customer Info
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  
  // Status
  status: 'active' | 'checked_out' | 'abandoned';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface AnalyticsEvent {
  id: string;
  storefront_id: string;
  event_type: 'page_view' | 'product_view' | 'product_click' | 'cart_add' | 'checkout_start' | 'whatsapp_click';
  product_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface StorefrontAnalytics {
  total_views: number;
  total_product_views: number;
  total_cart_adds: number;
  total_checkouts: number;
  total_whatsapp_clicks: number;
  conversion_rate: number; // percentage
  top_products: {
    product_id: string;
    product_name: string;
    view_count: number;
    cart_add_count: number;
  }[];
}

export interface CheckoutForm {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_method: 'pickup' | 'delivery';
  notes?: string;
}

export interface WhatsAppOrder {
  storefront_name: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_method: string;
  items: CartItem[];
  total_amount: number;
  notes?: string;
}

// Theme presets
export const THEME_PRESETS = [
  { name: 'Biru Modern', color: '#3B82F6', description: 'Profesional dan clean' },
  { name: 'Hijau Fresh', color: '#10B981', description: 'Segar dan natural' },
  { name: 'Merah Passion', color: '#EF4444', description: 'Berani dan energik' },
  { name: 'Ungu Royal', color: '#8B5CF6', description: 'Elegan dan mewah' },
  { name: 'Orange Warm', color: '#F59E0B', description: 'Hangat dan ramah' },
] as const;

// Product categories (common for UMKM)
export const PRODUCT_CATEGORIES = [
  'Makanan & Minuman',
  'Kue & Roti',
  'Fashion',
  'Aksesoris',
  'Kerajinan Tangan',
  'Kosmetik & Perawatan',
  'Elektronik',
  'Mainan Anak',
  'Alat Tulis',
  'Lainnya',
] as const;

// Helper function to format WhatsApp message
export function formatWhatsAppMessage(order: WhatsAppOrder): string {
  const itemsList = order.items
    .map((item, index) => {
      const variant = item.variant ? ` (${item.variant})` : '';
      const notes = item.notes ? `\n   Catatan: ${item.notes}` : '';
      return `${index + 1}. ${item.product_name}${variant}\n   ${item.quantity} × Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.quantity * item.price).toLocaleString('id-ID')}${notes}`;
    })
    .join('\n\n');

  const message = `*PESANAN BARU - ${order.storefront_name}*

📦 *Detail Pesanan:*
${itemsList}

💰 *Total: Rp ${order.total_amount.toLocaleString('id-ID')}*

👤 *Data Pembeli:*
Nama: ${order.customer_name}
No. HP: ${order.customer_phone}
${order.delivery_method === 'delivery' ? `Alamat: ${order.customer_address}` : 'Metode: Ambil di Tempat'}

${order.notes ? `📝 *Catatan:*\n${order.notes}` : ''}

Mohon konfirmasi ketersediaan produk. Terima kasih! 🙏`;

  return encodeURIComponent(message);
}

// Helper function to calculate discount percentage
export function calculateDiscountPercentage(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// Helper function to check if product is in stock
export function isProductInStock(product: StorefrontProduct): boolean {
  if (!product.track_inventory) return true;
  return product.stock_quantity > 0;
}

// Helper function to check if product is low in stock
export function isProductLowStock(product: StorefrontProduct): boolean {
  if (!product.track_inventory) return false;
  return product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
}
