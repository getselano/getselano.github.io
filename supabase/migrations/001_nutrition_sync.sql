-- Nutrition sync — columns the client writes that the original schema lacks.
--
-- Run this once against the project (Supabase SQL editor, or psql). Every
-- statement is idempotent, so re-running it is safe.
--
-- Background: meal_logs / blood_tests / custom_foods have existed with RLS
-- since the first schema, but no client code ever wrote to them — all
-- nutrition data lived in localStorage and was lost on a cache clear. Turning
-- that sync on needs three things the tables don't have yet: a stable
-- client-side id for idempotent upserts, the micronutrients, and a way to
-- record a recipe portion that has no gram weight.

-- ── meal_logs ────────────────────────────────────────────────────────
-- client_id: generated on the device when the meal is logged. Lets an upsert
-- be replayed safely (offline queue, double-tap, a second device pushing the
-- same row) without creating duplicates.
alter table public.meal_logs add column if not exists client_id text;
alter table public.meal_logs add column if not exists servings numeric;
alter table public.meal_logs add column if not exists fiber numeric;
alter table public.meal_logs add column if not exists sugar numeric;
alter table public.meal_logs add column if not exists sat_fat numeric;
alter table public.meal_logs add column if not exists sodium numeric;
alter table public.meal_logs add column if not exists from_recipe text;

-- One row per (user, client_id). Partial so historical rows with a null
-- client_id don't collide with each other.
create unique index if not exists meal_logs_user_client_uidx
  on public.meal_logs (user_id, client_id)
  where client_id is not null;

-- ── custom_foods ─────────────────────────────────────────────────────
-- client_id here is the food's local id ('custom_...' / 'off_<barcode>'), so
-- saving the same scanned product twice updates rather than duplicates.
alter table public.custom_foods add column if not exists client_id text;
alter table public.custom_foods add column if not exists fiber numeric;
alter table public.custom_foods add column if not exists sugar numeric;
alter table public.custom_foods add column if not exists sat_fat numeric;
alter table public.custom_foods add column if not exists sodium numeric;

create unique index if not exists custom_foods_user_client_uidx
  on public.custom_foods (user_id, client_id)
  where client_id is not null;

-- ── blood_tests ──────────────────────────────────────────────────────
-- Values already live in a jsonb column; only the dedup key is missing.
alter table public.blood_tests add column if not exists client_id text;

create unique index if not exists blood_tests_user_client_uidx
  on public.blood_tests (user_id, client_id)
  where client_id is not null;
