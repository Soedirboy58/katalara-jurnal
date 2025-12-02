// =====================================================
// KATALARA RANGERS ECOSYSTEM TYPES
// TypeScript definitions for Rangers feature
// =====================================================

export type ServiceType =
  | 'product_photography'
  | 'data_entry'
  | 'catalog_design'
  | 'copywriting'
  | 'social_media_post'
  | 'marketplace_optimization'
  | 'full_concierge';

export type RequestStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'cancelled';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type TransactionType = 'service_fee' | 'bonus' | 'referral' | 'penalty';

export type EarningStatus = 'pending' | 'processed' | 'paid' | 'cancelled';

// =====================================================
// RANGER PROFILE
// =====================================================

export interface RangerProfile {
  id: string;
  user_id: string;
  
  // Personal Info
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  
  // Location
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // Professional Info
  university?: string;
  major?: string;
  student_id?: string;
  graduation_year?: number;
  
  // Skills
  skills?: string[];
  portfolio_url?: string;
  instagram_handle?: string;
  
  // Verification
  is_verified: boolean;
  verification_status: VerificationStatus;
  verified_at?: string;
  verified_by?: string;
  id_card_url?: string;
  
  // Performance
  total_jobs_completed: number;
  total_earnings: number;
  average_rating: number;
  total_reviews: number;
  
  // Availability
  is_active: boolean;
  is_available: boolean;
  max_concurrent_jobs: number;
  
  // Banking
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateRangerProfileInput {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  
  // Location
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  
  // Professional
  university?: string;
  major?: string;
  student_id?: string;
  graduation_year?: number;
  
  skills?: string[];
  portfolio_url?: string;
  instagram_handle?: string;
}

// =====================================================
// SERVICE REQUEST
// =====================================================

export interface ServiceRequest {
  id: string;
  
  // Requester
  business_id: string;
  requested_by: string;
  
  // Service Details
  service_type: ServiceType;
  title: string;
  description: string;
  estimated_items?: number;
  
  // Location
  service_location: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  
  // Pricing
  budget_min?: number;
  budget_max?: number;
  agreed_price?: number;
  
  // Timeline
  preferred_date?: string;
  preferred_time?: string;
  estimated_duration_hours?: number;
  deadline?: string;
  
  // Assignment
  assigned_ranger_id?: string;
  assigned_at?: string;
  
  // Status
  status: RequestStatus;
  status_updated_at: string;
  
  // Completion
  completed_at?: string;
  completion_notes?: string;
  
  // Payment
  payment_status: PaymentStatus;
  payment_method?: string;
  paid_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Relations (populated via joins)
  business?: any;
  assigned_ranger?: RangerProfile;
  review?: ServiceReview;
}

export interface CreateServiceRequestInput {
  business_id: string;
  service_type: ServiceType;
  title: string;
  description: string;
  estimated_items?: number;
  
  service_location: string;
  city?: string;
  district?: string;
  
  budget_min?: number;
  budget_max?: number;
  
  preferred_date?: string;
  preferred_time?: string;
  deadline?: string;
}

// =====================================================
// SERVICE SESSION
// =====================================================

export interface ServiceSession {
  id: string;
  
  service_request_id: string;
  business_id: string;
  ranger_id: string;
  
  // Access Control
  access_granted_at: string;
  access_expires_at?: string;
  is_active: boolean;
  
  // Permissions
  can_create_products: boolean;
  can_edit_products: boolean;
  can_upload_images: boolean;
  can_view_financials: boolean;
  
  // Activity
  products_added: number;
  images_uploaded: number;
  last_activity_at: string;
  
  // Session End
  ended_at?: string;
  ended_by?: string;
  end_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Relations
  service_request?: ServiceRequest;
  ranger?: RangerProfile;
}

// =====================================================
// PORTFOLIO
// =====================================================

export interface RangerPortfolio {
  id: string;
  
  ranger_id: string;
  service_request_id?: string;
  
  title: string;
  description?: string;
  service_type: ServiceType;
  
  images?: string[];
  before_after_images?: {
    before: string[];
    after: string[];
  };
  
  items_completed?: number;
  duration_hours?: number;
  client_satisfaction?: number;
  
  is_public: boolean;
  is_featured: boolean;
  
  completed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  ranger?: RangerProfile;
  service_request?: ServiceRequest;
}

export interface CreatePortfolioInput {
  title: string;
  description?: string;
  service_type: ServiceType;
  images?: string[];
  items_completed?: number;
  duration_hours?: number;
  is_public?: boolean;
}

// =====================================================
// SERVICE REVIEW
// =====================================================

export interface ServiceReview {
  id: string;
  
