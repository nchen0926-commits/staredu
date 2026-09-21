-- Adds the table behind the 「文章」 feature (write articles in the admin,
-- shown at /articles). Run once in Supabase: SQL Editor -> New query ->
-- paste -> Run. Safe to re-run.

create table if not exists public.articles (
  id text primary key,
  title text not null default '',
  summary text not null default '',
  cover_image text not null default '',
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles enable row level security;

-- Visitors (anon key) may only ever read published articles; drafts stay private.
drop policy if exists "Public read published" on public.articles;
create policy "Public read published" on public.articles for select using (published);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.articles to anon, authenticated, service_role;
grant insert, update, delete on public.articles to service_role;
