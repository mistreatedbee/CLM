-- ============================================================
-- CLM Digital Application Platform — Database Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        text not null default 'applicant'
                check (role in ('applicant', 'admin', 'reviewer', 'member')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. SHARED TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 3. SEQUENCES & REF NUMBER GENERATORS
-- ============================================================
create sequence if not exists clm_application_seq start 1;
create sequence if not exists clm_member_seq start 1;

create or replace function public.generate_clm_ref()
returns text language plpgsql as $$
begin
  return 'CLM-' || extract(year from now())::text
      || '-' || lpad(nextval('clm_application_seq')::text, 6, '0');
end;
$$;

create or replace function public.generate_member_number()
returns text language plpgsql as $$
begin
  return 'CLM-' || extract(year from now())::text
      || '-' || lpad(nextval('clm_member_seq')::text, 5, '0');
end;
$$;

-- ============================================================
-- 4. CLM APPLICATIONS
-- ============================================================
create table public.clm_applications (
  id uuid primary key default uuid_generate_v4(),
  ref text unique not null default public.generate_clm_ref(),

  -- Personal Information
  full_name          text not null,
  id_number          text not null,
  gender             text not null check (gender in ('Male', 'Female')),
  marital_status     text not null,
  whatsapp           text,
  phone              text not null,
  email              text,
  physical_address   text not null,
  country            text not null default 'South Africa',

  -- Spiritual Background
  accepted_christ_date  text not null,
  baptized              boolean not null,
  attends_church        boolean not null,
  church_name           text not null,
  church_denomination   text not null,
  pastor_name           text not null,
  serves_ministry       boolean not null,
  ministry_detail       text,

  -- Leadership
  reason_joining         text not null,
  leadership_experience  text not null,
  spiritual_gifts        text not null,
  growth_areas           text not null,

  -- Vision
  called_to_leadership          boolean not null,
  leadership_vision_explanation text not null,
  long_term_vision              text not null,

  -- References & Signature
  reference_name         text not null,
  reference_phone        text not null,
  reference_relationship text not null,
  signature              text not null,
  signature_date         date not null,

  -- Application Management
  status         text not null default 'pending'
                   check (status in ('pending', 'under_review', 'approved', 'rejected', 'info_requested')),
  assigned_admin uuid references public.profiles(id) on delete set null,
  admin_notes    text,

  -- Ownership
  applicant_user_id uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clm_applications_updated_at
  before update on public.clm_applications
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 5. APPLICATION NOTES (internal admin notes per application)
-- ============================================================
create table public.application_notes (
  id             uuid primary key default uuid_generate_v4(),
  application_id uuid references public.clm_applications(id) on delete cascade not null,
  author_id      uuid references public.profiles(id) on delete set null,
  author_name    text not null,
  text           text not null,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- 6. MEMBERS (auto-created when application approved)
-- ============================================================
create table public.members (
  id             uuid primary key default uuid_generate_v4(),
  member_number  text unique not null,
  application_id uuid references public.clm_applications(id) on delete set null,

  full_name         text not null,
  phone             text not null,
  email             text,
  church            text not null,
  leadership_level  text not null default 'Trainee'
                      check (leadership_level in ('Trainee', 'Deacon', 'Elder', 'Leader')),
  status            text not null default 'active'
                      check (status in ('active', 'inactive', 'suspended')),

  joined_date date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger members_updated_at
  before update on public.members
  for each row execute procedure public.set_updated_at();

-- Auto-create member record and audit log when application is approved
create or replace function public.handle_application_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_name text;
begin
  -- Get acting admin name
  select full_name into v_actor_name from public.profiles where id = auth.uid();

  if new.status = 'approved' and old.status <> 'approved' then
    -- Create member record
    insert into public.members (
      member_number, application_id, full_name, phone, email, church, joined_date
    ) values (
      public.generate_member_number(),
      new.id,
      new.full_name,
      coalesce(new.whatsapp, new.phone),
      new.email,
      new.church_name,
      current_date
    );

    -- Audit
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

drop trigger if exists on_application_status_change on public.clm_applications;
create trigger on_application_status_change
  after update of status on public.clm_applications
  for each row execute procedure public.handle_application_status_change();

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null default 'info'
               check (type in ('info', 'success', 'warning', 'error')),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8. AUDIT LOGS
-- ============================================================
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references auth.users(id) on delete set null,
  actor_name  text,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  target_name text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.clm_applications  enable row level security;
alter table public.application_notes enable row level security;
alter table public.members           enable row level security;
alter table public.notifications     enable row level security;
alter table public.audit_logs        enable row level security;

-- Helper function: is current user admin or reviewer?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select role in ('admin', 'reviewer') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- --- Profiles ---
create policy "Own profile visible" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Own profile editable" on public.profiles
  for update using (auth.uid() = id);

-- --- Applications ---
create policy "Public can insert application" on public.clm_applications
  for insert with check (true);

create policy "Applicant can view own" on public.clm_applications
  for select using (applicant_user_id = auth.uid() or public.is_admin());

create policy "Admin can view all" on public.clm_applications
  for select using (public.is_admin());

create policy "Admin can update" on public.clm_applications
  for update using (public.is_admin());

-- --- Notes ---
create policy "Admins manage notes" on public.application_notes
  for all using (public.is_admin());

-- --- Members ---
create policy "Admins manage members" on public.members
  for all using (public.is_admin());

create policy "Member views own record" on public.members
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

-- --- Notifications ---
create policy "Own notifications" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

create policy "Mark own as read" on public.notifications
  for update using (user_id = auth.uid());

-- --- Audit Logs ---
create policy "Admins view audit logs" on public.audit_logs
  for select using (public.is_admin());

-- ============================================================
-- SEED: Create first admin user
-- Run AFTER you create your account via the app/Supabase auth
-- Replace the email with your own admin email address.
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- ============================================================
-- MIGRATION: Run these in Supabase SQL Editor if tables already exist
-- ============================================================
-- ALTER TABLE public.clm_applications ADD COLUMN IF NOT EXISTS whatsapp text;
-- ALTER TABLE public.clm_applications ALTER COLUMN email DROP NOT NULL;
-- See remove_course_field.sql to drop the stray `course` column on existing installs.
-- ALTER TABLE public.members ALTER COLUMN email DROP NOT NULL;
