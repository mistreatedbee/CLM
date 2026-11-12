-- ============================================================
-- CLM: Document uploads + declaration on the application form
-- Run in: Supabase Dashboard > SQL Editor (after taking a backup)
-- Requires 20261112_application_form_config.sql. Safe to run twice.
-- No existing data is changed.
--
--  * Private storage bucket for applicants' documents (PDF/JPG/PNG,
--    max 5 MB). Only the website's server uploads files; admins and
--    reviewers can view them; only full admins can delete them.
--  * clm_applications.documents — the uploaded files for each
--    application; declaration_accepted — whether the applicant
--    accepted the declaration (when the admin has switched it on).
-- Which documents are asked for, and the declaration text, are set in
-- Admin > Application form.
-- ============================================================

begin;

do $$
begin
  if to_regclass('public.clm_form_config') is null then
    raise exception 'Run 20261112_application_form_config.sql before this migration';
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clm-application-documents', 'clm-application-documents', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "CLM admins view application documents" on storage.objects;
create policy "CLM admins view application documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'clm-application-documents' and public.is_admin());

drop policy if exists "CLM full admins delete application documents" on storage.objects;
create policy "CLM full admins delete application documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'clm-application-documents' and public.is_full_admin());

alter table public.clm_applications add column if not exists documents jsonb not null default '[]';
alter table public.clm_applications drop constraint if exists clm_applications_documents_check;
alter table public.clm_applications add constraint clm_applications_documents_check
  check (jsonb_typeof(documents) = 'array' and jsonb_array_length(documents) <= 20);

alter table public.clm_applications add column if not exists declaration_accepted boolean;

commit;
