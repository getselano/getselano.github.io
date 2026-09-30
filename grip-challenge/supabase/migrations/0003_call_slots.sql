-- A fixed weekly call slot per participant with their mental coach. Drives
-- the morning "your calls today" message, the participant's reminder and
-- the evening "not logged yet" nudge.
alter table public.participants
  add column call_weekday smallint check (call_weekday between 0 and 6), -- 0 = Sunday
  add column call_time    time;

/** The assigned coach (or admin) sets or clears the slot. Participants rows stay admin-write otherwise. */
create or replace function public.set_call_slot(pid uuid, wd smallint, t time) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff_for(pid) then raise exception 'not allowed' using errcode = '42501'; end if;
  if (wd is null) <> (t is null) then raise exception 'day and time go together' using errcode = '22023'; end if;
  update public.participants set call_weekday = wd, call_time = t where id = pid;
end $$;

revoke execute on function public.set_call_slot(uuid, smallint, time) from public, anon;
grant execute on function public.set_call_slot(uuid, smallint, time) to authenticated;
