-- ============================================================
-- CLM WhatsApp Communication Module — Migration
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Message templates
create table if not exists public.whatsapp_templates (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  trigger_type text        not null check (trigger_type in ('submission', 'approved', 'rejected', 'info_requested', 'manual')),
  body         text        not null,
  active       boolean     not null default true,
  is_default   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Communication log
create table if not exists public.whatsapp_logs (
  id               uuid        primary key default gen_random_uuid(),
  application_id   uuid        references public.clm_applications(id) on delete cascade,
  applicant_name   text        not null,
  whatsapp_number  text        not null,
  template_id      uuid        references public.whatsapp_templates(id),
  template_name    text,
  message_body     text        not null,
  trigger_type     text        not null,
  sent_by          text        not null default 'admin',
  sent_at          timestamptz not null default now()
);

-- Global settings (singleton — id is always 1)
create table if not exists public.whatsapp_settings (
  id                       integer primary key default 1,
  auto_send_on_submission  boolean not null default false,
  auto_send_on_approval    boolean not null default false,
  auto_send_on_rejection   boolean not null default false,
  constraint whatsapp_settings_singleton check (id = 1)
);

insert into public.whatsapp_settings (id) values (1) on conflict do nothing;

-- RLS
alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_logs      enable row level security;
alter table public.whatsapp_settings  enable row level security;

drop policy if exists "Auth users read templates"   on public.whatsapp_templates;
drop policy if exists "Auth users insert templates"  on public.whatsapp_templates;
drop policy if exists "Auth users update templates"  on public.whatsapp_templates;
drop policy if exists "Auth users delete templates"  on public.whatsapp_templates;
drop policy if exists "Auth users read logs"         on public.whatsapp_logs;
drop policy if exists "Auth users insert logs"       on public.whatsapp_logs;
drop policy if exists "Auth users read settings"     on public.whatsapp_settings;
drop policy if exists "Auth users update settings"   on public.whatsapp_settings;

create policy "Auth users read templates"   on public.whatsapp_templates for select using (auth.role() = 'authenticated');
create policy "Auth users insert templates" on public.whatsapp_templates for insert with check (auth.role() = 'authenticated');
create policy "Auth users update templates" on public.whatsapp_templates for update using (auth.role() = 'authenticated');
create policy "Auth users delete templates" on public.whatsapp_templates for delete using (auth.role() = 'authenticated');

create policy "Auth users read logs"   on public.whatsapp_logs for select using (auth.role() = 'authenticated');
create policy "Auth users insert logs" on public.whatsapp_logs for insert with check (auth.role() = 'authenticated');

create policy "Auth users read settings"   on public.whatsapp_settings for select using (auth.role() = 'authenticated');
create policy "Auth users update settings" on public.whatsapp_settings for update using (auth.role() = 'authenticated');

-- Updated_at trigger for templates
create or replace function public.set_whatsapp_template_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_whatsapp_template_updated_at on public.whatsapp_templates;
create trigger set_whatsapp_template_updated_at
  before update on public.whatsapp_templates
  for each row execute procedure public.set_whatsapp_template_updated_at();

-- Default templates
-- ============================================================
-- MEMBERS: add course column + update trigger
-- ============================================================
alter table public.members add column if not exists course text;

-- Backfill course from linked applications for existing members
update public.members m
set course = a.course
from public.clm_applications a
where m.application_id = a.id
  and m.course is null;

-- Update the approval trigger to copy course from the application
create or replace function public.handle_application_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_name text;
begin
  select full_name into v_actor_name from public.profiles where id = auth.uid();

  if new.status = 'approved' and old.status <> 'approved' then
    insert into public.members (
      member_number, application_id, full_name, phone, email, church, course, joined_date
    ) values (
      public.generate_member_number(),
      new.id,
      new.full_name,
      coalesce(new.whatsapp, new.phone),
      new.email,
      new.church_name,
      new.course,
      current_date
    );
    insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name)
    values (auth.uid(), v_actor_name, 'approved', 'clm_applications', new.id, new.full_name);
  end if;

  if new.status = 'rejected' and old.status <> 'rejected' then
    insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name)
    values (auth.uid(), v_actor_name, 'rejected', 'clm_applications', new.id, new.full_name);
  end if;

  if new.status = 'info_requested' and old.status <> 'info_requested' then
    insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name)
    values (auth.uid(), v_actor_name, 'info_requested', 'clm_applications', new.id, new.full_name);
  end if;

  return new;
end;
$$;

-- ============================================================
-- DEFAULT TEMPLATES
-- ============================================================
insert into public.whatsapp_templates (name, trigger_type, body, is_default) values
(
  'Application Received',
  'submission',
  'Hello {{ApplicantName}},

Thank you for applying for the *{{CourseName}}* at Christian Leadership Movement (CLM).

Your application has been received successfully and is currently being reviewed by our admissions team.

We will be in touch with you shortly once the review process has been completed.

God bless,
CLM Admissions Team',
  true
),
(
  'Application Approved',
  'approved',
  'Congratulations {{ApplicantName}}!

Your application for the *{{CourseName}}* has been approved.

We will contact you shortly with registration details and the next steps.

Welcome to the CLM family!

Blessings,
CLM Admissions Team',
  true
),
(
  'Application Rejected',
  'rejected',
  'Hello {{ApplicantName}},

Thank you for your interest in Christian Leadership Movement (CLM).

After careful consideration, we regret to inform you that your application for the *{{CourseName}}* was not successful at this time.

We appreciate your interest and sincerely encourage you to apply again in the future.

Blessings,
CLM Admissions Team',
  true
),
(
  'More Information Required',
  'info_requested',
  'Hello {{ApplicantName}},

Thank you for your application to CLM for the *{{CourseName}}*.

Our admissions team is reviewing your application and requires some additional information before we can proceed.

Please reply to this message and we will guide you on what is needed.

God bless,
CLM Admissions Team',
  true
),
(
  'General Follow-up',
  'manual',
  'Hello {{ApplicantName}},

Thank you for applying to the *{{CourseName}}* at Christian Leadership Movement (CLM).

We have successfully received your application and it is currently being reviewed.

We will contact you once the review process has been completed.

God bless,
CLM Admissions Team',
  true
);
