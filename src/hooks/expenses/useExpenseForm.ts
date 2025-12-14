/**
 * Custom hook for managing expense form state
 * Replaces 40+ useState with single useReducer
 * 
 * @example
 * const { formState, actions } = useExpenseForm()
 * actions.addItem(newItem)
 * actions.setSupplier(supplier)
 */

'use client'

import { useReducer } from 'react'

// ============================================
// TYPES
// ============================================

export interface Supplier {
  id: string
  name: string
  supplier_type: 'raw_materials' | 'finished_goods' | 'both' | 'services'
  phone?: string
  email?: string
  address?: string
  total_purchases?: number
  total_payables?: number
  is_active: boolean
}

export interface LineItem {
  id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit: string
  price_per_unit: number
  subtotal: number
  notes?: string
}

export interface ExpenseFormState {
  // Header info
  header: {
    poNumber: string
    transactionDate: string
    notes: string
    description: string
  }
  
  // Supplier
  supplier: Supplier | null
  
  // Category
  category: {
    expenseType: 'operating' | 'investing' | 'financing'
    category: string
  }
  
  // Items
  items: {
    lineItems: LineItem[]
    currentItem: {
      product_id?: string
      product_name?: string
      quantity?: string
      unit?: string
      price_per_unit?: string
      notes?: string
    }
  }
  
  // Financial calculations
  calculations: {
    discount: {
      mode: 'percent' | 'nominal'
      percent: number
      fixedAmount: number
    }
    taxEnabled: boolean
    pph: {
      preset: '0' | '1' | '2' | '3' | 'custom'
      percent: number
    }
    otherFees: Array<{ id: string; label: string; amount: number }>
    showOtherFees: boolean
  }
  
  // Payment
  payment: {
    status: 'Lunas' | 'Tempo'
    method: 'cash' | 'transfer' | 'tempo'
    downPayment: number
    dueDate: string
    tempoDays: number
  }
  
  // Production output (for raw materials → finished goods)
  productionOutput: {
    show: boolean
    productId: string
    quantity: string
    unit: string
  }
  
  // UI states
  ui: {
    showSupplierModal: boolean
    showProductModal: boolean
    showNotes: boolean
    showEducationalModal: boolean
    submitting: boolean
  }
}

// ============================================
// ACTION TYPES
// ============================================

type ExpenseFormAction =
  // Header
  | { type: 'SET_TRANSACTION_DATE'; payload: string }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  
  // Supplier
  | { type: 'SET_SUPPLIER'; payload: Supplier | null }
  
  // Category
  | { type: 'SET_CATEGORY'; payload: { expenseType: 'operating' | 'investing' | 'financing'; category: string } }
  | { type: 'SET_EXPENSE_TYPE'; payload: 'operating' | 'investing' | 'financing' }
  
  // Items
  | { type: 'ADD_ITEM'; payload: LineItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_CURRENT_ITEM'; payload: Partial<ExpenseFormState['items']['currentItem']> }
  | { type: 'RESET_CURRENT_ITEM' }
  
  // Calculations
  | { type: 'SET_DISCOUNT_MODE'; payload: 'percent' | 'nominal' }
  | { type: 'SET_DISCOUNT_PERCENT'; payload: number }
  | { type: 'SET_DISCOUNT_AMOUNT'; payload: number }
  | { type: 'SET_TAX_ENABLED'; payload: boolean }
  | { type: 'SET_PPH_PRESET'; payload: '0' | '1' | '2' | '3' | 'custom' }
  | { type: 'SET_PPH_PERCENT'; payload: number }
  | { type: 'ADD_OTHER_FEE'; payload: { id: string; label: string; amount: number } }
  | { type: 'REMOVE_OTHER_FEE'; payload: string }
  | { type: 'UPDATE_OTHER_FEE'; payload: { id: string; label?: string; amount?: number } }
  | { type: 'TOGGLE_OTHER_FEES'; payload: boolean }
  
  // Payment
  | { type: 'SET_PAYMENT_STATUS'; payload: 'Lunas' | 'Tempo' }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'cash' | 'transfer' | 'tempo' }
  | { type: 'SET_DOWN_PAYMENT'; payload: number }
  | { type: 'SET_DUE_DATE'; payload: string }
  | { type: 'SET_TEMPO_DAYS'; payload: number }
  
  // Production Output
  | { type: 'TOGGLE_PRODUCTION_OUTPUT'; payload: boolean }
  | { type: 'SET_PRODUCTION_OUTPUT'; payload: Partial<ExpenseFormState['productionOutput']> }
  
  // UI
  | { type: 'TOGGLE_UI'; payload: { key: keyof ExpenseFormState['ui']; value: boolean } }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  
  // Reset
  | { type: 'RESET_FORM' }

