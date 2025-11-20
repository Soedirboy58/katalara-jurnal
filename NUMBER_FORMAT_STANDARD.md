# 🔢 NUMBER FORMAT STANDARDIZATION GUIDE

## 📋 Standard Format untuk Katalara Platform

Semua input dan display nominal uang di platform Katalara harus mengikuti standar ini untuk konsistensi UX.

---

## ✅ Standard Pattern

### Input Field (Form)
```tsx
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9.]*"
  value={parseFloat(amount || 0).toLocaleString('id-ID')}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/\./g, '')
    setAmount(rawValue)
  }}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  placeholder="0"
/>
```

### Display Preview (Below Input)
```tsx
{amount && (
  <p className="text-xs text-gray-500 mt-1">
    Rp {parseFloat(amount || 0).toLocaleString('id-ID')}
  </p>
)}
```

### Display in Tables/Lists
```tsx
<td className="text-right font-semibold">
  Rp {parseFloat(item.amount).toLocaleString('id-ID')}
</td>
```

---

## 🎯 Key Properties

### 1. Input Type
```tsx
type="text"  // ← NOT "number" (to allow formatting)
```
**Reason:** `type="number"` doesn't support thousand separators

### 2. Mobile Keyboard
```tsx
inputMode="numeric"  // ← Shows numeric keyboard on mobile
pattern="[0-9.]*"    // ← Only allows numbers & dots
```
**Devices:**
- iOS: Numeric keypad with decimal
- Android: Numeric keyboard
- Desktop: Normal keyboard

### 3. Display Format
```tsx
value={parseFloat(amount || 0).toLocaleString('id-ID')}
```
**Output Examples:**
- `1000` → `1.000`
- `50000` → `50.000`
- `1000000` → `1.000.000`
- `1500000` → `1.500.000`

### 4. Store Raw Value
```tsx
onChange={(e) => {
  const rawValue = e.target.value.replace(/\./g, '')
  setState(rawValue)
}}
```
**Why:** Database stores numbers without formatting

---

## 📍 Implementation Locations

### ✅ Already Implemented
1. **Edit Expense Modal** (`input-expenses/page.tsx`)
   - ✅ Amount field formatted
   - ✅ Mobile numeric keyboard
   - ✅ Dynamic category dropdown

2. **Main Expense Form** (`input-expenses/page.tsx`)
   - ✅ Amount field formatted
   - ✅ Mobile numeric keyboard

### ⏳ Needs Implementation

3. **Input Sales Page** (`input-sales/page.tsx`)
   - [ ] Total amount input
   - [ ] Discount input (if exists)
   - [ ] Unit price input

4. **Settings Page** (`settings/page.tsx`)
   - [ ] Daily expense limit input
   - [ ] Notification threshold input

5. **Inventory Page** (`inventory/page.tsx`)
   - [ ] Product price inputs
   - [ ] Cost per unit inputs
   - [ ] Stock value displays

6. **Reports Pages** (`reports/*.tsx`)
   - [ ] All number displays in tables
   - [ ] Summary cards
   - [ ] Chart tooltips

---

## 🔧 Reusable Component (Recommended)

Create `<CurrencyInput />` component untuk konsistensi:

```tsx
// components/ui/CurrencyInput.tsx
'use client'

import { useState, useEffect } from 'react'

interface CurrencyInputProps {
  value: string | number
  onChange: (rawValue: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  showPreview?: boolean
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  label,
  showPreview = true
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    const formatted = parseFloat(value?.toString() || '0').toLocaleString('id-ID')
    setDisplayValue(formatted)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '')
    
    // Only allow numbers
    if (!/^\d*$/.test(rawValue)) return
    
    onChange(rawValue)
    setDisplayValue(parseFloat(rawValue || '0').toLocaleString('id-ID'))
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}`}
        />
      </div>
      
      {showPreview && value && (
        <p className="text-xs text-gray-500 mt-1">
          Rp {parseFloat(value?.toString() || '0').toLocaleString('id-ID')}
        </p>
      )}
    </div>
  )
}
```

### Usage Example
```tsx
import { CurrencyInput } from '@/components/ui/CurrencyInput'

// In your component
const [amount, setAmount] = useState('')

<CurrencyInput
  label="Jumlah Pengeluaran"
  value={amount}
  onChange={setAmount}
  showPreview={true}
/>
```

---

## 📊 Display Variations

### Small Numbers (< 1 Million)
```tsx
// Format: 1.000 - 999.000
Rp {amount.toLocaleString('id-ID')}
```

### Large Numbers (≥ 1 Million)
```tsx
// Option 1: Full format
Rp 1.500.000

