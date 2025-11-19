/**
 * Business Type Classifier
 * Hybrid approach: Keyword matching first, AI fallback if confidence low
 */

export interface BusinessTypeMapping {
  category: string
  keywords: string[]
  indicators: string[]
  examples: string[]
}

export interface ClassificationResult {
  category: string
  confidence: number
  method: 'manual' | 'keyword' | 'ai'
  reasoning: string
  indicators: string[]
  matchedKeywords?: string[]
}

export const BUSINESS_CATEGORIES = {
  PRODUCT_WITH_STOCK: 'Produk dengan Stok',
  PRODUCT_WITHOUT_STOCK: 'Produk Tanpa Stok',
  SERVICE: 'Jasa/Layanan',
  TRADING: 'Trading/Reseller',
  HYBRID: 'Hybrid (Produk + Jasa)',
} as const

export const BUSINESS_CATEGORIES_ARRAY = [
  'Produk dengan Stok',
  'Produk Tanpa Stok',
  'Jasa/Layanan',
  'Trading/Reseller',
  'Hybrid (Produk + Jasa)',
] as const

/**
 * Keyword-based classification (fast, no API needed)
 */
export function classifyBusinessByKeywords(
  description: string,
  mappings: BusinessTypeMapping[]
): ClassificationResult {
  const input = description.toLowerCase().trim()
  
  if (!input || input.length < 5) {
    return {
      category: '',
      confidence: 0,
      method: 'keyword',
      reasoning: 'Deskripsi terlalu singkat',
      indicators: []
    }
  }

  // Score each category based on keyword matches
  const scores: Record<string, { score: number; matchedKeywords: string[] }> = {}
  
  mappings.forEach(mapping => {
    let score = 0
    const matchedKeywords: string[] = []
    
    // Check keywords
    mapping.keywords.forEach(keyword => {
      if (input.includes(keyword.toLowerCase())) {
        score += 1
        matchedKeywords.push(keyword)
      }
    })
    
    // Bonus for exact phrases in indicators
    mapping.indicators.forEach(indicator => {
      if (input.includes(indicator.toLowerCase())) {
        score += 2 // Indicators weighted higher
        matchedKeywords.push(`"${indicator}"`)
      }
    })
    
    scores[mapping.category] = { score, matchedKeywords }
  })

  // Find highest scoring category
  const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)
  
  if (sortedScores.length === 0 || sortedScores[0][1].score === 0) {
    return {
      category: '',
      confidence: 0,
      method: 'keyword',
      reasoning: 'Tidak ada kata kunci yang cocok. Silakan pilih kategori manual atau deskripsikan lebih detail.',
      indicators: []
    }
  }

  const topCategory = sortedScores[0][0]
  const topScore = sortedScores[0][1].score
  const matchedKeywords = sortedScores[0][1].matchedKeywords
  
  // Check for hybrid (multiple categories scored high)
  const significantScores = sortedScores.filter(([_, data]) => data.score >= 2)
  const isHybrid = significantScores.length >= 2
  
  // Calculate confidence (normalize score to 0-1 range)
  const maxPossibleScore = Math.max(...mappings.map(m => m.keywords.length + m.indicators.length * 2))
  let confidence = Math.min(topScore / (maxPossibleScore * 0.2), 1) // 20% of keywords is high confidence
  
  // Adjust confidence based on description length and quality
  if (input.split(' ').length < 3) confidence *= 0.7 // Short description = lower confidence
  if (matchedKeywords.length >= 3) confidence = Math.min(confidence * 1.2, 1) // Multiple matches = higher confidence
  
  let finalCategory = topCategory
  let reasoning = `Terdeteksi kata kunci: ${matchedKeywords.slice(0, 5).join(', ')}`
  
  if (isHybrid && topCategory !== BUSINESS_CATEGORIES.HYBRID) {
    finalCategory = BUSINESS_CATEGORIES.HYBRID
    const categories = significantScores.map(([cat]) => cat).slice(0, 2)
    reasoning = `Bisnis Anda menggabungkan ${categories.join(' dan ')}`
    confidence = Math.min(confidence * 1.1, 1) // Boost confidence for hybrid detection
  }

  return {
    category: finalCategory,
    confidence: Math.round(confidence * 100) / 100,
    method: 'keyword',
    reasoning,
    indicators: matchedKeywords.slice(0, 5)
  }
}

/**
 * Get human-readable explanation for category
 */
export function getCategoryExplanation(category: string): string {
  const explanations: Record<string, string> = {
    [BUSINESS_CATEGORIES.PRODUCT_WITH_STOCK]: 
      'Bisnis Anda menjual produk fisik dengan inventory/stok yang perlu dikelola. Dashboard akan memantau stok, reorder point, dan inventory turnover.',
    [BUSINESS_CATEGORIES.PRODUCT_WITHOUT_STOCK]:
      'Bisnis Anda menjual produk tanpa menyimpan stok fisik (dropship/pre-order). Dashboard akan fokus pada order fulfillment dan supplier management.',
    [BUSINESS_CATEGORIES.SERVICE]:
      'Bisnis Anda menyediakan jasa/layanan berbasis skill. Dashboard akan memantau utilization rate, revenue per hour, dan client retention.',
    [BUSINESS_CATEGORIES.TRADING]:
      'Bisnis Anda berbasis komisi/margin sebagai perantara. Dashboard akan fokus pada deal velocity, commission earned, dan margin per deal.',
    [BUSINESS_CATEGORIES.HYBRID]:
      'Bisnis Anda menggabungkan penjualan produk dan layanan jasa. Dashboard akan memantau keduanya dan memberikan analisis profitabilitas per segmen.'
  }
  
  return explanations[category] || 'Kategori bisnis tidak dikenali.'
}

