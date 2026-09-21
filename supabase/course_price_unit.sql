-- Lets each course have its own price unit (月 / 堂 / 期 / ...) instead of a
-- fixed 「/ 月」. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Existing courses keep working: online courses with no unit
-- stored yet still show 「/ 月」 until you change them in the admin.

alter table public.courses add column if not exists price_unit text;
