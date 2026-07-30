-- ============================================================
-- CLM: Remove stray `course` field
-- Run in: Supabase Dashboard > SQL Editor
--
-- CLM is a membership application, not a course/programme
-- enrolment system. A `course` column was mistakenly carried
-- over from a training-institute template. This is additive/
-- non-destructive to every other column — it only drops the
-- `course` column (and any legacy `Course:` line inside
-- admin_notes free text is simply no longer read by the app).
-- ============================================================

alter table public.clm_applications drop column if exists course;
alter table public.members           drop column if exists course;
