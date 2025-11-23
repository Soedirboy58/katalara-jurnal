# 💰 Finance & Investment API Documentation

## Overview
Complete REST API for managing loans, investor funding, and investments.

**Base URL**: `https://supabase-migration-7y51a4dmb-katalaras-projects.vercel.app`

**Authentication**: Required - Bearer token via Supabase Auth

---

## 📊 API Endpoints Summary

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Loans** | `/api/loans` | GET | List all loans |
| | `/api/loans` | POST | Create loan with auto-generated installments |
| | `/api/loans/[id]` | GET | Get single loan with installments |
| | `/api/loans/[id]` | PATCH | Update loan details |
| | `/api/loans/[id]` | DELETE | Delete loan (if no payments made) |
| **Installments** | `/api/loans/installments` | POST | Pay installment & create expense |
| | `/api/loans/installments` | GET | Get upcoming installments (reminders) |
| **Investors** | `/api/investors` | GET | List all investor funding |
| | `/api/investors` | POST | Create investor funding agreement |
| **Profit Sharing** | `/api/investors/profit-sharing` | POST | Record profit sharing payment |
| | `/api/investors/profit-sharing` | GET | Get profit sharing history |
| **Investments** | `/api/investments` | GET | List all investments |
| | `/api/investments` | POST | Create new investment |
| **Returns** | `/api/investments/returns` | POST | Record investment return |
| | `/api/investments/returns` | GET | Get investment returns |

---

## 🏦 1. Loans API

### GET /api/loans
Get all loans for authenticated user.

