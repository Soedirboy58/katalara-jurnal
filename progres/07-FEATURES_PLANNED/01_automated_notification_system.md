# Sistem Notifikasi Otomatis (Planned)

**Date:** 14 Januari 2026  
**Status:** 📋 Planned / Not Yet Implemented  
**Priority:** 🟡 High (User Request)  

---

## 📊 Status Saat Ini

### ✅ Yang Sudah Ada

1. **UI Settings untuk Alert** ([src/app/dashboard/settings/page.tsx](../../src/app/dashboard/settings/page.tsx))
   - Toggle enable/disable notifications
   - Input threshold:
     - Daily expense limit (Rp)
     - Daily revenue target (Rp)
     - Notification threshold (%)
   - ROI tracking toggle

2. **Database Schema** ([sql/02-migrations/add_financial_controls.sql](../../sql/02-migrations/add_financial_controls.sql))
   - Kolom `business_configurations`:
     - `daily_expense_limit`
     - `daily_revenue_target`
     - `enable_expense_notifications`
     - `notification_threshold`
     - `track_roi`
     - `roi_period`
   - Kolom existing di `business_configurations`:
     - `enable_email_alerts`
     - `enable_stock_alerts`
     - `low_stock_alert_threshold`
     - `expense_alert_threshold`

3. **Due Date Field** (Sudah Ada di Schema)
   - `transactions.due_date` - untuk piutang (sales tempo)
   - `expenses.due_date` - untuk utang (purchase tempo)

### ❌ Yang Belum Ada (Perlu Dibangun)

1. **Sistem Notifikasi Aktif**
   - Tidak ada background job/cron
   - Tidak ada webhook untuk trigger notifikasi
   - Tidak ada tabel `notifications` atau `alerts` untuk menyimpan history notifikasi

2. **Logic Monitoring**
   - Tidak ada logic yang cek apakah expense hari ini sudah mencapai X% dari limit
   - Tidak ada logic yang cek apakah revenue hari ini sudah mencapai target
   - Tidak ada logic yang cek due date yang mendekati (3 hari, 1 hari, overdue)

3. **Delivery Mechanism**
   - Tidak ada email service integration (mis. Resend, SendGrid)
   - Tidak ada push notification (mis. FCM, OneSignal)
   - Tidak ada in-app notification bell/badge

---

## 🎯 Fitur yang Diminta User

### 1. Notifikasi Limit Pengeluaran Harian

**Trigger:**
- User set `daily_expense_limit` = Rp 5.000.000
- User set `notification_threshold` = 80%
- Ketika total expense hari ini mencapai 80% x 5.000.000 = Rp 4.000.000 → kirim alert

**Notification Content:**
```
⚠️ Peringatan Pengeluaran Harian

Total pengeluaran hari ini sudah mencapai Rp 4.000.000 (80% dari limit Rp 5.000.000).

Sisa budget hari ini: Rp 1.000.000
```

**Delivery Channel:**
- In-app notification (bell icon + badge)
- Email (jika `enable_email_alerts` = true)
- Push notification (jika enabled & user granted permission)

---

### 2. Notifikasi Target Pemasukan Harian

**Trigger:**
- User set `daily_revenue_target` = Rp 10.000.000
- Ketika jam 18:00 WIB, cek apakah revenue hari ini sudah >= target
- Jika belum tercapai → kirim motivasi
- Jika tercapai → kirim congratulations

**Notification Content (Belum Tercapai):**
```
💰 Target Pemasukan Harian

Target: Rp 10.000.000
Saat ini: Rp 7.500.000 (75%)

Semangat! Kamu masih punya waktu untuk mengejar target hari ini.
```

**Notification Content (Tercapai):**
```
🎉 Selamat! Target Tercapai

Kamu sudah mencapai target pemasukan hari ini:
Rp 10.500.000 / Rp 10.000.000 (105%)

Kerja bagus! 🚀
```

---

### 3. Notifikasi Jatuh Tempo Piutang (Receivables)

**Trigger:**
- Ada transaksi sales dengan `payment_type = 'tempo'`
- `due_date` mendekati atau sudah lewat
- Kirim reminder:
  - **H-3** (3 hari sebelum jatuh tempo)
  - **H-1** (1 hari sebelum)
  - **H+0** (hari jatuh tempo)
  - **H+1, H+3, H+7** (overdue reminders)

