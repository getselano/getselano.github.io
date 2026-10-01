-- The goal record is legal evidence: under §10.2.4 of the agreement the
-- right to cancel ends once the personal goal is documented. So:
--   * when and how a goal was recorded, and when the participant confirmed
--     it, are written once and never change;
--   * a confirmed goal is never edited. A change creates a new row and the
--     old one points to it (superseded_by), so the chain is kept;
--   * every write goes through write_goal(), from the platform and from the
--     signing form alike: one table, one kind of record.
-- The rules are enforced by a trigger, so they hold whatever the caller.

alter table public.goals
  add column recorded_at      timestamptz,
  add column recorded_by      uuid references public.staff on delete set null,
  add column source           text,
  add column confirmed_at     timestamptz,           -- null = not confirmed yet
  add column confirmation_ip  text,
  add column external_pdf_url text,                  -- the signed goal appendix, from the signing form
  add column superseded_by    uuid references public.goals deferrable initially deferred,
  add column goal_why         text,
  add column external_ref     text unique,           -- signing form: phone|signedAt, so a resend is not a second goal
  add column form_details     jsonb;                 -- signing form extras: nutritionist, call date, confirmed by

-- Existing goals: recorded when they were set, from the platform, not confirmed.
update public.goals set recorded_at = coalesce(set_at::timestamptz, now()), source = 'platform';

alter table public.goals
  alter column recorded_at set not null,
  alter column recorded_at set default now(),
  alter column source set not null,
  alter column source set default 'platform',
  add constraint goals_source_check check (source in ('platform', 'goal_form'));

-- Many rows per participant now; exactly one current (not superseded).
alter table public.goals drop constraint goals_participant_id_key;
create unique index goals_one_current on public.goals (participant_id) where superseded_by is null;
create index on public.goals (participant_id);

-- ─── Write once ──────────────────────────────────────────────────────

create or replace function public.goals_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.confirmed_at is not null then
      raise exception 'a confirmed goal is a record and cannot be deleted' using errcode = '42501';
    end if;
    return old;
  end if;

  if new.participant_id   is distinct from old.participant_id
  or new.recorded_at      is distinct from old.recorded_at
  or new.source           is distinct from old.source
  or new.external_ref     is distinct from old.external_ref
  or new.external_pdf_url is distinct from old.external_pdf_url
  or new.form_details     is distinct from old.form_details then
    raise exception 'how a goal was recorded never changes' using errcode = '42501';
  end if;
  if old.confirmed_at is not null and (new.confirmed_at is distinct from old.confirmed_at or new.confirmation_ip is distinct from old.confirmation_ip) then
    raise exception 'a confirmation is written once' using errcode = '42501';
  end if;
  if old.superseded_by is not null then
    raise exception 'a superseded goal is history and does not change' using errcode = '42501';
  end if;
  if old.confirmed_at is not null and (
       new.goal_type          is distinct from old.goal_type
    or new.goal_text          is distinct from old.goal_text
    or new.goal_value         is distinct from old.goal_value
    or new.goal_why           is distinct from old.goal_why
    or new.start_weight       is distinct from old.start_weight
    or new.start_body_fat     is distinct from old.start_body_fat
    or new.start_measurements is distinct from old.start_measurements
    or new.set_at             is distinct from old.set_at) then
    raise exception 'a confirmed goal is not edited; record a new version' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger goals_guard before update or delete on public.goals
  for each row execute function public.goals_guard();

-- ─── The one way a goal is written ───────────────────────────────────
-- g: goal_type, goal_text, goal_value, goal_why, start_weight,
--    start_body_fat, start_measurements, set_at, achieved.
-- Not confirmed yet → edited in place (platform only).
-- Confirmed, and only `achieved` changed → that one field is updated.
-- Anything else → a new row, and the previous one points to it.
-- With an external_ref already on file → the existing goal, untouched.

