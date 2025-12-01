/**
 * Expense Hooks Barrel Export
 * 
 * Clean imports:
 * import { useExpenseForm, useExpenseCalculations } from '@/hooks/expenses'
 */

export { useExpenseForm } from './useExpenseForm'
export type { ExpenseFormState, Supplier, LineItem } from './useExpenseForm'

export { useExpenseCalculations, useTempoCalculations, usePaymentValidation } from './useExpenseCalculations'
export type { DiscountConfig, CalculationInputs, CalculationResult } from './useExpenseCalculations'

export { useExpensesList, useExpense, useExpensesStats } from './useExpensesList'
export type { Expense, ExpensesFilters, UseExpensesListOptions } from './useExpensesList'