**Notification Content (H-3):**
```
📅 Reminder: Piutang Jatuh Tempo

Invoice: INV-2026-0123
Customer: PT Maju Jaya
Jumlah: Rp 15.000.000
Jatuh Tempo: 17 Januari 2026 (3 hari lagi)

Status: Belum Lunas (Rp 15.000.000)
```

**Notification Content (Overdue H+3):**
```
⚠️ Piutang Terlambat 3 Hari

Invoice: INV-2026-0123
Customer: PT Maju Jaya
Jumlah: Rp 15.000.000
Jatuh Tempo: 14 Januari 2026

Status: OVERDUE - Segera hubungi customer
```

---

### 4. Notifikasi Jatuh Tempo Utang (Payables)

**Trigger:**
- Ada expense dengan `payment_type = 'tempo'`
- `due_date` mendekati atau sudah lewat
- Kirim reminder yang sama seperti piutang (H-3, H-1, H+0, overdue)

**Notification Content (H-1):**
```
💳 Reminder: Utang Jatuh Tempo Besok

Expense: Pembelian Material
Supplier: CV Sumber Makmur
Jumlah: Rp 8.500.000
Jatuh Tempo: 15 Januari 2026 (besok)

Status: Belum Lunas (Rp 8.500.000)
Siapkan pembayaran!
```

---

## 🏗️ Arsitektur Solusi

### Opsi A: Supabase Edge Functions + pg_cron (Recommended)

**Pro:**
- Native Supabase integration
- Serverless (no server to manage)
- PostgreSQL `pg_cron` extension sudah tersedia di Supabase Pro
- Bisa query langsung dari DB

**Cons:**
- Memerlukan Supabase Pro plan untuk `pg_cron` ($25/month)
- Edge Functions cold start (tapi acceptable untuk background jobs)

**Flow:**
```
┌─────────────────────────────────────────────────┐
│       PostgreSQL (Supabase)                     │
│  ┌───────────────────────────────────────────┐  │
│  │  pg_cron Extension                        │  │
│  │  - Schedule: Every 1 hour                 │  │
│  │  - SELECT check_expense_limits()          │  │
│  │  - SELECT check_due_dates()               │  │
│  └───────────────────────────────────────────┘  │
│                      ↓                           │
│  ┌───────────────────────────────────────────┐  │
│  │  Database Functions (PL/pgSQL)            │  │
│  │  1. check_expense_limits()                │  │
│  │     - Aggregate expenses today per user   │  │
│  │     - Compare vs daily_expense_limit      │  │
│  │     - If >= threshold → INSERT notification│  │
│  │                                            │  │
│  │  2. check_revenue_targets()               │  │
│  │     - Run at 18:00 WIB daily             │  │
│  │     - Aggregate revenue today per user    │  │
│  │     - Compare vs daily_revenue_target     │  │
│  │     - INSERT notification                 │  │
│  │                                            │  │
│  │  3. check_due_dates()                     │  │
│  │     - Find transactions/expenses with:    │  │
│  │       due_date IN (today+3, today+1, today)│  │
│  │     - Find overdue (due_date < today)     │  │
│  │     - INSERT notifications                │  │
│  └───────────────────────────────────────────┘  │
│                      ↓                           │
│  ┌───────────────────────────────────────────┐  │
│  │  Table: notifications                     │  │
│  │  - id, user_id, type, title, message      │  │
│  │  - is_read, is_sent, created_at           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│   Supabase Edge Function: send-notifications   │
│   - Triggered by: pg_cron every 5 minutes      │
│   - Query: SELECT * FROM notifications         │
│            WHERE is_sent = false               │
│   - For each notification:                     │
│     * Send email (via Resend API)              │
│     * Send push (via FCM/OneSignal)            │
│     * Mark is_sent = true                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Next.js Frontend                   │
│  - Poll /api/notifications every 30s           │
│  - Show badge count (unread)                   │
│  - Dropdown list when bell icon clicked        │
│  - Mark as read → UPDATE notifications         │
└─────────────────────────────────────────────────┘
```

---

### Opsi B: Vercel Cron Jobs (Simpler, Free Tier Available)

**Pro:**
- Simpler setup (no Supabase Pro needed)
- Vercel Hobby plan sudah support Cron (1 job gratis)
- Code di Next.js API route (familiar)

**Cons:**
- Vercel Hobby hanya 1 cron job (harus gabung semua logic)
- Cold start bisa lebih lama dari Edge Functions

