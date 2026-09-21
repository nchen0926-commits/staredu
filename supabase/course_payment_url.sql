-- Lets each course have its own 報名 / 付款連結 (e.g. an ECPay payment page).
-- When set, the course's 立即訂閱 / 立即報名 button goes straight to it.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to re-run.

alter table public.courses add column if not exists payment_url text;
