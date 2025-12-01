# Quick Reference - Refactored Input Expenses

## 📁 New File Structure

```
src/
├── app/dashboard/input-expenses/
│   └── page.tsx (536 lines) ← Main orchestration
│
├── hooks/expenses/
│   ├── useExpenseForm.ts ← State management
│   ├── useExpenseCalculations.ts ← Financial calculations
│   ├── useExpensesList.ts ← Data fetching
│   └── index.ts ← Barrel export
│
└── components/expenses/
    ├── ExpenseHeader.tsx ← PO, date, description
    ├── ExpenseItemsTable.tsx ← Multi-line items
    ├── ExpensePaymentSummary.tsx ← Calculations display
    ├── ExpensePaymentMethod.tsx ← Payment options
    ├── ExpensesList.tsx ← Recent expenses
    └── index.ts ← Barrel export
```

---

## 🎯 Quick Import Guide

### Using Hooks
```typescript
import { 
  useExpenseForm,           // Form state (replaces 40+ useState)
  useExpenseCalculations,   // Financial totals
  useExpensesList          // Data fetching
} from '@/hooks/expenses'

// In component:
const { formState, actions } = useExpenseForm()
const calculations = useExpenseCalculations({...})
const { expenses, loading, refresh } = useExpensesList({...})
```

### Using Components
```typescript
import {
  ExpenseHeader,
  ExpenseItemsTable,
  ExpensePaymentSummary,
  ExpensePaymentMethod,
  ExpensesList
} from '@/components/expenses'

// In JSX:
<ExpenseHeader {...props} />
<ExpenseItemsTable {...props} />
```

---

## 🔧 Common Tasks

### Add New Field to Form
```typescript
// 1. Update state interface in useExpenseForm.ts
export interface ExpenseFormState {
  header: {
    // Add new field
    newField: string
  }
}

// 2. Add action type
type ExpenseFormAction =
  | { type: 'SET_NEW_FIELD'; payload: string }

// 3. Handle in reducer
case 'SET_NEW_FIELD':
  return {
    ...state,
    header: { ...state.header, newField: action.payload }
  }

// 4. Add action creator
const actions = {
  setNewField: (value: string) =>
    dispatch({ type: 'SET_NEW_FIELD', payload: value })
}
```

### Modify Calculation Logic
```typescript
// Edit useExpenseCalculations.ts
export const useExpenseCalculations = (inputs) => {
  const result = useMemo(() => {
    // Add custom calculation
    const customFee = inputs.someValue * 0.05
    
    return {
      ...existingCalculations,
      customFee
    }
  }, [inputs])
}
```

### Add Filter to Expenses List
```typescript
// Edit useExpensesList.ts
export interface ExpensesFilters {
  // Add new filter
  status?: 'pending' | 'approved'
}

// In query:
if (debouncedFilters.status) {
  query = query.eq('status', debouncedFilters.status)
}
```

---

## 🧪 Testing Checklist

### Manual Testing
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to
http://localhost:3000/dashboard/input-expenses

# 3. Test scenarios:
□ Add expense item
□ Apply discount (% and Rp)
□ Enable/disable tax
□ Set PPh preset
□ Add other fees
□ Submit with Lunas
□ Submit with Tempo
□ Search expenses
□ Create new product
□ Select supplier
```

### TypeScript Check
```bash
# Run type checking
npm run build

# Should see:
✔ Compiled successfully
✔ Running TypeScript ... PASSED
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/hooks/expenses'"
**Solution:** Check tsconfig.json paths configuration
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Property X does not exist on type ExpenseFormState"
**Solution:** Update interface in `useExpenseForm.ts`

### Issue: Component props type error
**Solution:** Check component interface definition matches usage

---

## 📊 Performance Tips

### 1. Avoid Re-renders
```typescript
// ❌ Bad: Creates new object every render
<Component config={{ value: 1 }} />

// ✅ Good: Memoized or outside component
const config = { value: 1 }
<Component config={config} />
```

### 2. Use Callbacks
```typescript
// ❌ Bad: New function every render
<Button onClick={() => doSomething()} />

// ✅ Good: Memoized callback
const handleClick = useCallback(() => doSomething(), [])
<Button onClick={handleClick} />
```

### 3. Split Heavy Components
```typescript
// If a component gets too heavy, extract:
const HeavySection = memo(() => {
  // Complex logic here
})
```

---

## 🚀 Deployment

### Pre-deployment Checklist
```bash
□ TypeScript check passes (npm run build)
□ No console errors in browser
□ All imports resolve correctly
□ Test on production-like data
□ Backup database before deploy
```

### Deploy to Vercel
```bash
# From project root
git add .
git commit -m "Refactor: Input expenses modular architecture"
git push origin main

# Vercel auto-deploys from main branch
```

---

## 📖 Learn More

### Key Files to Study
1. **[useExpenseForm.ts](../../src/hooks/expenses/useExpenseForm.ts)** - Learn useReducer pattern
2. **[useExpenseCalculations.ts](../../src/hooks/expenses/useExpenseCalculations.ts)** - Learn useMemo optimization
3. **[page.tsx](../../src/app/dashboard/input-expenses/page.tsx)** - See how hooks compose

### Patterns Used
- **Reducer Pattern** → Complex state management
- **Memoization** → Expensive calculations
- **Composition** → Combining hooks
- **Presentational Components** → UI separation
- **Barrel Exports** → Clean imports

---

## 🔗 Related Files

- Original backup: [page.backup.tsx](../../src/app/dashboard/input-expenses/page.backup.tsx)
- Full report: [REFACTORING_SUCCESS_REPORT.md](../../REFACTORING_SUCCESS_REPORT.md)
- Type definitions: [src/hooks/expenses/](../../src/hooks/expenses/)

---

**Last Updated:** January 2025  
**Maintainer:** Development Team  
**Questions?** Check the full report or backup file for reference.
