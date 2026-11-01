-- Adds a sub-category (次分類) to articles, e.g. 兒童理財 > 故事繪本.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to re-run.

alter table public.articles add column if not exists subcategory text not null default '';
