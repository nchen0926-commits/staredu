-- Articles upgrade: scheduled publishing, view counts, and SEO/GEO fields
-- (custom URL name, search summary, author). Run once in Supabase:
-- SQL Editor -> New query -> paste -> Run. Safe to re-run.

alter table public.articles add column if not exists slug text;
alter table public.articles add column if not exists seo_description text not null default '';
alter table public.articles add column if not exists author text not null default '';
alter table public.articles add column if not exists view_count integer not null default 0;

-- Each custom URL name may be used by one article only (blank is allowed many times).
create unique index if not exists articles_slug_key
  on public.articles (slug) where slug is not null and slug <> '';

-- Visitors can only read articles that are published AND whose publish time has arrived
-- (that is what makes scheduled publishing work without any background job).
drop policy if exists "Public read published" on public.articles;
create policy "Public read published" on public.articles
  for select using (published and published_at <= now());

-- Atomic view counter. Only the server (service role) may call it.
create or replace function public.increment_article_views(article_id text)
returns void
language sql
as $$
  update public.articles
  set view_count = view_count + 1
  where id = article_id and published and published_at <= now();
$$;

revoke all on function public.increment_article_views(text) from public, anon, authenticated;
grant execute on function public.increment_article_views(text) to service_role;
