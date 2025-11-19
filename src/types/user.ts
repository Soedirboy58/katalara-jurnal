export interface BusinessCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone: string
  address: string | null
  business_name: string | null
  business_category_id: string | null
  business_category?: BusinessCategory
  is_verified: boolean
  is_approved: boolean
  is_active: boolean
  role: 'super_admin' | 'user'
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UserWithProfile {
  user_id: string
  email: string
  full_name: string
  phone: string
  address: string | null
  business_name: string | null
  business_category: string | null
  role: 'super_admin' | 'user'
  is_verified: boolean
  is_approved: boolean
  is_active: boolean
}

export interface RegistrationData {
  email: string
  password: string
  full_name: string
  phone: string
  address: string
  business_category_id: string
  business_name?: string
}

export interface AdminUserOverview {
  user_id: string
  email: string
  registered_at: string
  full_name: string
  phone: string
  business_name: string | null
  business_category: string | null
  is_verified: boolean
  is_approved: boolean
  is_active: boolean
  approved_at: string | null
  approved_by_name: string | null
  total_products: number
  total_transactions: number
}
