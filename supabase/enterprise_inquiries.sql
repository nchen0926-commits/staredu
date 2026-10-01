-- Adds the table behind the 企業永續合作 contact form. Same lightweight
-- pattern as leads.sql — no new database, no new infrastructure, just one
-- more narrow table. Run once in Supabase: SQL Editor -> New query ->
-- paste -> Run. Safe to re-run.

create table if not exists public.enterprise_inquiries (
  id text primary key,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  participants text not null,
  cooperation_types jsonb not null default '[]'::jsonb,
  topic_needs text not null default '',
  preferred_timing text not null default '',
  other_notes text not null default '',
  created_at timestamptz not null default now()
);

-- Same lockdown as leads: no public read policy at all, only the server
-- (service_role) ever touches this table.
alter table public.enterprise_inquiries enable row level security;

grant usage on schema public to service_role;
grant select, insert, delete on public.enterprise_inquiries to service_role;
