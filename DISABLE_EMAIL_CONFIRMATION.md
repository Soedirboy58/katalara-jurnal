# Quick Fix: Disable Email Confirmation

Untuk development, disable email confirmation di Supabase:

## Via Dashboard (RECOMMENDED)
1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Klik **Authentication** → **Providers** → **Email**
4. Scroll ke **"Confirm email"**
5. **Toggle OFF** (uncheck box)
6. Klik **Save**

## Via SQL (Alternative)
Jalankan di SQL Editor:

```sql
-- Auto-confirm all new users
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT now();

-- Update existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
```

## Test Registration
Setelah disable email confirmation:
1. Buka http://localhost:3000/register
2. Isi form step 1 (email & password)
3. Klik "Lanjut" → otomatis login dan lanjut ke step 2
4. Isi form step 2 (data bisnis)
5. Submit → berhasil tanpa error RLS

## Note
- Email confirmation sebaiknya di-enable di production
- Untuk development bisa disable untuk mempercepat testing