// Option 2: Abbreviated (for charts/mobile)
Rp 1,5 Jt   // Juta
Rp 2,3 M    // Million
```

### Percentage
```tsx
{percentage.toFixed(1)}%
// Example: 85.0%
```

### Decimal Numbers
```tsx
// 2 decimal places
Rp {amount.toLocaleString('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}
// Example: Rp 1.500.000,50
```

---

## 🎨 CSS Styling Patterns

### Input Field
```tsx
className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent
  text-gray-900 text-right"  // ← text-right for currency
```

### Display in Cards
```tsx
<div className="text-2xl font-bold text-blue-600 tabular-nums">
  Rp {amount.toLocaleString('id-ID')}
</div>
```
**Note:** `tabular-nums` makes numbers align nicely in columns

### Display in Tables
```tsx
<td className="px-4 py-2 text-right font-semibold text-gray-900 tabular-nums">
  Rp {amount.toLocaleString('id-ID')}
</td>
```

---

## ⚠️ Common Mistakes

### ❌ Wrong
```tsx
// Don't use type="number" with formatted display
<input type="number" value="1.000.000" />  // ← Will break

// Don't store formatted value in state
setState("1.000.000")  // ← Database will fail

// Don't use comma separator
amount.toLocaleString('en-US')  // ← Shows 1,000,000 (wrong for ID)
```

### ✅ Correct
```tsx
// Use type="text" + inputMode="numeric"
<input type="text" inputMode="numeric" value="1.000.000" />

// Store raw value without formatting
setState("1000000")

// Use Indonesian locale
amount.toLocaleString('id-ID')  // ← Shows 1.000.000 (correct)
```

---

## 🧪 Testing Checklist

### Desktop
- [ ] Type number → Should format with dots
- [ ] Copy/paste number → Should format correctly
- [ ] Delete digits → Should reformat instantly
- [ ] Tab/Enter key → Should work normally

### Mobile (iOS)
- [ ] Tap field → Numeric keypad appears
- [ ] Type numbers → Formats with dots
- [ ] Keyboard has decimal point
- [ ] No full keyboard needed

### Mobile (Android)
- [ ] Tap field → Numeric keyboard appears
- [ ] Type numbers → Formats with dots
- [ ] Easy number input
- [ ] No autocorrect interference

### Edge Cases
- [ ] Empty value → Shows "0" or placeholder
- [ ] Very large number → Formats correctly (999.999.999)
- [ ] Leading zeros → Removed automatically (0001 → 1)
- [ ] Non-numeric input → Rejected/ignored

---

## 📱 Mobile Keyboard Behavior

### InputMode Options
```tsx
inputMode="numeric"    // Best for currency (0-9, decimal)
inputMode="decimal"    // Similar, with decimal emphasis
inputMode="tel"        // Phone-style numeric keypad
```

**Recommendation:** Use `inputMode="numeric"` for currency

### Pattern Attribute
```tsx
pattern="[0-9.]*"      // Only numbers & dots (formatted)
pattern="[0-9]*"       // Only numbers (if no dots needed)
```

---

## 🌐 Internationalization (Future)

### Multiple Currencies
```tsx
interface CurrencyConfig {
  locale: string
  currency: string
  symbol: string
}

const currencies = {
  IDR: { locale: 'id-ID', currency: 'IDR', symbol: 'Rp' },
  USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
  EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
}

// Usage
amount.toLocaleString(currencies.IDR.locale, {
  style: 'currency',
  currency: currencies.IDR.currency
})
```

**Output:** `Rp 1.000.000,00`

---

## 📚 References

### Locale Format
- **Indonesia (id-ID):** `1.000.000` (dot separator, comma decimal)
- **USA (en-US):** `1,000,000` (comma separator, dot decimal)
- **Europe (de-DE):** `1.000.000` (dot separator, comma decimal)

### MDN Documentation
- [Number.prototype.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString)
- [HTML inputmode attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- [HTML pattern attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)

---

## 🚀 Rollout Plan

### Phase 1: Critical Pages (Week 1)
- ✅ Edit Expense Modal
- ✅ Input Expense Form
- [ ] Input Sales Form
- [ ] Settings Page

### Phase 2: Display Pages (Week 2)
- [ ] All report tables
- [ ] Dashboard KPI cards
- [ ] Health Score display

### Phase 3: Component Refactor (Week 3)
- [ ] Create `<CurrencyInput />` component
- [ ] Replace all inline implementations
- [ ] Add unit tests

---

**Created:** 20 November 2025  
**Status:** Standard Adopted ✅  
**Coverage:** 40% (2/5 major pages)  
**Next:** Roll out to Input Sales & Settings pages