create or replace function public.write_goal(
  pid uuid, g jsonb, p_source text, p_recorded_by uuid, p_recorded_at timestamptz,
  p_confirmed_at timestamptz default null, p_pdf text default null,
  p_ref text default null, p_details jsonb default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  cur public.goals;
  new_id uuid;
  v_type text := coalesce(nullif(g->>'goal_type', ''), 'other');
  v_text text := nullif(btrim(g->>'goal_text'), '');
  v_value numeric := nullif(g->>'goal_value', '')::numeric;
  v_why text := nullif(btrim(g->>'goal_why'), '');
  v_w numeric := nullif(g->>'start_weight', '')::numeric;
  v_fat numeric := nullif(g->>'start_body_fat', '')::numeric;
  v_girth text := nullif(btrim(g->>'start_measurements'), '');
  v_set date := nullif(g->>'set_at', '')::date; -- default: kept on edit, the recording day on a new row
  v_achieved boolean := (g->>'achieved')::boolean;
begin
  if v_text is null then raise exception 'goal_text is required' using errcode = '22023'; end if;
  if p_ref is not null then
    select id into new_id from public.goals where external_ref = p_ref;
    if found then return new_id; end if;
  end if;

  select * into cur from public.goals where participant_id = pid and superseded_by is null for update;

  if cur.id is not null and p_source = 'platform' then
    if cur.confirmed_at is null then
      update public.goals set goal_type = v_type, goal_text = v_text, goal_value = v_value, goal_why = v_why,
        start_weight = v_w, start_body_fat = v_fat, start_measurements = v_girth, set_at = coalesce(v_set, cur.set_at), achieved = v_achieved
      where id = cur.id;
      return cur.id;
    end if;
    if  cur.goal_type = v_type and cur.goal_text = v_text
    and cur.goal_value is not distinct from v_value and cur.goal_why is not distinct from v_why
    and cur.start_weight is not distinct from v_w and cur.start_body_fat is not distinct from v_fat
    and cur.start_measurements is not distinct from v_girth then
      update public.goals set achieved = v_achieved where id = cur.id;
      return cur.id;
    end if;
  end if;

  new_id := gen_random_uuid();
  if cur.id is not null then
    update public.goals set superseded_by = new_id where id = cur.id;
  end if;
  insert into public.goals (
    id, participant_id, goal_type, goal_text, goal_value, goal_why, start_weight, start_body_fat,
    start_measurements, set_at, achieved, recorded_at, recorded_by, source, confirmed_at,
    external_pdf_url, external_ref, form_details
  ) values (
    new_id, pid, v_type, v_text, v_value, v_why, v_w, v_fat,
    v_girth, coalesce(v_set, (p_recorded_at at time zone 'Asia/Jerusalem')::date), v_achieved, p_recorded_at, p_recorded_by, p_source, p_confirmed_at,
    p_pdf, p_ref, p_details
  );
  return new_id;
end $$;

-- Staff: the assigned nutritionist, or an admin, from the platform.
create or replace function public.save_goal(pid uuid, g jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or exists (
    select 1 from public.participants p
    where p.id = pid and public.my_staff_id() is not null and p.nutritionist_id = public.my_staff_id()
  )) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public.write_goal(pid, g, 'platform', public.my_staff_id(), now());
end $$;

-- The participant's "this is my goal". Called by the server with the IP it
-- saw, never by the participant directly, so the IP is not self-reported.
create or replace function public.confirm_goal(pid uuid, ip text) returns uuid
language sql security definer set search_path = public as $$
  update public.goals set confirmed_at = now(), confirmation_ip = ip
  where participant_id = pid and superseded_by is null and confirmed_at is null
  returning id
$$;

revoke execute on function public.write_goal(uuid, jsonb, text, uuid, timestamptz, timestamptz, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.confirm_goal(uuid, text) from public, anon, authenticated;
revoke execute on function public.save_goal(uuid, jsonb) from public, anon;
grant execute on function public.write_goal(uuid, jsonb, text, uuid, timestamptz, timestamptz, text, text, jsonb) to service_role;
grant execute on function public.confirm_goal(uuid, text) to service_role;
grant execute on function public.save_goal(uuid, jsonb) to authenticated;

-- Writes only through the functions above. Reading stays as it was.
drop policy goals_staff_write on public.goals;
revoke insert, update, delete on public.goals from authenticated;

-- ─── Every request to /api/goal-intake, accepted or not ──────────────

create table public.goal_intake_log (
  id             bigint generated always as identity primary key,
  received_at    timestamptz not null default now(),
  status         int not null,
  outcome        text not null,   -- recorded | duplicate | bad_secret | bad_json | invalid | error
  ip             text,
  phone          text,
  signed_at      text,
  participant_id uuid,
  goal_id        uuid,
  detail         text,
  payload        jsonb
);
alter table public.goal_intake_log enable row level security;
revoke all on public.goal_intake_log from anon, authenticated;
grant select on public.goal_intake_log to authenticated;
create policy goal_intake_log_admin on public.goal_intake_log for select to authenticated using (public.is_admin());