**Flow:**
```
┌─────────────────────────────────────────────────┐
│           Vercel Cron Job                       │
│   File: /api/cron/check-alerts                 │
│   Schedule: 0 * * * * (every hour)             │
│                                                 │
│   Logic:                                        │
│   1. Query Supabase for users with alerts on   │
│   2. For each user:                             │
│      - Check expense vs limit                   │
│      - Check revenue vs target                  │
│      - Check due dates (H-3, H-1, H+0, overdue)│
│   3. INSERT into notifications table            │
│   4. Send email/push for critical alerts        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│       Supabase: notifications table             │
│  (Same as Opsi A)                               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Next.js Frontend                   │
│  (Same as Opsi A)                               │
└─────────────────────────────────────────────────┘
```

**Vercel cron.yaml:**
```yaml
crons:
  - path: /api/cron/check-alerts
    schedule: '0 * * * *' # Every hour
```

---

## 📋 Database Schema (Notifications Table)

```sql
-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Type
  type TEXT NOT NULL, -- 'expense_limit', 'revenue_target', 'receivable_due', 'payable_due', 'stock_alert'
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Priority & Action
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  action_url TEXT, -- Deep link: /dashboard/input-income?id=xxx
  action_label TEXT, -- "Lihat Invoice"
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE, -- Email/push sudah dikirim?
  sent_at TIMESTAMPTZ,
  
  -- Reference (optional - untuk trace back ke transaksi)
  reference_type TEXT, -- 'transaction', 'expense', 'product'
  reference_id UUID,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unsent ON notifications(is_sent) WHERE is_sent = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can insert (system-generated notifications)
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT WITH CHECK (true); -- Service role key will be used

COMMENT ON TABLE notifications IS 'User notifications (in-app, email, push)';
```

---

## 🛠️ Implementation Steps (Phased Approach)

### Phase 1: Foundation (Week 1)

**Tasks:**
- [ ] Create `notifications` table + RLS policies
- [ ] Create database functions:
  - `check_expense_limits()`
  - `check_revenue_targets()`
  - `check_due_dates()`
- [ ] Create API endpoint: `/api/notifications` (GET: list, PATCH: mark as read)
- [ ] Create frontend component: `NotificationBell.tsx` (bell icon + badge + dropdown)

**Deliverable:**
- In-app notification system (no email/push yet)
- Manual trigger via API call

---

### Phase 2: Cron Job (Week 2)

**Tasks:**
- [ ] Setup Vercel Cron or Supabase pg_cron
- [ ] Create API route: `/api/cron/check-alerts`
- [ ] Implement logic:
  - Expense limit check (hourly)
  - Revenue target check (daily at 18:00 WIB)
  - Due date check (daily at 08:00 WIB)
- [ ] Test in staging environment

**Deliverable:**
- Automated notification generation
- Notifications appear in frontend bell

---

### Phase 3: Email Delivery (Week 3)

**Tasks:**
- [ ] Setup Resend.com account (free tier: 3000 emails/month)
- [ ] Create email templates:
  - Expense limit alert
  - Revenue target (achieved/not achieved)
  - Receivable/Payable due reminders
- [ ] Integrate Resend API in Edge Function or Next.js API
- [ ] Respect user preference: `enable_email_alerts`

**Deliverable:**
- Email notifications sent automatically
- Email history logged in `notifications.sent_at`

---

### Phase 4: Push Notifications (Week 4 - Optional)

**Tasks:**
- [ ] Setup Firebase Cloud Messaging (FCM)
- [ ] Add service worker for web push
- [ ] Request permission from user
- [ ] Store FCM token in `user_profiles.fcm_token`
- [ ] Send push via FCM API when notification created

**Deliverable:**
- Browser push notifications
- Works even when tab is closed

---

## 📊 Query Examples (Database Functions)

### Function 1: Check Expense Limits

