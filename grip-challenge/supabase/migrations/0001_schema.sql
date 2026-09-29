-- Grip 6-week challenge: schema, row level security, participant RPCs.
-- Spec §6. Computed values (streaks, reward_days, status…) are not stored;
-- they live in lib/calc.ts.
--
-- Phones are stored as digits-only E.164 without '+', e.g. 972501234567,
-- which is how Supabase Auth stores auth.users.phone. That is the link
-- between a signed-in user and a participant / staff row.

create extension if not exists pgcrypto;

-- ─── Tables ──────────────────────────────────────────────────────────

create table public.staff (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text unique not null check (phone ~ '^[0-9]{9,15}$'),
  role       text not null check (role in ('coach', 'nutritionist', 'admin')),
  created_at timestamptz not null default now()
);

create table public.participants (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  phone             text not null unique check (phone ~ '^[0-9]{9,15}$'),
  email             text,
  start_date        date not null,
  end_date          date not null,
  price             integer not null default 2500,
  nutritionist_id   uuid references public.staff on delete set null,
  coach_id          uuid references public.staff on delete set null,
  status            text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  -- Consent to use before/after results in marketing (item 18).
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now(),
  constraint end_is_start_plus_41 check (end_date = start_date + 41)
);
create index on public.participants (coach_id);
create index on public.participants (nutritionist_id);

create table public.goals (
  id                 uuid primary key default gen_random_uuid(),
  participant_id     uuid not null unique references public.participants on delete cascade,
  goal_type          text not null check (goal_type in ('weight', 'body_fat', 'measurements', 'attendance', 'other')),
  goal_text          text not null,
  goal_value         numeric,
  start_weight       numeric,
  start_body_fat     numeric,
  start_measurements text,
  set_at             date,
  achieved           boolean -- filled on day 42
);

create table public.daily_logs (
  id                   uuid primary key default gen_random_uuid(),
  participant_id       uuid not null references public.participants on delete cascade,
  log_date             date not null,
  nutrition_logged     boolean not null default false, -- the only thing the streak counts
  workout_attended     boolean not null default false,
  measurement_logged   boolean not null default false,
  weight               numeric,
  note                 text,
  -- Manual attendance: the participant marks, the coach confirms.
  workout_confirmed_by uuid references public.staff on delete set null,
  workout_confirmed_at timestamptz,
  updated_at           timestamptz not null default now(),
  unique (participant_id, log_date)
);

create table public.coach_calls (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants on delete cascade,
  staff_id       uuid not null references public.staff on delete restrict,
  call_date      date not null,
  summary        text,
  risk_flag      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on public.coach_calls (participant_id, call_date);

create table public.milestones (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants on delete cascade,
  kind           text not null check (kind in ('first_workout', 'week_1', 'halfway', 'ten_workouts', 'reward_earned')),
  earned_at      timestamptz not null default now(),
  -- The win screen opens once; this records that it was shown.
  seen_at        timestamptz,
  unique (participant_id, kind)
);

-- The club's weekly class schedule. Drives "הגעתי לאימון" (shown only on
-- workout days) and "האימון הבא". Replaced by Boostapp when that is live.
create table public.schedule_slots (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  coach_id   uuid references public.staff on delete set null,
  title      text not null default 'אימון',
  active     boolean not null default true
);

-- Outgoing WhatsApp messages, so a retried cron never sends twice.
create table public.notifications_log (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null, -- daily_reminder | weekly_summary | staff_summary
  recipient      text not null, -- participant or staff id
  sent_on        date not null,
  status         text not null,
  detail         text,
  created_at     timestamptz not null default now(),
  unique (kind, recipient, sent_on)
);

-- ─── Who is signed in ────────────────────────────────────────────────
-- security definer so RLS policies can call them without recursing.

create or replace function public.il_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Jerusalem')::date $$;

create or replace function public.auth_phone() returns text
language sql stable security definer set search_path = public, auth as $$
  select regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g')
  from auth.users u where u.id = auth.uid()
$$;

create or replace function public.my_participant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.id from public.participants p
  where p.phone = public.auth_phone() and public.auth_phone() <> ''
$$;

create or replace function public.my_staff_id() returns uuid
language sql stable security definer set search_path = public as $$
  select s.id from public.staff s
  where s.phone = public.auth_phone() and public.auth_phone() <> ''
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where s.id = public.my_staff_id() and s.role = 'admin')
$$;

/** Staff assigned to the participant (as coach or nutritionist), or admin. */
create or replace function public.is_staff_for(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.participants p
    where p.id = pid
      and public.my_staff_id() is not null
      and public.my_staff_id() in (p.coach_id, p.nutritionist_id)
  )
$$;

