-- ============================================================
-- CLM: Admin-editable application form
-- Run in: Supabase Dashboard > SQL Editor (after taking a backup)
-- Requires 20261023_site_content_and_members.sql. Safe to run twice.
-- No existing application data is changed.
--
--  * clm_form_config — the application form's settings as a draft and
--    a published version. Admins edit the draft, preview it, then
--    publish. The public form only ever uses the published version.
--  * clm_applications.custom_answers — answers to questions admins add.
--  * Questions an admin may hide or make optional no longer have to be
--    filled in at the database level. Six answers stay required because
--    the system depends on them: full name, ID number, phone, church
--    name, signature and signature date.
-- ============================================================

begin;

do $$
begin
  if to_regprocedure('public.clm_audit_row()') is null then
    raise exception 'Run 20261023_site_content_and_members.sql before this migration';
  end if;
end $$;

create table if not exists public.clm_form_config (
  id           text primary key default 'form' check (id = 'form'),
  draft        jsonb check (draft is null or jsonb_typeof(draft) = 'object'),
  published    jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at timestamptz,
  published_by uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

insert into public.clm_form_config (id) values ('form') on conflict do nothing;

alter table public.clm_form_config enable row level security;
revoke insert, update, delete, truncate on public.clm_form_config from anon;

drop policy if exists "Admins read form config" on public.clm_form_config;
create policy "Admins read form config" on public.clm_form_config
  for select using (public.is_admin());

drop policy if exists "Full admins edit form config" on public.clm_form_config;
create policy "Full admins edit form config" on public.clm_form_config
  for update using (public.is_full_admin()) with check (public.is_full_admin());

drop trigger if exists clm_form_config_updated_at on public.clm_form_config;
create trigger clm_form_config_updated_at
  before update on public.clm_form_config
  for each row execute function public.set_updated_at();

drop trigger if exists clm_audit_form_config on public.clm_form_config;
create trigger clm_audit_form_config
  after update on public.clm_form_config
  for each row execute function public.clm_audit_row();

-- The public form reads only the published version.
create or replace function public.get_clm_form()
returns jsonb language sql stable security definer set search_path = public as $$
  select published from public.clm_form_config where id = 'form'
$$;

revoke execute on function public.get_clm_form() from public;
grant execute on function public.get_clm_form() to anon, authenticated, service_role;

-- Answers to custom questions.
alter table public.clm_applications add column if not exists custom_answers jsonb not null default '{}';
alter table public.clm_applications drop constraint if exists clm_applications_custom_answers_check;
alter table public.clm_applications add constraint clm_applications_custom_answers_check
  check (jsonb_typeof(custom_answers) = 'object' and pg_column_size(custom_answers) < 100000);

-- Questions that can now be hidden or made optional.
alter table public.clm_applications
  alter column gender drop not null,
  alter column marital_status drop not null,
  alter column physical_address drop not null,
  alter column country drop not null,
  alter column accepted_christ_date drop not null,
  alter column baptized drop not null,
  alter column attends_church drop not null,
  alter column church_denomination drop not null,
  alter column pastor_name drop not null,
  alter column serves_ministry drop not null,
  alter column reason_joining drop not null,
  alter column leadership_experience drop not null,
  alter column spiritual_gifts drop not null,
  alter column growth_areas drop not null,
  alter column called_to_leadership drop not null,
  alter column leadership_vision_explanation drop not null,
  alter column long_term_vision drop not null,
  alter column reference_name drop not null,
  alter column reference_phone drop not null,
  alter column reference_relationship drop not null;

commit;
