-- P0 fix: migrations 0002-0004 enabled RLS + wrote policies but never GRANTed
-- the base table privileges those policies sit on top of. A role is denied
-- access BEFORE RLS is evaluated, so with only REFERENCES/TRIGGER/TRUNCATE the
-- app's `authenticated` reads/writes (and the `service_role` /api/handover path)
-- all failed with "permission denied". RLS is necessary but not sufficient —
-- the role also needs the DML grant; RLS then restricts which rows it sees.
--
-- Grant to `authenticated` (RLS scopes to own/owned rows) and `service_role`
-- (the /api/handover path; service_role bypasses RLS but still needs the grant).
-- `anon` is deliberately NOT granted: this app does no unauthenticated table
-- access (auth is GoTrue; the public handover goes through service_role).

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

-- Future tables created in this schema by the migration role inherit the grant,
-- so later tickets (past_caregiver, rating, ...) don't silently regress.
alter default privileges in schema public
  grant select, insert, update, delete on tables
  to authenticated, service_role;
