-- Adds a category to articles, for the 理財文章 page's category filter
-- (大人理財 / 兒童理財 / 企業永續 / 金融科技). Run once in Supabase:
-- SQL Editor -> New query -> paste -> Run. Safe to re-run.

alter table public.articles add column if not exists category text not null default '';
