-- ============================================================
-- CLM: Security hardening
-- Run in: Supabase Dashboard > SQL Editor (after taking a backup)
-- Safe to run more than once. Changes no application data.
--
-- Fixes:
--  1. Privilege escalation: the "Own profile editable" policy let any
--     signed-in user UPDATE their own profiles row — including the
--     `role` column — so anyone who could sign up could make
--     themselves 'admin' and read every application. Users can now
--     only edit their own name/phone/avatar; only an admin (or the
--     service role / SQL editor) can change roles.
--  2. Public submissions could set their own status (e.g. 'approved'),
--     assigned admin or admin notes. Inserts must now start as
--     'pending' with no admin fields.
--  3. WhatsApp templates/logs/settings were writable by ANY signed-in
--     user (auth.role() = 'authenticated'); now admins/reviewers only.
-- ============================================================

begin;

-- 1. Profiles: column-level update rights + role-change guard ----------

-- SECURITY DEFINER so policies on `profiles` can use it without
-- recursing into their own RLS.
create or replace function public.is_full_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

drop policy if exists "Own profile editable" on public.profiles;
create policy "Own profile editable" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null  -- service role / SQL editor have no auth.uid()
     and not public.is_full_admin() then
    raise exception 'Only an admin can change user roles';
  end if;
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Roles are changed by an admin in the SQL editor (see bottom of file);
-- no dashboard path writes the role column.
drop policy if exists "Admins update profiles" on public.profiles;

-- 2. Applications: public inserts start as pending ---------------------

drop policy if exists "Public can insert application" on public.clm_applications;
create policy "Public can insert application" on public.clm_applications
  for insert with check (
    status = 'pending'
    and assigned_admin is null
    and admin_notes is null
    and (applicant_user_id is null or applicant_user_id = auth.uid())
  );

-- 3. WhatsApp: admins/reviewers only -----------------------------------

do $$
begin
  if to_regclass('public.whatsapp_templates') is not null then
    drop policy if exists "Auth users read templates"   on public.whatsapp_templates;
    drop policy if exists "Auth users insert templates" on public.whatsapp_templates;
    drop policy if exists "Auth users update templates" on public.whatsapp_templates;
    drop policy if exists "Auth users delete templates" on public.whatsapp_templates;
    drop policy if exists "Admins manage templates"     on public.whatsapp_templates;
    create policy "Admins manage templates" on public.whatsapp_templates
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if to_regclass('public.whatsapp_logs') is not null then
    drop policy if exists "Auth users read logs"   on public.whatsapp_logs;
    drop policy if exists "Auth users insert logs" on public.whatsapp_logs;
    drop policy if exists "Admins read logs"       on public.whatsapp_logs;
    drop policy if exists "Admins insert logs"     on public.whatsapp_logs;
    create policy "Admins read logs" on public.whatsapp_logs
      for select using (public.is_admin());
    create policy "Admins insert logs" on public.whatsapp_logs
      for insert with check (public.is_admin());
  end if;

  if to_regclass('public.whatsapp_settings') is not null then
    drop policy if exists "Auth users read settings"   on public.whatsapp_settings;
    drop policy if exists "Auth users update settings" on public.whatsapp_settings;
    drop policy if exists "Admins read settings"       on public.whatsapp_settings;
    drop policy if exists "Admins update settings"     on public.whatsapp_settings;
    create policy "Admins read settings" on public.whatsapp_settings
      for select using (public.is_admin());
    create policy "Admins update settings" on public.whatsapp_settings
      for update using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

commit;

-- After running: check nobody already escalated themselves.
--   select id, email, role, updated_at from public.profiles
--    where role in ('admin', 'reviewer') order by updated_at desc;
-- Promote / demote (SQL editor runs as the database owner):
--   update public.profiles set role = 'admin' where email = '...';
--   update public.profiles set role = 'applicant' where email = '...';
--
-- Also recommended: Authentication > Providers > Email — turn OFF
-- "Allow new users to sign up" unless applicants need accounts.
