-- Adds the table behind the email-capture popup (collected addresses, shown
-- in the admin's 訂閱名單 tab). Run once in Supabase: SQL Editor -> New
-- query -> paste -> Run. Safe to re-run.

create table if not exists public.leads (
  id text primary key,
  email text not null unique,
  source text not null default '',
  created_at timestamptz not null default now()
);

-- No public read/write policies at all: every request goes through the
-- server (using the service_role key), which validates the email and
-- checks a honeypot field before writing. Visitors' emails are never
-- directly readable via the API, unlike courses/config/articles.
alter table public.leads enable row level security;

grant usage on schema public to service_role;
grant select, insert, delete on public.leads to service_role;