  service_request_id: string;
  business_id: string;
  ranger_id: string;
  reviewed_by: string;
  
  // Ratings (1-5)
  overall_rating: number;
  quality_rating?: number;
  speed_rating?: number;
  communication_rating?: number;
  
  // Feedback
  review_text?: string;
  pros?: string;
  cons?: string;
  
  // Response
  ranger_response?: string;
  ranger_responded_at?: string;
  
  is_public: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  ranger?: RangerProfile;
  business?: any;
}

export interface CreateReviewInput {
  service_request_id: string;
  overall_rating: number;
  quality_rating?: number;
  speed_rating?: number;
  communication_rating?: number;
  review_text?: string;
  pros?: string;
  cons?: string;
}

// =====================================================
// EARNINGS
// =====================================================

export interface RangerEarning {
  id: string;
  
  ranger_id: string;
  service_request_id?: string;
  
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  
  status: EarningStatus;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  service_request?: ServiceRequest;
}

// =====================================================
// CONTRACT TEMPLATE
// =====================================================

export interface ContractTemplate {
  id: string;
  
  name: string;
  service_type: ServiceType;
  description?: string;
  
  base_price: number;
  price_per_item?: number;
  
  estimated_duration_hours?: number;
  deliverables?: string[];
  terms_and_conditions?: string;
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

// =====================================================
// UI HELPER TYPES
// =====================================================

export interface ServiceTypeConfig {
  value: ServiceType;
  label: string;
  description: string;
  icon: string;
  basePrice: number;
  estimatedHours: number;
}

export const SERVICE_TYPE_CONFIGS: Record<ServiceType, ServiceTypeConfig> = {
  product_photography: {
    value: 'product_photography',
    label: 'Foto Produk',
    description: 'Fotografi produk profesional untuk katalog online',
    icon: '📸',
    basePrice: 50000,
    estimatedHours: 2,
  },
  data_entry: {
    value: 'data_entry',
    label: 'Input Data',
    description: 'Input data produk massal ke sistem',
    icon: '⌨️',
    basePrice: 30000,
    estimatedHours: 3,
  },
  catalog_design: {
    value: 'catalog_design',
    label: 'Desain Katalog',
    description: 'Desain katalog digital profesional',
    icon: '🎨',
    basePrice: 75000,
    estimatedHours: 4,
  },
  copywriting: {
    value: 'copywriting',
    label: 'Deskripsi Produk',
    description: 'Penulisan deskripsi produk yang menarik',
    icon: '✍️',
    basePrice: 40000,
    estimatedHours: 2,
  },
  social_media_post: {
    value: 'social_media_post',
    label: 'Posting Social Media',
    description: 'Posting & kelola konten Instagram/Facebook',
    icon: '📱',
    basePrice: 50000,
    estimatedHours: 2,
  },
  marketplace_optimization: {
    value: 'marketplace_optimization',
    label: 'Optimasi Marketplace',
    description: 'Optimasi toko online di marketplace',
    icon: '🚀',
    basePrice: 100000,
    estimatedHours: 3,
  },
  full_concierge: {
    value: 'full_concierge',
    label: 'Paket Lengkap',
    description: 'Foto + Input Data + Edukasi (All-in-one)',
    icon: '⭐',
    basePrice: 150000,
    estimatedHours: 4,
  },
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Menunggu Ranger',
  assigned: 'Ranger Ditugaskan',
  in_progress: 'Sedang Dikerjakan',
  completed: 'Selesai',
  reviewed: 'Sudah Direview',
  cancelled: 'Dibatalkan',
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  reviewed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

export interface RangerDashboardStats {
  // Performance
  total_jobs: number;
  jobs_completed: number;
  jobs_in_progress: number;
  jobs_pending: number;
  
  // Earnings
  total_earnings: number;
  pending_earnings: number;
  this_month_earnings: number;
  
  // Ratings
  average_rating: number;
  total_reviews: number;
  five_star_count: number;
  
  // Activity
  active_sessions: number;
  products_added_total: number;
  images_uploaded_total: number;
}

export interface UMKMServiceStats {
  // Requests
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  
  // Spending
  total_spent: number;
  average_cost_per_service: number;
  
  // Impact
  products_added_by_rangers: number;
  images_uploaded_by_rangers: number;
  
  // Satisfaction
  average_service_rating: number;
  total_reviews_given: number;
}