**Query Parameters**:
- `status` (optional): Filter by status (`active`, `paid_off`, `defaulted`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "loans": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "loan_amount": 50000000,
      "interest_rate": 12.0,
      "loan_term_months": 12,
      "installment_amount": 4440383,
      "installment_frequency": "monthly",
      "loan_date": "2025-01-01",
      "first_payment_date": "2025-02-01",
      "lender_name": "Bank BCA",
      "lender_contact": "021-xxx",
      "purpose": "Modal kerja",
      "notes": null,
      "status": "active",
      "total_paid": 0,
      "remaining_balance": 50000000,
      "loan_installments": [{ "count": 12 }],
      "created_at": "2025-01-01T...",
      "updated_at": "2025-01-01T..."
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### POST /api/loans
Create new loan with auto-generated installment schedule.

**Request Body**:
```json
{
  "loan_amount": 50000000,
  "interest_rate": 12.0,
  "loan_term_months": 12,
  "loan_date": "2025-01-01",
  "first_payment_date": "2025-02-01",
  "lender_name": "Bank BCA",
  "lender_contact": "021-xxx" (optional),
  "purpose": "Modal kerja" (optional),
  "notes": "Notes..." (optional),
  "installment_frequency": "monthly" (optional, default: "monthly"),
  "income_transaction_id": "uuid" (optional)
}
```

**Auto-Calculation**:
- Uses **Anuitas formula**: `PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)`
- Generates installment schedule with principal & interest breakdown
- Handles last installment rounding adjustment

**Response**:
```json
{
  "message": "Loan created successfully",
  "loan": {
    "id": "uuid",
    "loan_amount": 50000000,
    "installment_amount": 4440383,
    "loan_installments": [
      {
        "installment_number": 1,
        "due_date": "2025-02-01",
        "principal_amount": 3940383,
        "interest_amount": 500000,
        "total_amount": 4440383,
        "status": "pending"
      }
      // ... 11 more installments
    ]
  }
}
```

---

### GET /api/loans/[id]
Get single loan with full installment details.

**Response**: Loan object with nested `loan_installments` array

---

### PATCH /api/loans/[id]
Update loan metadata (cannot change financial terms).

**Request Body** (all optional):
```json
{
  "lender_name": "New lender",
  "lender_contact": "New contact",
  "purpose": "Updated purpose",
  "notes": "New notes",
  "status": "active" | "paid_off" | "defaulted"
}
```

---

### DELETE /api/loans/[id]
Delete loan (only if no installments have been paid).

**Error**: Returns 400 if any installments are marked as paid.

---

## 💳 2. Installments API

### POST /api/loans/installments (Pay Installment)
Mark installment as paid and create linked expense transaction.

**Request Body**:
```json
{
  "installment_id": "uuid",
  "paid_date": "2025-02-01",
  "paid_amount": 4440383,
  "payment_method": "cash" | "transfer" (optional),
  "notes": "Paid via transfer" (optional)
}
```

**Auto-Actions**:
1. Creates expense transaction (category: `debt_payment`)
2. Updates installment status to `paid`
3. Links expense to installment
4. Recalculates loan `total_paid` and `remaining_balance`
5. Changes loan status to `paid_off` if all installments paid

**Response**:
```json
{
  "message": "Payment recorded successfully",
  "installment": { /* updated installment */ },
  "expense": { /* created expense */ },
  "loan_status": "active" | "paid_off"
}
```

---

### GET /api/loans/installments (Reminders)
Get upcoming installments for reminders/notifications.

**Query Parameters**:
- `days` (optional): Look ahead N days (default: 30)
- `status` (optional): Filter by status (default: "pending")

**Response**:
```json
{
  "installments": [
    {
      "id": "uuid",
      "loan_id": "uuid",
      "installment_number": 3,
      "due_date": "2025-04-01",
      "total_amount": 4440383,
      "status": "pending",
      "loans": {
        "lender_name": "Bank BCA",
        "loan_amount": 50000000
      }
    }
  ]
}
```

---

## 👥 3. Investor Funding API

### GET /api/investors
Get all investor funding agreements.

**Query Parameters**:
- `status` (optional): Filter by status (`active`, `completed`, `terminated`)

**Response**:
```json
{
  "investors": [
    {
      "id": "uuid",
      "investment_amount": 100000000,
      "profit_share_percentage": 30.0,
      "payment_frequency": "monthly",
      "start_date": "2025-01-01",
      "end_date": "2026-01-01",
      "duration_months": 12,
      "investor_name": "PT Investor ABC",
      "investor_contact": "investor@abc.com",
      "investor_bank_account": "1234567890",
      "status": "active",
      "total_profit_shared": 0,
      "profit_sharing_payments": [{ "count": 0 }]
    }
  ]
}
```

---

### POST /api/investors
Create new investor funding agreement.

**Request Body**:
```json
{
  "investment_amount": 100000000,
  "profit_share_percentage": 30.0,
  "payment_frequency": "monthly" | "quarterly" | "annually",
  "start_date": "2025-01-01",
  "end_date": "2026-01-01" (optional),
  "duration_months": 12 (optional),
  "investor_name": "PT Investor ABC",
  "investor_contact": "investor@abc.com" (optional),
  "investor_bank_account": "1234567890" (optional),
  "agreement_number": "AGR-001" (optional),
  "notes": "Notes..." (optional),
  "income_transaction_id": "uuid" (optional)
}
```

**Validation**:
- `profit_share_percentage` must be between 0 and 100

---

## 📊 4. Profit Sharing API

### POST /api/investors/profit-sharing
Record profit sharing payment to investor.

**Request Body**:
```json
{
  "funding_id": "uuid",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "business_revenue": 50000000,
  "business_expenses": 30000000,
  "due_date": "2025-02-05",
  "status": "pending" | "paid" (optional, default: "pending"),
  "paid_date": "2025-02-05" (required if status="paid"),
  "payment_method": "transfer" (optional),
  "notes": "Notes..." (optional)
}
```

**Auto-Calculation**:
- Net profit = revenue - expenses
- Share amount = net_profit * (profit_share_percentage / 100)
- If status = "paid", creates expense transaction
- Updates `total_profit_shared` in investor_funding

**Validation**:
- Returns error if net_profit is negative

**Response**:
```json
{
  "message": "Profit sharing payment recorded successfully",
  "payment": {
    "id": "uuid",
    "net_profit": 20000000,
    "share_amount": 6000000,
    "status": "paid",
    "expense_transaction_id": "uuid"
  }
}
```

---

### GET /api/investors/profit-sharing
Get profit sharing payment history.

**Query Parameters**:
- `funding_id` (optional): Filter by specific funding
- `status` (optional): Filter by status

---

## 💼 5. Investments API

### GET /api/investments
Get all investments (deposits, stocks, bonds, etc).

**Query Parameters**:
- `type` (optional): Filter by type (`deposit`, `stocks`, `bonds`, `mutual_funds`, `property`)
- `status` (optional): Filter by status (`active`, `matured`, `liquidated`)

**Response**:
```json
{
  "investments": [
    {
      "id": "uuid",
      "investment_type": "deposit",
      "investment_name": "Deposito BCA 6%",
      "principal_amount": 50000000,
      "current_value": 53000000,
      "interest_rate": 6.0,
      "investment_term_months": 12,
      "start_date": "2025-01-01",
      "maturity_date": "2026-01-01",
      "bank_name": "Bank BCA",
      "account_number": "1234567890",
      "auto_rollover": false,
      "status": "active",
      "total_returns": 3000000,
      "investment_returns": [
        { "count": 3, "return_amount": { "sum": 3000000 } }
      ]
    }
  ]
}
```

---

### POST /api/investments
Create new investment.

**Request Body**:
```json
{
  "investment_type": "deposit" | "stocks" | "bonds" | "mutual_funds" | "property",
  "investment_name": "Deposito BCA 6%",
  "principal_amount": 50000000,
  "current_value": 50000000 (optional, defaults to principal_amount),
  "interest_rate": 6.0 (optional),
  "investment_term_months": 12 (optional),
  "start_date": "2025-01-01",
  "maturity_date": "2026-01-01" (optional),
  "bank_name": "Bank BCA" (optional),
  "account_number": "1234567890" (optional),
  "auto_rollover": false (optional),
  "notes": "Notes..." (optional),
  "create_expense": true (optional, creates linked expense),
  "transaction_date": "2025-01-01" (required if create_expense=true),
  "payment_method": "transfer" (optional)
}
```

**Auto-Actions**:
- If `create_expense=true`, creates expense transaction (category: `investment`)

---

## 💵 6. Investment Returns API

### POST /api/investments/returns
Record investment return (interest, dividend, capital gain).

**Request Body**:
```json
{
  "investment_id": "uuid",
  "return_date": "2025-02-01",
  "return_amount": 250000,
  "return_type": "interest" | "dividend" | "capital_gain" | "liquidation",
  "payment_method": "transfer" (optional),
  "notes": "Monthly interest" (optional)
}
```

**Auto-Actions**:
1. Creates income transaction (category: `investment_return`)
2. Records return in `investment_returns` table
3. Updates investment `total_returns` and `current_value`
4. If return_type = "liquidation", sets investment status to `liquidated`

**Response**:
```json
{
  "message": "Investment return recorded successfully",
  "return": { /* return record */ },
  "income": { /* created income */ }
}
```

---

### GET /api/investments/returns
Get investment returns history.

**Query Parameters**:
- `investment_id` (optional): Filter by specific investment
- `return_type` (optional): Filter by return type

---

## 🔐 Authentication

All endpoints require authentication via Supabase Auth.

**Headers**:
```
Authorization: Bearer <supabase_access_token>
```

**Get Token**:
```javascript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## ⚠️ Error Responses

**401 Unauthorized**:
```json
{ "error": "Unauthorized" }
```

**400 Bad Request**:
```json
{ "error": "Field 'loan_amount' is required" }
```

**404 Not Found**:
```json
{ "error": "Loan not found" }
```

**500 Internal Server Error**:
```json
{ "error": "Failed to create loan" }
```

---

## 📝 Example Usage

### Create Loan with Auto-Installments
```javascript
const response = await fetch('/api/loans', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    loan_amount: 50000000,
    interest_rate: 12.0,
    loan_term_months: 12,
    loan_date: '2025-01-01',
    first_payment_date: '2025-02-01',
    lender_name: 'Bank BCA',
    purpose: 'Modal kerja'
  })
})

