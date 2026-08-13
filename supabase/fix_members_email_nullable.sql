-- ============================================================
-- CLM: Make members.email nullable
-- Run in: Supabase Dashboard > SQL Editor
--
-- schema.sql has always defined members.email as nullable
-- (applications don't require an email either), but the live
-- database had drifted and enforced NOT NULL on it. Since many
-- applications are submitted without an email, this blocked
-- approval for any application missing one, failing with:
--   null value in column "email" of relation "members"
--   violates not-null constraint
-- ============================================================

alter table public.members alter column email drop not null;
