/**
 * CORE DOMAIN TYPES
 * Backend: Core Domain v1.0 (stable & tagged)
 * Tables: users (Supabase Auth), business_config, user_profile
 */

// ============================================
// USER (Supabase Auth)
// ============================================

export interface User {
  id: string
  email: string
  phone?: string
  created_at: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  
  // User metadata
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
  
  // App metadata
  app_metadata?: {
    provider?: string
    role?: string
  }
}

// ============================================
// BUSINESS_CONFIG
// ============================================

export type BusinessType = 
  | 'retail' 
  | 'food_beverage' 
  | 'services' 
  | 'manufacturing' 
  | 'wholesale' 
  | 'ecommerce' 
  | 'other'

export type BusinessSize = 'solo' | 'micro' | 'small' | 'medium'

export interface BusinessConfig {
  id: string
  user_id: string
  
  // Business Identity
  business_name: string
  business_type: BusinessType
  business_size: BusinessSize
  business_phone?: string
  business_email?: string
  business_address?: string
  
  // Location
  province?: string
  city?: string
  postal_code?: string
  
  // Tax & Legal
  tax_id?: string // NPWP
  business_license?: string // NIB/SIUP
  
  // Branding
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  
  // Financial Settings
  currency: string // Default: 'IDR'
  default_tax_rate?: number // PPN rate
  fiscal_year_start?: string // 'YYYY-MM-DD'
  
  // Operational Settings
  timezone: string // Default: 'Asia/Jakarta'
  date_format: string // 'DD/MM/YYYY' or 'MM/DD/YYYY'
  time_format: '12h' | '24h'
  
  // Feature Toggles
  enable_inventory: boolean
  enable_multi_currency: boolean
  enable_tax_calculation: boolean
  enable_invoice_generation: boolean
  enable_storefront: boolean
  
  // Onboarding Status
  onboarding_completed: boolean
  onboarding_step?: number
  onboarding_completed_at?: string
  
  // Subscription (future)
  subscription_plan?: 'free' | 'starter' | 'growth' | 'enterprise'
  subscription_status?: 'active' | 'trial' | 'expired' | 'canceled'
  trial_ends_at?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// USER_PROFILE
// ============================================

export interface UserProfile {
  id: string
  user_id: string
  
  // Personal Info
  full_name?: string
  display_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  
  // Preferences
  language: 'id' | 'en' // Default: 'id'
  theme: 'light' | 'dark' | 'auto'
  notifications_enabled: boolean
  email_notifications: boolean
  whatsapp_notifications: boolean
  
  // Activity
  last_active_at?: string
  last_ip?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// ONBOARDING FLOW
// ============================================

export interface OnboardingStep {
  step: number
  title: string
  description: string
  completed: boolean
}

export interface OnboardingState {
  currentStep: number
  totalSteps: number
  steps: OnboardingStep[]
  canSkip: boolean
  canGoBack: boolean
}

// Step 1: Business Identity
export interface OnboardingBusinessIdentity {
  business_name: string
  business_type: BusinessType
  business_size: BusinessSize
  business_phone?: string
}

// Step 2: Location
export interface OnboardingLocation {
  province: string
  city: string
  business_address?: string
}

// Step 3: Financial Setup
export interface OnboardingFinancial {
  enable_inventory: boolean
  enable_tax_calculation: boolean
  default_tax_rate?: number
  tax_id?: string
}

// Step 4: Feature Selection
export interface OnboardingFeatures {
  enable_storefront: boolean
  enable_invoice_generation: boolean
  enable_multi_currency: boolean
}

export interface OnboardingFormData extends 
  OnboardingBusinessIdentity,
  OnboardingLocation,
  OnboardingFinancial,
  OnboardingFeatures {}

// ============================================
// AUTH STATES
// ============================================

export interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
}

export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface ResetPasswordFormData {
  email: string
}

export interface UpdatePasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

// ============================================
// PROFILE UPDATE
// ============================================

export interface ProfileUpdateFormData {
  full_name?: string
  display_name?: string
  phone?: string
  avatar_url?: string
  bio?: string
  language?: 'id' | 'en'
  theme?: 'light' | 'dark' | 'auto'
  notifications_enabled?: boolean
  email_notifications?: boolean
  whatsapp_notifications?: boolean
}

export interface BusinessUpdateFormData {
  business_name?: string
  business_type?: BusinessType
  business_phone?: string
  business_email?: string
  business_address?: string
  province?: string
  city?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
}