// ============================================
// INITIAL STATE
// ============================================

const generatePONumber = () => {
  const year = new Date().getFullYear()
  const timestamp = String(Date.now()).slice(-6)
  return `PO/${year}/${timestamp}`
}

const initialState: ExpenseFormState = {
  header: {
    poNumber: generatePONumber(),
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    description: ''
  },
  supplier: null,
  category: {
    expenseType: 'operating',
    category: ''
  },
  items: {
    lineItems: [],
    currentItem: {
      product_id: '',
      product_name: '',
      quantity: '',
      unit: 'pcs',
      price_per_unit: '',
      notes: ''
    }
  },
  calculations: {
    discount: {
      mode: 'percent',
      percent: 0,
      fixedAmount: 0
    },
    taxEnabled: false,
    pph: {
      preset: '0',
      percent: 0
    },
    otherFees: [],
    showOtherFees: false
  },
  payment: {
    status: 'Lunas',
    method: 'cash',
    downPayment: 0,
    dueDate: '',
    tempoDays: 7
  },
  productionOutput: {
    show: false,
    productId: '',
    quantity: '',
    unit: 'pcs'
  },
  ui: {
    showSupplierModal: false,
    showProductModal: false,
    showNotes: false,
    showEducationalModal: false,
    submitting: false
  }
}

// ============================================
// REDUCER
// ============================================

