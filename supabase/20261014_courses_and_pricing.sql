-- ============================================================
-- CLM: Courses and pricing
-- Run in: Supabase Dashboard > SQL Editor (after taking a backup)
-- Safe to run more than once. Additive: no existing data is changed.
--
-- Adds an admin-managed course catalogue with an append-only price
-- history. Applicants may optionally choose a course when applying
-- ("membership only" remains possible). When they do, the course name
-- and the fees in force at that moment are copied onto the application
-- (`course_name`, `price_snapshot`), so later price changes never alter
-- what an applicant was quoted.
--
-- Seeded with the three courses and prices from the CLM "Online
-- Ministry Courses" flyer. Change them in Admin > Courses.
-- ============================================================

begin;

-- Same definition as in 20261013_security_hardening.sql (repeated so
-- this file also works on its own).
create or replace function public.is_full_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- ── Courses ──────────────────────────────────────────────────

create table if not exists public.clm_courses (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null check (length(btrim(name)) between 2 and 200),
  description            text check (description is null or length(description) <= 5000),
  duration               text check (duration is null or length(duration) <= 120),
  study_mode             text not null default 'online'
                         check (study_mode in ('online', 'in_person', 'blended')),
  status                 text not null default 'draft'
                         check (status in ('draft', 'active', 'inactive', 'archived')),
  accepting_applications boolean not null default true,
  sort_order             int not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists clm_courses_name_unique on public.clm_courses (lower(btrim(name)));

drop trigger if exists clm_courses_updated_at on public.clm_courses;
create trigger clm_courses_updated_at
  before update on public.clm_courses
  for each row execute function public.set_updated_at();

alter table public.clm_courses enable row level security;

drop policy if exists "Admins read courses" on public.clm_courses;
create policy "Admins read courses" on public.clm_courses
  for select using (public.is_admin());

drop policy if exists "Full admins manage courses" on public.clm_courses;
create policy "Full admins manage courses" on public.clm_courses
  for all using (public.is_full_admin()) with check (public.is_full_admin());

-- ── Prices (append-only history) ─────────────────────────────

create table if not exists public.clm_course_prices (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid not null references public.clm_courses(id) on delete cascade,
  currency         text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  course_fee       numeric(12, 2) not null check (course_fee >= 0),
  registration_fee numeric(12, 2) not null default 0 check (registration_fee >= 0),
  effective_from   timestamptz not null default now(),
  note             text check (note is null or length(note) <= 1000),
  created_by       uuid,
  created_at       timestamptz not null default now()
);

create index if not exists clm_course_prices_lookup on public.clm_course_prices (course_id, effective_from desc);

create or replace function public.clm_protect_course_prices()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'PRICE_IMMUTABLE: add a new price instead of editing an existing one';
  end if;
  -- Only scheduled (future) prices can be withdrawn, unless the whole course is being deleted.
  if old.effective_from <= now() and exists (select 1 from public.clm_courses where id = old.course_id) then
    raise exception 'PRICE_IMMUTABLE: prices that have taken effect cannot be deleted';
  end if;
  return old;
end;
$$;

drop trigger if exists clm_protect_course_prices on public.clm_course_prices;
create trigger clm_protect_course_prices
  before update or delete on public.clm_course_prices
  for each row execute function public.clm_protect_course_prices();

alter table public.clm_course_prices enable row level security;

drop policy if exists "Admins read prices" on public.clm_course_prices;
create policy "Admins read prices" on public.clm_course_prices
  for select using (public.is_admin());

drop policy if exists "Full admins add prices" on public.clm_course_prices;
create policy "Full admins add prices" on public.clm_course_prices
  for insert with check (public.is_full_admin() and created_by = auth.uid());

drop policy if exists "Full admins remove scheduled prices" on public.clm_course_prices;
create policy "Full admins remove scheduled prices" on public.clm_course_prices
  for delete using (public.is_full_admin());

-- Fees for a course at a point in time (NULL if no price set).
create or replace function public.clm_course_price_quote(p_course_id uuid, p_at timestamptz default now())
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'price_id', p.id,
    'currency', p.currency,
    'course_fee', p.course_fee,
    'registration_fee', p.registration_fee,
    'total', p.course_fee + p.registration_fee,
    'effective_from', p.effective_from,
    'quoted_at', p_at
  )
  from public.clm_course_prices p
  where p.course_id = p_course_id and p.effective_from <= p_at
  order by p.effective_from desc, p.created_at desc
  limit 1
$$;

