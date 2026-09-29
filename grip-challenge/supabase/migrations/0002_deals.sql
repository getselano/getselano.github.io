-- Deal details from the signing system (Apps Script): one row per
-- participant. Holds ID number, health flags and payment terms, so it is
-- admin-only: coaches and nutritionists never see it, nor does the participant.
create table public.participant_deals (
  participant_id  uuid primary key references public.participants on delete cascade,
  id_number       text,
  signed_at       text,          -- as stamped by the signing system (dd/MM/yyyy HH:mm, Israel)
  birth_date      text,
  address         text,
  payment         text,
  price           integer,
  photo_consent   boolean,
  needs_medical   boolean,
  is_minor        boolean,
  parent_name     text,
  parent_id       text,
  parent_phone    text,
  agreement_url   text,
  updated_at      timestamptz not null default now()
);
create index on public.participant_deals (id_number);

alter table public.participant_deals enable row level security;
revoke all on public.participant_deals from anon;
grant select, insert, update, delete on public.participant_deals to authenticated;
grant all on public.participant_deals to service_role;

create policy deals_admin on public.participant_deals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