const expenseFormReducer = (
  state: ExpenseFormState,
  action: ExpenseFormAction
): ExpenseFormState => {
  switch (action.type) {
    // Header
    case 'SET_TRANSACTION_DATE':
      return {
        ...state,
        header: { ...state.header, transactionDate: action.payload }
      }
    
    case 'SET_NOTES':
      return {
        ...state,
        header: { ...state.header, notes: action.payload }
      }
    
    case 'SET_DESCRIPTION':
      return {
        ...state,
        header: { ...state.header, description: action.payload }
      }
    
    // Supplier
    case 'SET_SUPPLIER':
      return {
        ...state,
        supplier: action.payload
      }
    
    // Category
    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.payload,
        // Reset items when category changes
        items: {
          lineItems: [],
          currentItem: {
            product_id: '',
            product_name: '',
            quantity: '',
            unit: 'pcs',
            price_per_unit: '',
            notes: ''
          }
        }
      }
    
    case 'SET_EXPENSE_TYPE':
      return {
        ...state,
        category: { ...state.category, expenseType: action.payload }
      }
    
    // Items
    case 'ADD_ITEM':
      return {
        ...state,
        items: {
          lineItems: [...state.items.lineItems, action.payload],
          currentItem: {
            product_id: '',
            product_name: '',
            quantity: '',
            unit: 'pcs',
            price_per_unit: '',
            notes: ''
          }
        }
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: {
          ...state.items,
          lineItems: state.items.lineItems.filter(item => item.id !== action.payload)
        }
      }
    
    case 'UPDATE_CURRENT_ITEM':
      return {
        ...state,
        items: {
          ...state.items,
          currentItem: { ...state.items.currentItem, ...action.payload }
        }
      }
    
    case 'RESET_CURRENT_ITEM':
      return {
        ...state,
        items: {
          ...state.items,
          currentItem: {
            product_id: '',
            product_name: '',
            quantity: '',
            unit: 'pcs',
            price_per_unit: '',
            notes: ''
          }
        }
      }
    
    // Calculations
    case 'SET_DISCOUNT_MODE':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          discount: { ...state.calculations.discount, mode: action.payload }
        }
      }
    
    case 'SET_DISCOUNT_PERCENT':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          discount: { ...state.calculations.discount, percent: action.payload }
        }
      }
    
    case 'SET_DISCOUNT_AMOUNT':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          discount: { ...state.calculations.discount, fixedAmount: action.payload }
        }
      }
    
    case 'SET_TAX_ENABLED':
      return {
        ...state,
        calculations: { ...state.calculations, taxEnabled: action.payload }
      }
    
    case 'SET_PPH_PRESET':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          pph: { ...state.calculations.pph, preset: action.payload }
        }
      }
    
    case 'SET_PPH_PERCENT':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          pph: { ...state.calculations.pph, percent: action.payload }
        }
      }
    
    case 'ADD_OTHER_FEE':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          otherFees: [...state.calculations.otherFees, action.payload]
        }
      }
    
    case 'REMOVE_OTHER_FEE':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          otherFees: state.calculations.otherFees.filter(fee => fee.id !== action.payload)
        }
      }
    
    case 'UPDATE_OTHER_FEE':
      return {
        ...state,
        calculations: {
          ...state.calculations,
          otherFees: state.calculations.otherFees.map(fee =>
            fee.id === action.payload.id
              ? { ...fee, ...action.payload }
              : fee
          )
        }
      }
    
    case 'TOGGLE_OTHER_FEES':
      return {
        ...state,
        calculations: { ...state.calculations, showOtherFees: action.payload }
      }
    
    // Payment
    case 'SET_PAYMENT_STATUS':
      return {
        ...state,
        payment: {
          ...state.payment,
          status: action.payload,
          method: action.payload === 'Tempo' ? 'tempo' : state.payment.method
        }
      }
    
    case 'SET_PAYMENT_METHOD':
      return {
        ...state,
        payment: { ...state.payment, method: action.payload as 'cash' | 'transfer' | 'tempo' }
      }
    
    case 'SET_DOWN_PAYMENT':
      return {
        ...state,
        payment: { ...state.payment, downPayment: action.payload }
      }
    
    case 'SET_DUE_DATE':
      return {
        ...state,
        payment: { ...state.payment, dueDate: action.payload }
      }
    
    case 'SET_TEMPO_DAYS':
      return {
        ...state,
        payment: { ...state.payment, tempoDays: action.payload }
      }
    
    // Production Output
    case 'TOGGLE_PRODUCTION_OUTPUT':
      return {
        ...state,
        productionOutput: { ...state.productionOutput, show: action.payload }
      }
    
    case 'SET_PRODUCTION_OUTPUT':
      return {
        ...state,
        productionOutput: { ...state.productionOutput, ...action.payload }
      }
    
    // UI
    case 'TOGGLE_UI':
      return {
        ...state,
        ui: { ...state.ui, [action.payload.key]: action.payload.value }
      }
    
    case 'SET_SUBMITTING':
      return {
        ...state,
        ui: { ...state.ui, submitting: action.payload }
      }
    
    // Reset
    case 'RESET_FORM':
      return {
        ...initialState,
        header: {
          ...initialState.header,
          poNumber: generatePONumber(),
          transactionDate: new Date().toISOString().split('T')[0]
        }
      }
    
    default:
      return state
  }
}

// ============================================
// HOOK
// ============================================

