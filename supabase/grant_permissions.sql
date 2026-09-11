-- Fixes "permission denied for table courses" — the tables were created
-- but Postgres didn't grant the API roles access to them. Safe to re-run.
grant usage on schema public to anon, authenticated, service_role;

grant select on public.courses to anon, authenticated, service_role;
grant select on public.site_config to anon, authenticated, service_role;

grant insert, update, delete on public.courses to service_role;
grant insert, update, delete on public.site_config to service_role;
