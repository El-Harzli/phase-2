-- =============================================================================
-- BSI Properties — Supabase security hardening (RECORD OF WHAT WAS APPLIED)
-- =============================================================================
-- This file is DOCUMENTATION. Everything below has ALREADY been executed on the
-- live Supabase project, so do NOT run the whole file again.
--
--   Task 15  Admin-only authorization (RLS)   ... ALREADY APPLIED — DO NOT RE-RUN
--   Task 16  inquiries lock-down              ... APPLIED
--   Task 17  Storage limits and types         ... APPLIED
--
-- Dashboard settings changed alongside this SQL (not SQL, so not repeated here):
--   * Authentication: "Allow new users to sign up"  -> OFF
--   * Authentication: "Allow anonymous sign-ins"    -> OFF
--
-- The website needs no visitor accounts. Only the admin(s) log in. Anyone who
-- is not listed in private.admin_users is refused by every admin policy.
--
-- NOTE FOR A NEW PROJECT / NEW BUYER: on a fresh Supabase project you would run
-- Task 15 once (Part A and Part B), put your own admin user id(s) in the INSERT,
-- test the admin dashboard, and only then run Part C. Never run Part C before
-- your admin id is in private.admin_users, or you will lock yourself out.
-- =============================================================================


-- =============================================================================
-- TASK 15 — ALREADY APPLIED — DO NOT RE-RUN
-- =============================================================================

-- ---- Part A: private schema, admin list, check function ---------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;   -- needed so RLS policies can call the function

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;      -- no policies on purpose
revoke all on table private.admin_users from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.admin_users where user_id = (select auth.uid())) $$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

insert into private.admin_users (user_id) values
  ('d76944f8-846f-43bc-9f77-3f95a986e9b0'),
  ('d728c618-a40d-4393-a385-5b7caae5e696')
on conflict do nothing;

-- ---- Part B: admin-only policies --------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['agents','amenities','categories','category_amenities','inquiries',
    'neighborhoods','properties','property_amenities','property_images','site_settings','subcategories'] loop
    execute format(
      'create policy "Only admins full access %1$s" on public.%1$I for all to authenticated
       using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

create policy "Only admins read contact events" on public.contact_events
  for select to authenticated using ((select private.is_admin()));

create policy "Only admins manage site images" on storage.objects
  for all to authenticated
  using (bucket_id in ('property-images','agent-avatars','neighborhood-images') and (select private.is_admin()))
  with check (bucket_id in ('property-images','agent-avatars','neighborhood-images') and (select private.is_admin()));

-- ---- Part C: remove the old "any logged-in user" policies --------------------
-- (Executed with IF EXISTS. A first attempt left some policies behind, so it was
-- run again in this form and then verified with the checks further below.)

-- Public tables
drop policy if exists "Admin full access agents" on public.agents;
drop policy if exists "Admin full access amenities" on public.amenities;
drop policy if exists "Admin full access categories" on public.categories;
drop policy if exists "Admin full access category_amenities" on public.category_amenities;
drop policy if exists "Admin full access properties" on public.properties;
drop policy if exists "Admin full access property_amenities" on public.property_amenities;
drop policy if exists "Admin full access property_images" on public.property_images;
drop policy if exists "Admin full access site_settings" on public.site_settings;
drop policy if exists "Admin full access subcategories" on public.subcategories;
drop policy if exists "Authenticated full access to neighborhoods" on public.neighborhoods;
drop policy if exists "admins can read contact events" on public.contact_events;

-- Old policy on inquiries (removed separately)
drop policy if exists "Admin full access to inquiries" on public.inquiries;

-- Storage
drop policy if exists "Admin delete agent avatars" on storage.objects;
drop policy if exists "Admin delete property images" on storage.objects;
drop policy if exists "Admin update agent avatars" on storage.objects;
drop policy if exists "Admin update property images" on storage.objects;
drop policy if exists "Admin write agent avatars" on storage.objects;
drop policy if exists "Admin write property images" on storage.objects;
drop policy if exists "Authenticated can manage neighborhood-images" on storage.objects;

-- ---- Task 15 verification (read-only queries) --------------------------------
-- Expect 2 rows:
--   select user_id from private.admin_users;
-- Expect false / true / false / true:
--   select has_function_privilege('anon','private.is_admin()','execute');
--   select has_function_privilege('authenticated','private.is_admin()','execute');
--   select has_table_privilege('authenticated','private.admin_users','select');
--   select has_schema_privilege('authenticated','private','usage');
-- Expect 0 rows (no wide-open policy left for logged-in users):
--   select tablename, policyname, cmd from pg_policies
--   where schemaname in ('public','storage') and 'authenticated' = any(roles)
--     and (qual = 'true' or with_check = 'true') order by 1, 2;
-- Expect security_definer = true, function_owner = postgres, rolbypassrls = true:
--   select p.prosecdef as security_definer, pg_get_userbyid(p.proowner) as function_owner, r.rolbypassrls
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   join pg_roles r on r.rolname = pg_get_userbyid(p.proowner)
--   where n.nspname = 'private' and p.proname = 'is_admin';
--
-- Result when tested by simulating a logged-in user (rolled back, changed nothing):
--   stranger id : is_admin = false, 0 properties visible, 0 settings visible, 0 rows updatable
--   admin id    : is_admin = true,  22 properties visible, 1 settings row visible, 22 rows updatable
--
-- FIRST recovery if an admin is ever locked out: re-add the missing id
--   insert into private.admin_users (user_id) values ('<admin-user-uuid>') on conflict do nothing;


-- =============================================================================
-- TASK 16 — APPLIED
-- inquiries table: nothing in the app writes to it (the Contact page and the
-- tour request open WhatsApp), so public access was removed. The table and its
-- admin-only policy are kept in case an inquiry form is added later.
-- contact_events was deliberately NOT changed: its INSERT policy already
-- requires a published property, a matching agent and no visitor id, plus a
-- CHECK constraint and foreign keys. No rate limit was added.
-- =============================================================================

drop policy "Public can submit inquiries" on public.inquiries;
revoke all on table public.inquiries from anon, public;

-- Verification (read-only):
--   select policyname, roles, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'inquiries';
--   -> one row: "Only admins full access inquiries"
--   select has_table_privilege('anon', 'public.inquiries', 'insert');
--   -> false


-- =============================================================================
-- TASK 17 — APPLIED
-- Storage: public listing policies removed (public image URLs still work because
-- the buckets are public; the app never lists files), size limits and allowed
-- image types set. SVG and HEIC are intentionally blocked. Existing files were
-- not touched; limits apply to new uploads only.
-- =============================================================================

drop policy if exists "Public read property images" on storage.objects;
drop policy if exists "Public read agent avatars" on storage.objects;
drop policy if exists "Public read access for neighborhood-images" on storage.objects;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
where id in ('property-images','neighborhood-images');

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
where id = 'agent-avatars';

-- Verification (read-only):
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;
--   -> all three public = true; limits 10485760 / 10485760 / 5242880; the five types above
--   select policyname, roles, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
--   -> one row: "Only admins manage site images"
--
-- Known small issue (left for later): uploading an SVG is refused by Supabase with
-- "mime type image/svg+xml is not supported", which the admin screen shows inside
-- the generic "Something went wrong saving this property" message.