-- Public list for the website and application form: active courses with current fees.
create or replace function public.get_clm_courses()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id,
           'name', c.name,
           'description', c.description,
           'duration', c.duration,
           'study_mode', c.study_mode,
           'open_for_applications', c.accepting_applications,
           'price', public.clm_course_price_quote(c.id)
         ) order by c.sort_order, c.name), '[]'::jsonb)
  from public.clm_courses c
  where c.status = 'active'
$$;

revoke execute on function public.get_clm_courses() from public;
grant execute on function public.get_clm_courses() to anon, authenticated, service_role;

-- ── Audit (uses the existing audit_logs table) ───────────────

create or replace function public.clm_audit_courses()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor text;
  v_course_id uuid;
  v_name text;
  v_meta jsonb;
begin
  select full_name into v_actor from public.profiles where id = auth.uid();
  if tg_table_name = 'clm_courses' then
    v_course_id := coalesce(new.id, old.id);
    v_name := coalesce(new.name, old.name);
    if tg_op = 'UPDATE' then
      select jsonb_object_agg(n.key, jsonb_build_object('from', to_jsonb(old) -> n.key, 'to', n.value))
        into v_meta
        from jsonb_each(to_jsonb(new)) n
       where n.key <> 'updated_at' and (to_jsonb(old) -> n.key) is distinct from n.value;
      if v_meta is null then return new; end if;
    else
      v_meta := to_jsonb(coalesce(new, old));
    end if;
  else
    v_course_id := coalesce(new.course_id, old.course_id);
    select name into v_name from public.clm_courses where id = v_course_id;
    v_meta := to_jsonb(coalesce(new, old));
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name, metadata)
  values (auth.uid(), coalesce(v_actor, 'system'), tg_table_name || ':' || lower(tg_op),
          'clm_courses', v_course_id, v_name, v_meta);
  return coalesce(new, old);
end;
$$;

drop trigger if exists clm_audit_courses on public.clm_courses;
create trigger clm_audit_courses
  after insert or update or delete on public.clm_courses
  for each row execute function public.clm_audit_courses();

drop trigger if exists clm_audit_course_prices on public.clm_course_prices;
create trigger clm_audit_course_prices
  after insert or delete on public.clm_course_prices
  for each row execute function public.clm_audit_courses();

-- ── Applications: optional course + fee snapshot ─────────────

alter table public.clm_applications add column if not exists course_id uuid references public.clm_courses(id) on delete restrict;
alter table public.clm_applications add column if not exists course_name text;
alter table public.clm_applications add column if not exists price_snapshot jsonb;

-- On insert the database (not the browser) decides the course name and
-- fees; on update they can't be changed.
create or replace function public.clm_application_course()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_course public.clm_courses%rowtype;
begin
  if tg_op = 'INSERT' then
    if new.course_id is null then
      new.course_name := null;
      new.price_snapshot := null;
    else
      select * into v_course from public.clm_courses where id = new.course_id;
      if v_course.id is null or v_course.status <> 'active' or not v_course.accepting_applications then
        raise exception 'COURSE_CLOSED: this course is not accepting applications';
      end if;
      new.course_name := v_course.name;
      new.price_snapshot := public.clm_course_price_quote(v_course.id);
    end if;
  elsif new.course_id is distinct from old.course_id
     or new.course_name is distinct from old.course_name
     or new.price_snapshot is distinct from old.price_snapshot then
    raise exception 'IMMUTABLE_FIELD: the course and fees recorded at submission cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists clm_application_course on public.clm_applications;
create trigger clm_application_course
  before insert or update on public.clm_applications
  for each row execute function public.clm_application_course();

create index if not exists clm_applications_course_idx on public.clm_applications (course_id);

-- ── Seed: courses and prices from the CLM flyer ──────────────

insert into public.clm_courses (name, duration, study_mode, status, sort_order)
select v.name, v.duration, 'online', 'active', v.sort_order
  from (values
    ('Ordination Course', '6 months', 10),
    ('Diploma in Theology', '1 year', 20),
    ('Praise & Worship Course', '5 days', 30)
  ) as v(name, duration, sort_order)
 where not exists (select 1 from public.clm_courses c where lower(btrim(c.name)) = lower(v.name));

insert into public.clm_course_prices (course_id, course_fee, registration_fee, note)
select c.id, v.course_fee, v.registration_fee, 'From the CLM Online Ministry Courses flyer'
  from (values
    ('Ordination Course', 2000.00, 200.00),
    ('Diploma in Theology', 3500.00, 350.00),
    ('Praise & Worship Course', 750.00, 100.00)
  ) as v(name, course_fee, registration_fee)
  join public.clm_courses c on lower(c.name) = lower(v.name)
 where not exists (select 1 from public.clm_course_prices p where p.course_id = c.id);

commit;
