-- ============================================================
-- CLM: Editable website content + member management
-- Run in: Supabase Dashboard > SQL Editor (after taking a backup)
-- Safe to run more than once. Additive: no existing data is changed.
--
--  * clm_site_content — one row holding the public website text
--    (announcement, homepage, "why join", contact details, application
--    page texts). Edited by admins in Admin > Website content.
--  * members — notes and ID number columns; admins/reviewers can add
--    members by hand (member number assigned automatically) and remove
--    ones added in error. Members who came from an approved application
--    are kept (set them inactive instead). Changes go to audit_logs.
-- ============================================================

begin;

-- Same definition as in 20261013_security_hardening.sql.
create or replace function public.is_full_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ── Website content ──────────────────────────────────────────

create table if not exists public.clm_site_content (
  id         text primary key default 'site' check (id = 'site'),
  content    jsonb not null default '{}' check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.clm_site_content (id) values ('site') on conflict do nothing;

alter table public.clm_site_content enable row level security;
revoke insert, update, delete, truncate on public.clm_site_content from anon;

drop policy if exists "Anyone reads site content" on public.clm_site_content;
create policy "Anyone reads site content" on public.clm_site_content
  for select using (true);

drop policy if exists "Admins edit site content" on public.clm_site_content;
create policy "Admins edit site content" on public.clm_site_content
  for update using (public.is_full_admin()) with check (public.is_full_admin());

drop trigger if exists clm_site_content_updated_at on public.clm_site_content;
create trigger clm_site_content_updated_at
  before update on public.clm_site_content
  for each row execute function public.set_updated_at();

-- ── Members ──────────────────────────────────────────────────

alter table public.members add column if not exists notes text;
alter table public.members add column if not exists id_number text;

alter table public.members drop constraint if exists members_notes_check;
alter table public.members add constraint members_notes_check check (notes is null or length(notes) <= 5000);

-- Member numbers for hand-added members come from the same sequence as
-- approved applications. SECURITY DEFINER so signed-in admins can use
-- the sequence.
alter function public.generate_member_number() security definer;
alter function public.generate_member_number() set search_path = public;
revoke execute on function public.generate_member_number() from public, anon;
grant execute on function public.generate_member_number() to authenticated, service_role;

alter table public.members alter column member_number set default public.generate_member_number();

-- Replace "admins can do anything" with explicit rules: only members
-- added by hand (no application) can be deleted.
drop policy if exists "Admins manage members" on public.members;
drop policy if exists "Admins read members" on public.members;
drop policy if exists "Admins add members" on public.members;
drop policy if exists "Admins update members" on public.members;
drop policy if exists "Admins remove hand-added members" on public.members;

create policy "Admins read members" on public.members
  for select using (public.is_admin());
create policy "Admins add members" on public.members
  for insert with check (public.is_admin());
create policy "Admins update members" on public.members
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins remove hand-added members" on public.members
  for delete using (public.is_admin() and application_id is null);

-- The original policy read auth.users, which signed-in users aren't
-- allowed to read — so every members query by an admin failed with
-- "permission denied for table users". Use the email in the login token.
drop policy if exists "Member views own record" on public.members;
create policy "Member views own record" on public.members
  for select using (email is not null and lower(email) = lower(auth.jwt() ->> 'email'));

-- ── Audit ────────────────────────────────────────────────────

create or replace function public.clm_audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor text;
  v_meta jsonb;
  v_name text;
begin
  select full_name into v_actor from public.profiles where id = auth.uid();
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('from', to_jsonb(old) -> n.key, 'to', n.value))
      into v_meta
      from jsonb_each(to_jsonb(new)) n
     where n.key <> 'updated_at' and (to_jsonb(old) -> n.key) is distinct from n.value;
    if v_meta is null then return new; end if;
  else
    v_meta := to_jsonb(coalesce(new, old));
  end if;
  v_name := coalesce(to_jsonb(coalesce(new, old)) ->> 'full_name', tg_table_name);

  insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name, metadata)
  values (auth.uid(), coalesce(v_actor, 'system'), tg_table_name || ':' || lower(tg_op), tg_table_name,
          case when tg_table_name = 'members' then (to_jsonb(coalesce(new, old)) ->> 'id')::uuid end,
          v_name, v_meta);
  return coalesce(new, old);
end;
$$;

drop trigger if exists clm_audit_members on public.members;
create trigger clm_audit_members
  after insert or update or delete on public.members
  for each row execute function public.clm_audit_row();

drop trigger if exists clm_audit_site_content on public.clm_site_content;
create trigger clm_audit_site_content
  after update on public.clm_site_content
  for each row execute function public.clm_audit_row();

commit;
