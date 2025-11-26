/**
 * STOREFRONT DOMAIN TYPES
 * Backend: Storefront Domain v1.0 (stable & tagged)
 * Tables: business_storefronts, storefront_products, cart_sessions, storefront_analytics
 */

// ============================================
// BUSINESS_STOREFRONTS
// ============================================

export type StorefrontStatus = 'draft' | 'published' | 'inactive'
export type StorefrontTheme = 'default' | 'modern' | 'minimal' | 'vibrant'

export interface BusinessStorefront {
  id: string
  user_id: string
  
  // Basic Info
  storefront_name: string
  slug: string // Unique URL identifier
  tagline?: string
  description?: string
  
  // Branding
  logo_url?: string
  banner_url?: string
  theme: StorefrontTheme
  primary_color?: string
  secondary_color?: string
  
  // Contact Info
  contact_phone?: string
  contact_email?: string
  contact_whatsapp?: string
  
  // Location
  address?: string
  city?: string
  province?: string
  maps_url?: string
  
  // Social Media
  instagram_url?: string
  facebook_url?: string
  tiktok_url?: string
  
  // Settings
  status: StorefrontStatus
  is_accepting_orders: boolean
  min_order_amount?: number
  delivery_fee?: number
  free_delivery_threshold?: number
  
  // Operating Hours (JSON)
  operating_hours?: {
    [key: string]: { // 'monday', 'tuesday', etc.
      open: string // '09:00'
      close: string // '17:00'
      is_open: boolean
    }
  }
  
  // SEO
  meta_title?: string
  meta_description?: string
  keywords?: string[]
  
  // Analytics
  total_products: number
  total_views: number
  total_orders: number
  
  created_at: string
  updated_at: string
  published_at?: string
}

// ============================================
// STOREFRONT_PRODUCTS
// ============================================

export interface StorefrontProduct {
  id: string
  storefront_id: string
  user_id: string
  
  // Product Reference (links to INVENTORY domain)
  product_id?: string // FK to products.id
  
  // Display Info (denormalized for performance)
  name: string
  description?: string
  category?: string
  
  // Pricing (can override product price)
  price: number // Display price (may differ from products.selling_price)
  discount_price?: number
  discount_percentage?: number
  
  // Stock (synced from products table)
  stock?: number
  is_available: boolean
  
  // Images
  image_url?: string
  images?: string[] // Multiple images
  
  // Display Settings
  is_featured: boolean
  display_order: number
  
  // Tags & Classification
  tags?: string[]
  
  // Visibility
  is_visible: boolean // Toggle product visibility
  
  // Metadata
  view_count: number
  created_at: string
  updated_at: string
}

// ============================================
// CART_SESSIONS (For e-commerce)
// ============================================

export type CartStatus = 'active' | 'checked_out' | 'abandoned'

export interface CartSession {
  id: string
  storefront_id: string
  session_id: string // Browser session ID or user_id
  
  // Customer Info (if provided)
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  
  // Cart Items (JSON)
  items: CartItem[]
  
  // Totals
  subtotal: number
  delivery_fee: number
  grand_total: number
  
  // Checkout Info
  delivery_address?: string
  delivery_notes?: string
  payment_method?: string
  
  // Status
  status: CartStatus
  
  // Timestamps
  created_at: string
  updated_at: string
  checked_out_at?: string
  expires_at: string // Auto-cleanup after 7 days
}

export interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  subtotal: number
  notes?: string
}

// ============================================
// STOREFRONT_ANALYTICS
// ============================================

export type AnalyticsEventType = 
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'whatsapp_click'
  | 'order_placed'

export interface StorefrontAnalytics {
  id: string
  storefront_id: string
  
  // Event Info
  event_type: AnalyticsEventType
  event_date: string
  
  // Session Info
  session_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  
  // Product Reference (if applicable)
  product_id?: string
  product_name?: string
  
  // Additional Data (JSON)
  metadata?: Record<string, any>
  
  created_at: string
}

// ============================================
// STOREFRONT PUBLIC VIEW
// ============================================

export interface StorefrontPublicView {
  storefront: BusinessStorefront
  products: StorefrontProduct[]
  categories: string[] // Unique categories from products
  featuredProducts: StorefrontProduct[]
}

// ============================================
// FORM STATE TYPES
// ============================================

export interface StorefrontFormData {
  storefront_name: string
  slug: string
  tagline?: string
  description?: string
  logo_url?: string
  banner_url?: string
  theme: StorefrontTheme
  contact_phone?: string
  contact_email?: string
  contact_whatsapp?: string
  address?: string
  city?: string
  province?: string
  instagram_url?: string
  facebook_url?: string
  status: StorefrontStatus
  is_accepting_orders: boolean
  min_order_amount?: number
  delivery_fee?: number
}

export interface StorefrontProductFormData {
  product_id?: string // Link to master product
  name: string
  description?: string
  category?: string
  price: number
  discount_price?: number
  image_url?: string
  is_featured: boolean
  is_visible: boolean
  tags?: string[]
}

export interface CheckoutFormData {
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  delivery_notes?: string
  payment_method: 'cash' | 'transfer' | 'cod'
}
