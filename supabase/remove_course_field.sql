-- ============================================================
-- CLM: Remove stray `course` field
-- Run in: Supabase Dashboard > SQL Editor
--
-- CLM is a membership application, not a course/programme
-- enrolment system. A `course` column was mistakenly carried
-- over from a training-institute template.
--
-- Existing course values are preserved before the column is
-- dropped:
--   - clm_applications.course is appended to admin_notes as a
--     "Course: <value>" line (visible to admins, no longer
--     parsed into a structured field).
--   - members.course is kept, just renamed to course_archived,
--     since the members table has no notes field to fold it into.
-- ============================================================

update public.clm_applications
set admin_notes = trim(both E'\n' from
  coalesce(admin_notes, '')
  || case when admin_notes is not null and admin_notes <> '' then E'\n' else '' end
  || 'Course: ' || course
)
where course is not null;

alter table public.clm_applications drop column if exists course;

alter table public.members rename column course to course_archived;
comment on column public.members.course_archived is
  'Archived: CLM does not offer courses. No longer read by the app; preserved from the removed course column.';

-- Re-sync the approval trigger: whatsapp_migration.sql redefined this
-- function to read new.course and write members.course, both of which
-- are gone as of the changes above. Without this, approving an
-- application fails because the trigger references dropped/renamed
-- columns.
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
