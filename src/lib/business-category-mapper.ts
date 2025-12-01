// =====================================================
// BUSINESS CATEGORY MAPPER
// =====================================================
// Purpose: Map UX-friendly business categories to DB constraint values
// Used by: OnboardingWizard, Settings pages that update business_category
// =====================================================

/**
 * Maps new UX-friendly business categories to legacy constraint-compatible values
 * 
 * DB Constraint allows only:
 * - 'Produk dengan Stok'
 * - 'Produk Tanpa Stok'
 * - 'Jasa/Layanan'
 * - 'Trading/Reseller'
 * - 'Hybrid'
 * 
 * UX Categories (from business_type_mappings):
 * - 'Makanan & Minuman'
 * - 'Jasa & Servis'
 * - 'Perdagangan / Toko'
 * - 'Reseller / Dropship'
 * - 'Digital / Online'
 * - 'Produksi'
 * - 'Lainnya'
 */
export function mapBusinessCategoryToConstraint(category: string): string {
  const categoryMap: Record<string, string> = {
    // New UX-friendly categories → Old constraint values
    'Makanan & Minuman': 'Hybrid',
    'Jasa & Servis': 'Jasa/Layanan',
    'Perdagangan / Toko': 'Produk dengan Stok',
    'Reseller / Dropship': 'Trading/Reseller',
    'Digital / Online': 'Produk Tanpa Stok',
    'Produksi': 'Hybrid',
    'Lainnya': 'Hybrid',
    
    // Old categories (backward compatibility)
    'Produk dengan Stok': 'Produk dengan Stok',
    'Produk Tanpa Stok': 'Produk Tanpa Stok',
    'Jasa/Layanan': 'Jasa/Layanan',
    'Trading/Reseller': 'Trading/Reseller',
    'Hybrid': 'Hybrid',
    'Hybrid (Produk + Jasa)': 'Hybrid',
    
    // Additional variations
    'SERVICE': 'Jasa/Layanan',
    'TRADING': 'Trading/Reseller',
    'HYBRID': 'Hybrid',
  }
  
  return categoryMap[category] || 'Hybrid' // Default to Hybrid if unknown
}

/**
 * Validates if a category value is acceptable by DB constraint
 */
export function isValidBusinessCategory(category: string): boolean {
  const validCategories = [
    'Produk dengan Stok',
    'Produk Tanpa Stok',
    'Jasa/Layanan',
    'Trading/Reseller',
    'Hybrid'
  ]
  
  return validCategories.includes(category)
}

/**
 * Get all valid constraint values
 */
export function getValidBusinessCategories(): string[] {
  return [
    'Produk dengan Stok',
    'Produk Tanpa Stok',
    'Jasa/Layanan',
    'Trading/Reseller',
    'Hybrid'
  ]
}
