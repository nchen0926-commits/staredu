-- Adds the table that stores everything editable from the admin's
-- 「網站內容」 tab (logo, nav labels, home/footer text, ...).
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.

create table if not exists public.site_content (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_single_row check (id = 1)
);

alter table public.site_content enable row level security;

drop policy if exists "Public read access" on public.site_content;
create policy "Public read access" on public.site_content for select using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.site_content to anon, authenticated, service_role;
grant insert, update, delete on public.site_content to service_role;

insert into public.site_content (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Public bucket for uploaded logos / banner / course images.
-- (The server also creates it automatically on first upload if missing.)
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;