/**
 * Get dashboard features for category
 */
export function getDashboardFeatures(category: string): string[] {
  const features: Record<string, string[]> = {
    [BUSINESS_CATEGORIES.PRODUCT_WITH_STOCK]: [
      'Inventory Management & Stock Alerts',
      'Best Selling Products',
      'Inventory Turnover Rate',
      'Reorder Point Recommendations',
      'Dead Stock Analysis'
    ],
    [BUSINESS_CATEGORIES.PRODUCT_WITHOUT_STOCK]: [
      'Order Fulfillment Tracking',
      'Supplier Performance',
      'Lead Time Analysis',
      'Profit Margin per Item',
      'Order Status Management'
    ],
    [BUSINESS_CATEGORIES.SERVICE]: [
      'Utilization Rate (% Waktu Produktif)',
      'Revenue per Hour/Day',
      'Client Retention Rate',
      'Average Service Value',
      'Service Portfolio Performance'
    ],
    [BUSINESS_CATEGORIES.TRADING]: [
      'Deal Velocity (Speed to Close)',
      'Commission Earned Tracking',
      'Margin per Deal',
      'Active Leads vs Closed',
      'Commission Rate Optimization'
    ],
    [BUSINESS_CATEGORIES.HYBRID]: [
      'Segmented Analytics (Produk vs Jasa)',
      'Inventory + Service Management',
      'Profitability per Segment',
      'Resource Allocation Insights',
      'Cross-selling Opportunities'
    ]
  }
  
  return features[category] || []
}

/**
 * Suggest target values based on category
 */
export function suggestTargets(category: string): {
  profitMarginRange: string
  breakEvenMonths: string
  tips: string[]
} {
  const suggestions: Record<string, any> = {
    [BUSINESS_CATEGORIES.PRODUCT_WITH_STOCK]: {
      profitMarginRange: '20-30%',
      breakEvenMonths: '6-12 bulan',
      tips: [
        'Margin retail umumnya 20-30%',
        'Kelola cash flow ketat (stok = uang tertidur)',
        'Fokus pada fast-moving products'
      ]
    },
    [BUSINESS_CATEGORIES.PRODUCT_WITHOUT_STOCK]: {
      profitMarginRange: '15-25%',
      breakEvenMonths: '3-6 bulan',
      tips: [
        'Margin dropship umumnya 15-25%',
        'Modal lebih kecil = break even lebih cepat',
        'Fokus pada supplier reliability'
      ]
    },
    [BUSINESS_CATEGORIES.SERVICE]: {
      profitMarginRange: '30-50%',
      breakEvenMonths: '6-12 bulan',
      tips: [
        'Margin jasa bisa 30-50% (low overhead)',
        'Skill = aset utama',
        'Fokus pada repeat clients'
      ]
    },
    [BUSINESS_CATEGORIES.TRADING]: {
      profitMarginRange: '5-15%',
      breakEvenMonths: '6-18 bulan',
      tips: [
        'Margin trading umumnya 5-15% (volume tinggi)',
        'Networking = kunci',
        'Fokus pada deal velocity'
      ]
    },
    [BUSINESS_CATEGORIES.HYBRID]: {
      profitMarginRange: '25-40%',
      breakEvenMonths: '6-12 bulan',
      tips: [
        'Margin hybrid bisa lebih tinggi (diversifikasi)',
        'Balance antara produk dan jasa',
        'Cross-selling meningkatkan revenue'
      ]
    }
  }
  
  return suggestions[category] || {
    profitMarginRange: '20-30%',
    breakEvenMonths: '6-12 bulan',
    tips: ['Sesuaikan dengan kondisi bisnis Anda']
  }
}

/**
 * Validate and sanitize business description
 */
export function validateDescription(description: string): { valid: boolean; message: string } {
  if (!description || description.trim().length === 0) {
    return { valid: false, message: 'Deskripsi tidak boleh kosong' }
  }
  
  if (description.trim().length < 5) {
    return { valid: false, message: 'Deskripsi terlalu singkat (minimal 5 karakter)' }
  }
  
  if (description.length > 500) {
    return { valid: false, message: 'Deskripsi terlalu panjang (maksimal 500 karakter)' }
  }
  
  // Check for gibberish (too many repeated characters)
  const repeatedChars = /(.)\1{5,}/
  if (repeatedChars.test(description)) {
    return { valid: false, message: 'Deskripsi tidak valid (terlalu banyak karakter berulang)' }
  }
  
  return { valid: true, message: '' }
}