export const useExpenseForm = () => {
  const [state, dispatch] = useReducer(expenseFormReducer, initialState)
  
  // Action creators
  const actions = {
    // Header
    setTransactionDate: (date: string) =>
      dispatch({ type: 'SET_TRANSACTION_DATE', payload: date }),
    
    setNotes: (notes: string) =>
      dispatch({ type: 'SET_NOTES', payload: notes }),
    
    setDescription: (description: string) =>
      dispatch({ type: 'SET_DESCRIPTION', payload: description }),
    
    // Supplier
    setSupplier: (supplier: Supplier | null) =>
      dispatch({ type: 'SET_SUPPLIER', payload: supplier }),
    
    // Category
    setCategory: (expenseType: 'operating' | 'investing' | 'financing', category: string) =>
      dispatch({ type: 'SET_CATEGORY', payload: { expenseType, category } }),
    
    setExpenseType: (expenseType: 'operating' | 'investing' | 'financing') =>
      dispatch({ type: 'SET_EXPENSE_TYPE', payload: expenseType }),
    
    // Items
    addItem: (item: LineItem) =>
      dispatch({ type: 'ADD_ITEM', payload: item }),
    
    removeItem: (id: string) =>
      dispatch({ type: 'REMOVE_ITEM', payload: id }),
    
    updateCurrentItem: (updates: Partial<ExpenseFormState['items']['currentItem']>) =>
      dispatch({ type: 'UPDATE_CURRENT_ITEM', payload: updates }),
    
    resetCurrentItem: () =>
      dispatch({ type: 'RESET_CURRENT_ITEM' }),
    
    // Calculations
    setDiscountMode: (mode: 'percent' | 'nominal') =>
      dispatch({ type: 'SET_DISCOUNT_MODE', payload: mode }),
    
    setDiscountPercent: (percent: number) =>
      dispatch({ type: 'SET_DISCOUNT_PERCENT', payload: percent }),
    
    setDiscountAmount: (amount: number) =>
      dispatch({ type: 'SET_DISCOUNT_AMOUNT', payload: amount }),
    
    setTaxEnabled: (enabled: boolean) =>
      dispatch({ type: 'SET_TAX_ENABLED', payload: enabled }),
    
    setPphPreset: (preset: '0' | '1' | '2' | '3' | 'custom') =>
      dispatch({ type: 'SET_PPH_PRESET', payload: preset }),
    
    setPphPercent: (percent: number) =>
      dispatch({ type: 'SET_PPH_PERCENT', payload: percent }),
    
    addOtherFee: (fee: { id: string; label: string; amount: number }) =>
      dispatch({ type: 'ADD_OTHER_FEE', payload: fee }),
    
    removeOtherFee: (id: string) =>
      dispatch({ type: 'REMOVE_OTHER_FEE', payload: id }),
    
    updateOtherFee: (id: string, updates: { label?: string; amount?: number }) =>
      dispatch({ type: 'UPDATE_OTHER_FEE', payload: { id, ...updates } }),
    
    toggleOtherFees: (show: boolean) =>
      dispatch({ type: 'TOGGLE_OTHER_FEES', payload: show }),
    
    // Payment
    setPaymentStatus: (status: 'Lunas' | 'Tempo') =>
      dispatch({ type: 'SET_PAYMENT_STATUS', payload: status }),
    
    setPaymentMethod: (method: 'cash' | 'transfer' | 'tempo') =>
      dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    
    setDownPayment: (amount: number) =>
      dispatch({ type: 'SET_DOWN_PAYMENT', payload: amount }),
    
    setDueDate: (date: string) =>
      dispatch({ type: 'SET_DUE_DATE', payload: date }),
    
    setTempoDays: (days: number) =>
      dispatch({ type: 'SET_TEMPO_DAYS', payload: days }),
    
    // Production Output
    toggleProductionOutput: (show: boolean) =>
      dispatch({ type: 'TOGGLE_PRODUCTION_OUTPUT', payload: show }),
    
    setProductionOutput: (updates: Partial<ExpenseFormState['productionOutput']>) =>
      dispatch({ type: 'SET_PRODUCTION_OUTPUT', payload: updates }),
    
    // UI
    toggleUI: (key: keyof ExpenseFormState['ui'], value: boolean) =>
      dispatch({ type: 'TOGGLE_UI', payload: { key, value } }),
    
    setSubmitting: (submitting: boolean) =>
      dispatch({ type: 'SET_SUBMITTING', payload: submitting }),
    
    // Reset
    resetForm: () =>
      dispatch({ type: 'RESET_FORM' })
  }
  
  return {
    formState: state,
    actions
  }
}