```sql
CREATE OR REPLACE FUNCTION check_expense_limits()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_today_expense NUMERIC;
  v_limit_threshold NUMERIC;
BEGIN
  FOR v_user IN
    SELECT user_id, daily_expense_limit, notification_threshold, enable_expense_notifications
    FROM business_configurations
    WHERE enable_expense_notifications = TRUE
      AND daily_expense_limit IS NOT NULL
      AND daily_expense_limit > 0
  LOOP
    -- Calculate today's expense
    SELECT COALESCE(SUM(amount), 0) INTO v_today_expense
    FROM expenses
    WHERE user_id = v_user.user_id
      AND expense_date::date = CURRENT_DATE;
    
    -- Calculate threshold (e.g., 80% of limit)
    v_limit_threshold := v_user.daily_expense_limit * (v_user.notification_threshold / 100.0);
    
    -- If expense >= threshold, create notification
    IF v_today_expense >= v_limit_threshold THEN
      -- Check if notification already sent today
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_user.user_id
          AND type = 'expense_limit'
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          priority,
          action_url
        ) VALUES (
          v_user.user_id,
          'expense_limit',
          '⚠️ Peringatan Pengeluaran Harian',
          format(
            'Total pengeluaran hari ini sudah mencapai Rp %s (%s%% dari limit Rp %s). Sisa budget: Rp %s',
            to_char(v_today_expense, 'FM999,999,999'),
            round((v_today_expense / v_user.daily_expense_limit) * 100),
            to_char(v_user.daily_expense_limit, 'FM999,999,999'),
            to_char(v_user.daily_expense_limit - v_today_expense, 'FM999,999,999')
          ),
          CASE
            WHEN v_today_expense >= v_user.daily_expense_limit THEN 'urgent'
            ELSE 'high'
          END,
          '/dashboard/input-expenses'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

### Function 2: Check Due Dates

```sql
CREATE OR REPLACE FUNCTION check_due_dates()
RETURNS void AS $$
DECLARE
  v_transaction RECORD;
  v_days_until_due INTEGER;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Check receivables (transactions with payment_type = 'tempo')
  FOR v_transaction IN
    SELECT 
      t.id,
      t.user_id,
      t.invoice_number,
      t.customer_name,
      t.remaining_amount,
      t.due_date,
      (t.due_date - CURRENT_DATE) AS days_until_due
    FROM transactions t
    WHERE t.payment_type = 'tempo'
      AND t.payment_status != 'paid'
      AND t.due_date IS NOT NULL
      AND (
        -- H-3, H-1, H+0
        (t.due_date - CURRENT_DATE) IN (3, 1, 0)
        OR
        -- Overdue: H+1, H+3, H+7
        (CURRENT_DATE - t.due_date) IN (1, 3, 7)
      )
  LOOP
    v_days_until_due := v_transaction.days_until_due;
    
    -- Build notification content
    IF v_days_until_due >= 0 THEN
      v_notification_title := format('📅 Reminder: Piutang Jatuh Tempo %s',
        CASE v_days_until_due
          WHEN 0 THEN 'Hari Ini'
          WHEN 1 THEN 'Besok'
          ELSE v_days_until_due || ' Hari Lagi'
        END
      );
    ELSE
      v_notification_title := format('⚠️ Piutang Terlambat %s Hari', ABS(v_days_until_due));
    END IF;
    
    v_notification_message := format(
      'Invoice: %s | Customer: %s | Jumlah: Rp %s | Jatuh Tempo: %s',
      v_transaction.invoice_number,
      v_transaction.customer_name,
      to_char(v_transaction.remaining_amount, 'FM999,999,999'),
      to_char(v_transaction.due_date, 'DD Mon YYYY')
    );
    
    -- Insert notification (avoid duplicates)
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority,
      action_url,
      reference_type,
      reference_id
    )
    SELECT 
      v_transaction.user_id,
      'receivable_due',
      v_notification_title,
      v_notification_message,
      CASE
        WHEN v_days_until_due < 0 THEN 'urgent'
        WHEN v_days_until_due <= 1 THEN 'high'
        ELSE 'normal'
      END,
      '/dashboard/input-income?id=' || v_transaction.id,
      'transaction',
      v_transaction.id
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_transaction.user_id
        AND type = 'receivable_due'
        AND reference_id = v_transaction.id
        AND created_at::date = CURRENT_DATE
    );
  END LOOP;
  
  -- Repeat similar logic for payables (expenses table)
  -- ...
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// tests/notifications/expense-limit.test.ts
describe('Expense Limit Notifications', () => {
  it('should create notification when expense reaches 80% of limit', async () => {
    // Setup: User with daily_expense_limit = 5,000,000
    // Create expenses totaling 4,000,000 today
    // Run check_expense_limits()
    // Assert: notification created with correct message
  })
  
  it('should not create duplicate notifications on same day', async () => {
    // Run check_expense_limits() twice
    // Assert: only 1 notification exists
  })
})
```

### Integration Tests

```bash
# Manual test in Supabase SQL Editor
SELECT check_expense_limits();
SELECT * FROM notifications WHERE type = 'expense_limit';
```

### E2E Tests

```typescript
// Playwright test
test('User sees notification bell badge when expense limit reached', async ({ page }) => {
  // Login as test user
  // Navigate to /dashboard/input-expenses
  // Create expense that triggers alert
  // Wait for cron job (or manually trigger)
  // Assert: bell icon shows badge "1"
  // Click bell → dropdown shows notification
})
```

---

## 📈 Monitoring & Analytics

### Metrics to Track

1. **Notification Delivery Rate**
   - Total notifications created
   - Successfully sent (email/push)
   - Failed deliveries (log errors)

2. **User Engagement**
   - Click-through rate (action_url opened)
   - Read rate (is_read = true)
   - Time to read (read_at - created_at)

3. **Alert Accuracy**
   - False positives (user says "not useful")
   - Missed alerts (user manually reported issue later)

4. **Performance**
   - Cron job execution time
   - Database query performance (check_expense_limits duration)

### Dashboard Queries

```sql
-- Daily notification volume by type
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_read = TRUE) as read_count,
  ROUND(COUNT(*) FILTER (WHERE is_read = TRUE)::NUMERIC / COUNT(*) * 100, 1) as read_rate
