/**
 * Type definitions for Business Configuration
 */

export interface BusinessConfiguration {
  id: string
  user_id: string
  business_category: string
  business_description?: string
  classification_method: 'manual' | 'keyword' | 'ai'
  classification_confidence?: number
  monthly_revenue_target?: number
  profit_margin_target?: number
  break_even_months?: number
  initial_capital?: number
  monthly_operational_cost?: number
  minimum_cash_alert?: number
  enable_email_alerts: boolean
  enable_stock_alerts: boolean
  enable_weekly_summary: boolean
  onboarding_completed: boolean
  onboarding_completed_at?: string
  onboarding_step: number
  created_at: string
  updated_at: string
}

export interface BusinessTypeMapping {
  id: string
  category: string
  keywords: string[]
  indicators: string[]
  examples: string[]
}

export interface OnboardingWizardData {
  // Step 1: Business Type
  businessCategory: string
  businessDescription: string
  classificationMethod: 'manual' | 'keyword' | 'ai'
  classificationConfidence?: number
  
  // Step 2: Targets & Goals
  monthlyRevenueTarget: number
  profitMarginTarget: number
  breakEvenMonths: number
  
  // Step 3: Capital & Finance
  initialCapital: number
  monthlyOperationalCost: number
  minimumCashAlert: number
  
  // Step 4: Products/Services (will be in separate table)
  // Handled in product/service creation flow
  
  // Step 5: Preferences
  enableEmailAlerts: boolean
  enableStockAlerts: boolean
  enableWeeklySummary: boolean
}

export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5