create or replace function public.can_see_participant(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select pid = public.my_participant_id() or public.is_staff_for(pid)
$$;

-- ─── Row level security ──────────────────────────────────────────────

alter table public.staff             enable row level security;
alter table public.participants      enable row level security;
alter table public.goals             enable row level security;
alter table public.daily_logs        enable row level security;
alter table public.coach_calls       enable row level security;
alter table public.milestones        enable row level security;
alter table public.schedule_slots    enable row level security;
alter table public.notifications_log enable row level security; -- no policies: service role only

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- staff: every signed-in user can read names (a participant sees their team
-- and the coach of the next class). Only admin manages staff.
create policy staff_read on public.staff for select to authenticated
  using (public.my_participant_id() is not null or public.my_staff_id() is not null);
create policy staff_admin on public.staff for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- participants: self, assigned staff, admin. Only admin writes.
create policy participants_read on public.participants for select to authenticated
  using (public.can_see_participant(id));
create policy participants_admin on public.participants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- goals: read as the participant; assigned staff (the nutritionist sets the
-- goal at intake) and admin write.
create policy goals_read on public.goals for select to authenticated
  using (public.can_see_participant(participant_id));
create policy goals_staff_write on public.goals for all to authenticated
  using (public.is_staff_for(participant_id)) with check (public.is_staff_for(participant_id));

-- daily_logs: read as the participant. The participant writes only through
-- mark_today() (today only, own row, cannot confirm attendance). Assigned
-- staff and admin write directly (confirming workouts, manual fixes).
create policy logs_read on public.daily_logs for select to authenticated
  using (public.can_see_participant(participant_id));
create policy logs_staff_write on public.daily_logs for all to authenticated
  using (public.is_staff_for(participant_id)) with check (public.is_staff_for(participant_id));

-- coach_calls: staff only (summaries are internal notes). A staff member
-- logs calls as themselves; admin can do anything.
create policy calls_read on public.coach_calls for select to authenticated
  using (public.is_staff_for(participant_id));
create policy calls_insert on public.coach_calls for insert to authenticated
  with check (public.is_staff_for(participant_id) and (staff_id = public.my_staff_id() or public.is_admin()));
create policy calls_update on public.coach_calls for update to authenticated
  using (staff_id = public.my_staff_id() or public.is_admin())
  with check (public.is_staff_for(participant_id) and (staff_id = public.my_staff_id() or public.is_admin()));
create policy calls_delete on public.coach_calls for delete to authenticated
  using (staff_id = public.my_staff_id() or public.is_admin());

-- milestones: read as the participant. Written by the milestone engine
-- (service role) and marked seen through mark_milestone_seen().
create policy milestones_read on public.milestones for select to authenticated
  using (public.can_see_participant(participant_id));
create policy milestones_admin on public.milestones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- schedule: everyone signed in reads, admin writes.
create policy schedule_read on public.schedule_slots for select to authenticated
  using (public.my_participant_id() is not null or public.my_staff_id() is not null);
create policy schedule_admin on public.schedule_slots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── Participant RPCs ────────────────────────────────────────────────

/**
 * The daily tap. Sets one field on today's row (Jerusalem date) for the
 * signed-in participant, creating the row if needed. Unmarking a workout
 * also drops its confirmation.
 */
create or replace function public.mark_today(field text, value boolean, weight_kg numeric default null)
returns public.daily_logs
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := public.my_participant_id();
  p public.participants;
  today date := public.il_today();
  result public.daily_logs;
begin
  if pid is null then raise exception 'not a participant' using errcode = '42501'; end if;
  select * into p from public.participants where id = pid;
  if p.status <> 'active' or today < p.start_date or today > p.end_date then
    raise exception 'outside the program' using errcode = '22023';
  end if;
  if field not in ('nutrition_logged', 'workout_attended', 'measurement_logged') then
    raise exception 'unknown field %', field using errcode = '22023';
  end if;
  if weight_kg is not null and (weight_kg < 25 or weight_kg > 350) then
    raise exception 'weight out of range' using errcode = '22023';
  end if;

  insert into public.daily_logs (participant_id, log_date) values (pid, today)
  on conflict (participant_id, log_date) do nothing;

  update public.daily_logs d set
    nutrition_logged   = case when field = 'nutrition_logged'   then value else d.nutrition_logged end,
    workout_attended   = case when field = 'workout_attended'   then value else d.workout_attended end,
    measurement_logged = case when field = 'measurement_logged' then value else d.measurement_logged end,
    weight = case when field = 'measurement_logged' and value then coalesce(weight_kg, d.weight)
                  when field = 'measurement_logged' and not value then null
                  else d.weight end,
    workout_confirmed_by = case when field = 'workout_attended' and not value then null else d.workout_confirmed_by end,
    workout_confirmed_at = case when field = 'workout_attended' and not value then null else d.workout_confirmed_at end,
    updated_at = now()
  where d.participant_id = pid and d.log_date = today
  returning * into result;
  return result;
end $$;

create or replace function public.mark_milestone_seen(milestone_kind text) returns void
language sql security definer set search_path = public as $$
  update public.milestones set seen_at = coalesce(seen_at, now())
  where participant_id = public.my_participant_id() and kind = milestone_kind
$$;

/** The participant's own call dates, for the "weekly call" condition. Summaries stay staff-only. */
create or replace function public.my_call_dates() returns setof date
language sql stable security definer set search_path = public as $$
  select call_date from public.coach_calls where participant_id = public.my_participant_id() order by call_date
$$;

revoke execute on function public.my_call_dates() from public, anon;
grant execute on function public.my_call_dates() to authenticated;
revoke execute on function public.mark_today(text, boolean, numeric) from public, anon;
revoke execute on function public.mark_milestone_seen(text) from public, anon;
grant execute on function public.mark_today(text, boolean, numeric) to authenticated;
grant execute on function public.mark_milestone_seen(text) to authenticated;