FROM notifications
WHERE created_at::date = CURRENT_DATE
GROUP BY type;

-- Overdue receivables summary
SELECT 
  COUNT(*) as total_overdue,
  SUM(remaining_amount) as total_amount_overdue
FROM transactions
WHERE payment_type = 'tempo'
  AND payment_status != 'paid'
  AND due_date < CURRENT_DATE;
```

---

## 💰 Cost Estimation

### Supabase Pro (Opsi A)
- **Plan:** $25/month
- **Includes:** pg_cron, 8GB database, 250GB bandwidth
- **Email:** Resend free tier (3000 emails/month)
- **Push:** Firebase free tier (unlimited)

**Total:** ~$25/month

### Vercel Hobby + Supabase Free (Opsi B)
- **Vercel:** Free (1 cron job)
- **Supabase:** Free (500MB database)
- **Email:** Resend free tier
- **Push:** Firebase free tier

**Total:** $0/month (sampai scale up)

---

## 🚀 Rollout Plan

### Beta (First 10 Users)
- Enable notifications for internal testing
- Gather feedback on:
  - Notification frequency (too many? too few?)
  - Content clarity (is message helpful?)
  - Timing (is 18:00 WIB good for revenue check?)

### General Availability
- Announcement: "🔔 Fitur Notifikasi Otomatis Sudah Aktif!"
- Default: All notifications OFF (opt-in)
- Onboarding wizard: Guide user to enable preferred notifications
- Settings page: Clear controls to customize thresholds

---

## 📚 Documentation for Users

### Help Article: "Cara Mengatur Notifikasi Otomatis"

**Limit Pengeluaran Harian:**
1. Buka Dashboard → Settings
2. Masukkan "Limit Pengeluaran Harian" (contoh: Rp 5.000.000)
3. Set "Threshold Notifikasi" (contoh: 80%)
4. Aktifkan "Enable Notifications"
5. Simpan

Kamu akan menerima peringatan saat pengeluaran hari ini mencapai 80% dari limit.

**Jatuh Tempo Piutang/Utang:**
- Notifikasi otomatis akan dikirim:
  - 3 hari sebelum jatuh tempo
  - 1 hari sebelum jatuh tempo
  - Pada hari jatuh tempo
  - 1, 3, dan 7 hari setelah jatuh tempo (overdue)

Pastikan input "Tanggal Jatuh Tempo" saat membuat transaksi Tempo.

---

## 🔗 Related Documents

- [Settings Page](../../src/app/dashboard/settings/page.tsx)
- [Financial Controls Migration](../../sql/02-migrations/add_financial_controls.sql)
- [Business Config Logic](../../sql/domain/core/business_config.logic.sql)
- [Transactions Schema](../../sql/patches/patch_transactions_system_unified.sql)

---

**Next Steps:**
1. User approval on implementation approach (Opsi A vs B)
2. Priority: Which notification type to implement first?
3. Timeline: 1 month for full implementation (all 4 phases)

**Questions for User:**
- Apakah mau pakai Supabase Pro ($25/month) atau stick dengan Free tier?
- Apakah email notification sudah cukup, atau perlu push notification juga?
- Untuk due date reminder, apakah timing H-3, H-1, H+0 sudah cocok?
