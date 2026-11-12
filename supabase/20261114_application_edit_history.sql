-- ============================================================
-- CLM: History of admin edits to submitted applications
-- Run in: Supabase Dashboard > SQL Editor. Safe to run twice.
-- No existing data is changed.
--
-- Admins can correct what an applicant filled in (Admin >
-- Applications > open one > Edit application). Every change is
-- written to audit_logs with the old and new value, so nothing is
-- lost. Status changes are already logged separately and are not
-- repeated here.
-- ============================================================

begin;

create or replace function public.clm_audit_application_edit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor text;
  v_meta jsonb;
begin
  select jsonb_object_agg(n.key, jsonb_build_object('from', to_jsonb(old) -> n.key, 'to', n.value))
    into v_meta
    from jsonb_each(to_jsonb(new)) n
   where n.key not in ('status', 'assigned_admin', 'admin_notes', 'email', 'updated_at',
                       'applicant_user_id', 'created_at', 'id', 'ref')
     and (to_jsonb(old) -> n.key) is distinct from n.value;
  if v_meta is null then return new; end if;

  select full_name into v_actor from public.profiles where id = auth.uid();
  insert into public.audit_logs (actor_id, actor_name, action, target_type, target_id, target_name, metadata)
  values (auth.uid(), coalesce(v_actor, 'system'), 'edited', 'clm_applications', new.id, new.full_name, v_meta);
  return new;
end;
$$;

drop trigger if exists clm_audit_application_edit on public.clm_applications;
create trigger clm_audit_application_edit
  after update on public.clm_applications
  for each row execute function public.clm_audit_application_edit();

commit;