const { loan } = await response.json()
// loan.loan_installments contains 12 auto-generated installments
```

### Pay Installment
```javascript
await fetch('/api/loans/installments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    installment_id: installment.id,
    paid_date: '2025-02-01',
    paid_amount: 4440383,
    payment_method: 'transfer'
  })
})
// Automatically creates expense & updates loan balance
```

### Record Profit Sharing
```javascript
await fetch('/api/investors/profit-sharing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    funding_id: funding.id,
    period_start: '2025-01-01',
    period_end: '2025-01-31',
    business_revenue: 50000000,
    business_expenses: 30000000,
    due_date: '2025-02-05',
    status: 'paid',
    paid_date: '2025-02-05'
  })
})
// Auto-calculates 30% share, creates expense
```

---

## 📦 Database Schema

See `sql/02_financing_investment_schema.sql` for full schema:
- 6 tables: loans, loan_installments, investor_funding, profit_sharing_payments, investments, investment_returns
- 24 RLS policies for user isolation
- 18 indexes for performance
- Auto-update triggers for timestamps

---

## ✅ Setup Checklist

Before using APIs:
- [ ] Execute `sql/02_financing_investment_schema.sql` in Supabase
- [ ] Verify tables created in Table Editor
- [ ] Test RLS policies (queries return only user's data)
- [ ] Configure expense/income categories to include finance types

---

## 🚀 Deployment

**Production**: https://supabase-migration-7y51a4dmb-katalaras-projects.vercel.app  
**Date**: November 23, 2025  
**Status**: ✅ All 6 API endpoints deployed and ready

---

## 📚 Next Steps (Phase 3: UI)

1. Create loan input form with calculator
2. Installment payment interface
3. Investor dashboard with profit sharing
4. Investment tracker with ROI calculation
5. Dashboard widgets for reminders
6. Reports: Amortization schedule, profit sharing history

See `docs/FINANCING_INVESTMENT_LOGIC.md` for full implementation plan.
