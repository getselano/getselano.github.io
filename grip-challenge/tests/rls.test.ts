// Row level security, checked against a real Postgres with the migration
// applied. Run with scripts/test-rls.sh (it starts a throwaway cluster).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const url = process.env.RLS_DATABASE_URL
const root = join(__dirname, '..')

const U = {
  admin: '00000000-0000-0000-0000-00000000000a',
  coach1: '00000000-0000-0000-0000-0000000000c1',
  coach2: '00000000-0000-0000-0000-0000000000c2',
  nutri: '00000000-0000-0000-0000-0000000000d1',
  p1: '00000000-0000-0000-0000-0000000000e1',
  p2: '00000000-0000-0000-0000-0000000000e2',
  stranger: '00000000-0000-0000-0000-0000000000ff',
}
const S = {
  admin: '10000000-0000-0000-0000-00000000000a',
  coach1: '10000000-0000-0000-0000-0000000000c1',
  coach2: '10000000-0000-0000-0000-0000000000c2',
  nutri: '10000000-0000-0000-0000-0000000000d1',
}
const P = { p1: '20000000-0000-0000-0000-0000000000e1', p2: '20000000-0000-0000-0000-0000000000e2' }

let db: Client

/** Run SQL as a signed-in user (or anon), inside a transaction that is rolled back. */
async function as<T = any>(user: keyof typeof U | 'anon', sql: string, params: unknown[] = []): Promise<T[]> {
  await db.query('begin')
  try {
    if (user === 'anon') {
      await db.query('set local role anon')
    } else {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [U[user]])
      await db.query('set local role authenticated')
    }
    const r = await db.query(sql, params)
    return r.rows as T[]
  } finally {
    await db.query('rollback')
  }
}

describe.skipIf(!url)('row level security', () => {
  beforeAll(async () => {
    db = new Client({ connectionString: url })
    await db.connect()
    await db.query(readFileSync(join(root, 'tests/supabase_shim.sql'), 'utf8'))
    await db.query(readFileSync(join(root, 'supabase/migrations/0001_schema.sql'), 'utf8'))
    await db.query(readFileSync(join(root, 'supabase/migrations/0002_deals.sql'), 'utf8'))
    await db.query(readFileSync(join(root, 'supabase/migrations/0003_call_slots.sql'), 'utf8'))
    await db.query(readFileSync(join(root, 'supabase/migrations/0004_goal_record.sql'), 'utf8'))
    await db.query(`
      insert into auth.users (id, phone) values
        ('${U.admin}', '972500000001'), ('${U.coach1}', '972500000002'), ('${U.coach2}', '972500000003'),
        ('${U.nutri}', '972500000004'), ('${U.p1}', '972500000011'), ('${U.p2}', '972500000012'),
        ('${U.stranger}', '972500000099');
      insert into staff (id, full_name, phone, role) values
        ('${S.admin}', 'אביב', '972500000001', 'admin'),
        ('${S.coach1}', 'מאמן א', '972500000002', 'coach'),
        ('${S.coach2}', 'מאמן ב', '972500000003', 'coach'),
        ('${S.nutri}', 'תזונאית', '972500000004', 'nutritionist');
      insert into participants (id, full_name, phone, start_date, end_date, coach_id, nutritionist_id) values
        ('${P.p1}', 'דנה', '972500000011', il_today() - 5, il_today() + 36, '${S.coach1}', '${S.nutri}'),
        ('${P.p2}', 'יוסי', '972500000012', il_today() - 5, il_today() + 36, '${S.coach2}', null);
      insert into daily_logs (participant_id, log_date, nutrition_logged) values
        ('${P.p1}', il_today() - 1, true), ('${P.p2}', il_today() - 1, true);
      insert into coach_calls (participant_id, staff_id, call_date, summary) values
        ('${P.p1}', '${S.coach1}', il_today() - 2, 'שיחה טובה'),
        ('${P.p2}', '${S.coach2}', il_today() - 2, 'שיחה על יוסי');
      insert into milestones (participant_id, kind) values ('${P.p1}', 'reward_earned'), ('${P.p2}', 'reward_earned');
    `)
  })
  afterAll(async () => {
    await db?.end()
  })

  describe('participant', () => {
    it('sees only their own participant row and logs', async () => {
      expect(await as('p1', 'select id from participants')).toEqual([{ id: P.p1 }])
      const logs = await as('p1', 'select participant_id from daily_logs')
      expect(logs.every((l) => l.participant_id === P.p1)).toBe(true)
      expect(logs).toHaveLength(1)
    })

    it('cannot read another participant by id', async () => {
      expect(await as('p1', 'select * from participants where id = $1', [P.p2])).toEqual([])
      expect(await as('p1', 'select * from daily_logs where participant_id = $1', [P.p2])).toEqual([])
      expect(await as('p1', 'select * from milestones where participant_id = $1', [P.p2])).toEqual([])
    })

    it('does not see coach call notes, even their own', async () => {
      expect(await as('p1', 'select * from coach_calls')).toEqual([])
    })

    it('gets their own call dates through my_call_dates(), without summaries', async () => {
      const rows = await as('p1', `select d::text from my_call_dates() d`)
      expect(rows).toHaveLength(1)
      expect(await as('p2', `select * from my_call_dates()`)).toHaveLength(1)
      expect(await as('coach1', `select * from my_call_dates()`)).toEqual([])
    })

    it('cannot write logs directly, only through mark_today()', async () => {
      await expect(
        as('p1', `insert into daily_logs (participant_id, log_date, nutrition_logged) values ($1, il_today() - 3, true)`, [P.p1]),
      ).rejects.toThrow(/row-level security/)
      const n = await as('p1', `update daily_logs set nutrition_logged = true, workout_confirmed_by = $1 returning id`, [S.coach1])
      expect(n).toEqual([])
    })

    it('mark_today() writes today, for themselves', async () => {
      const [row] = await as('p1', `select * from mark_today('nutrition_logged', true)`)
      expect(row.participant_id).toBe(P.p1)
      expect(row.nutrition_logged).toBe(true)
      const [{ today }] = (await db.query(`select il_today()::text as today`)).rows
      const [check] = await as('p1', `select (select log_date from mark_today('workout_attended', true))::text as d`)
      expect(check.d).toBe(today)
    })

    it('mark_today() rejects unknown fields', async () => {
      await expect(as('p1', `select mark_today('workout_confirmed_by', true)`)).rejects.toThrow(/unknown field/)
    })

    it('cannot change their own participant row or goal', async () => {
      expect(await as('p1', `update participants set price = 1 where id = $1 returning id`, [P.p1])).toEqual([])
      await expect(
        as('p1', `insert into goals (participant_id, goal_type, goal_text) values ($1, 'other', 'x')`, [P.p1]),
      ).rejects.toThrow(/permission denied/)
      await expect(as('p1', `select save_goal($1, '{"goal_text":"x"}')`, [P.p1])).rejects.toThrow(/not allowed/)
      await expect(as('p1', `select confirm_goal($1, '1.2.3.4')`, [P.p1])).rejects.toThrow(/permission denied/)
    })

    it('marks only their own milestone as seen', async () => {
      await db.query('begin')
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [U.p1])
      await db.query('set local role authenticated')
      await db.query(`select mark_milestone_seen('reward_earned')`)
      await db.query('reset role')
      const r = await db.query(`select participant_id, seen_at is not null as seen from milestones order by participant_id`)
      await db.query('rollback')
      expect(r.rows).toEqual([
        { participant_id: P.p1, seen: true },
        { participant_id: P.p2, seen: false },
      ])
    })
  })

  describe('coach', () => {
    it('sees only assigned participants', async () => {
      expect(await as('coach1', 'select id from participants')).toEqual([{ id: P.p1 }])
      expect(await as('coach2', 'select id from participants')).toEqual([{ id: P.p2 }])
      expect(await as('coach1', 'select summary from coach_calls')).toEqual([{ summary: 'שיחה טובה' }])
    })

    it('logs a call for an assigned participant, as themselves only', async () => {
      const ok = await as('coach1', `insert into coach_calls (participant_id, staff_id, call_date) values ($1, $2, il_today()) returning id`, [P.p1, S.coach1])
      expect(ok).toHaveLength(1)
      await expect(
        as('coach1', `insert into coach_calls (participant_id, staff_id, call_date) values ($1, $2, il_today())`, [P.p2, S.coach1]),
      ).rejects.toThrow(/row-level security/)
      await expect(
        as('coach1', `insert into coach_calls (participant_id, staff_id, call_date) values ($1, $2, il_today())`, [P.p1, S.coach2]),
      ).rejects.toThrow(/row-level security/)
    })

    it('confirms attendance for assigned participants only', async () => {
      const ok = await as('coach1', `update daily_logs set workout_confirmed_by = $1 where participant_id = $2 returning id`, [S.coach1, P.p1])
      expect(ok).toHaveLength(1)
      const no = await as('coach1', `update daily_logs set workout_confirmed_by = $1 where participant_id = $2 returning id`, [S.coach1, P.p2])
      expect(no).toEqual([])
    })

    it('sets the weekly call slot for assigned participants only', async () => {
      const ok = await as('coach1', `select set_call_slot($1, 0::smallint, '10:00'::time)`, [P.p1])
      expect(ok).toHaveLength(1)
      await expect(as('coach1', `select set_call_slot($1, 0::smallint, '10:00'::time)`, [P.p2])).rejects.toThrow(/not allowed/)
      await expect(as('p1', `select set_call_slot($1, 0::smallint, '10:00'::time)`, [P.p1])).rejects.toThrow(/not allowed/)
    })

    it('cannot create participants or staff', async () => {
      await expect(
        as('coach1', `insert into participants (full_name, phone, start_date, end_date) values ('x', '972511111111', il_today(), il_today() + 41)`),
      ).rejects.toThrow(/row-level security/)
      await expect(as('coach1', `insert into staff (full_name, phone, role) values ('x', '972511111111', 'admin')`)).rejects.toThrow(
        /row-level security/,
      )
    })
  })

  describe('nutritionist', () => {
    it('sees assigned participants and sets their goal', async () => {
      expect(await as('nutri', 'select id from participants')).toEqual([{ id: P.p1 }])
      const ok = await as('nutri', `select save_goal($1, '{"goal_type":"weight","goal_text":"ל-70","goal_value":"70"}') as id`, [P.p1])
      expect(ok[0].id).toBeTruthy()
      await expect(as('nutri', `select save_goal($1, '{"goal_text":"x"}')`, [P.p2])).rejects.toThrow(/not allowed/)
      await expect(as('coach1', `select save_goal($1, '{"goal_text":"x"}')`, [P.p1])).rejects.toThrow(/not allowed/)
      await expect(
        as('nutri', `insert into goals (participant_id, goal_type, goal_text) values ($1, 'other', 'x')`, [P.p1]),
      ).rejects.toThrow(/permission denied/)
    })
  })

  describe('admin', () => {
    it('sees everything', async () => {
      expect(await as('admin', 'select id from participants order by id')).toHaveLength(2)
      expect(await as('admin', 'select id from coach_calls')).toHaveLength(2)
    })
    it('creates and edits participants manually', async () => {
      const [row] = await as(
        'admin',
        `with ins as (insert into participants (full_name, phone, start_date, end_date) values ('חדש', '972522222222', il_today(), il_today() + 41) returning id)
         select count(*)::int as n from ins`,
      )
      expect(row.n).toBe(1)
      expect(await as('admin', `update participants set price = 2000 where id = $1 returning id`, [P.p2])).toHaveLength(1)
    })
  })

  describe('goal record', () => {
    /** Several statements in one transaction that is rolled back. */
    async function tx(fn: (q: (role: keyof typeof U | 'service', sql: string, params?: unknown[]) => Promise<any[]>) => Promise<void>) {
      await db.query('begin')
      try {
        await fn(async (role, sql, params = []) => {
          await db.query('reset role')
          if (role === 'service') await db.query('set local role service_role')
          else {
            await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [U[role]])
            await db.query('set local role authenticated')
          }
          return (await db.query(sql, params)).rows
        })
      } finally {
        await db.query('rollback')
      }
    }
    const goals = `select goal_text, source, recorded_by, confirmed_at is not null as confirmed, superseded_by is null as current
                   from goals where participant_id = $1 order by recorded_at, current`

    it('edits an unconfirmed goal in place, recording who and when', async () => {
      await tx(async (q) => {
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-70"}')`, [P.p1])
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-69"}')`, [P.p1])
        expect(await q('service', goals, [P.p1])).toEqual([
          { goal_text: 'ל-69', source: 'platform', recorded_by: S.nutri, confirmed: false, current: true },
        ])
      })
    })

    it('a change after confirmation is a new row; the old one points to it', async () => {
      await tx(async (q) => {
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-70","start_weight":"80"}')`, [P.p1])
        expect(await q('service', `select confirm_goal($1, '5.6.7.8') as id`, [P.p1])).toHaveLength(1)
        // achieved alone is an outcome, not a new goal
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-70","start_weight":"80","achieved":"true"}')`, [P.p1])
        expect(await q('service', `select count(*)::int as n from goals where participant_id = $1`, [P.p1])).toEqual([{ n: 1 }])
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-68","start_weight":"80"}')`, [P.p1])
        const rows = await q('service', goals, [P.p1])
        expect(rows.map((r) => [r.goal_text, r.confirmed, r.current])).toEqual([['ל-70', true, false], ['ל-68', false, true]])
        const [old] = await q('service', `select g.confirmation_ip, n.goal_text as next from goals g join goals n on n.id = g.superseded_by where g.participant_id = $1`, [P.p1])
        expect(old).toEqual({ confirmation_ip: '5.6.7.8', next: 'ל-68' })
        // the participant sees only through RLS, and only their own
        expect(await q('p1', `select count(*)::int as n from goals`)).toEqual([{ n: 2 }])
        expect(await q('p2', `select count(*)::int as n from goals`)).toEqual([{ n: 0 }])
      })
    })

    it('the record cannot be rewritten, even by the service role', async () => {
      await tx(async (q) => {
        await q('nutri', `select save_goal($1, '{"goal_text":"ל-70"}')`, [P.p1])
        await q('service', `select confirm_goal($1, '1.1.1.1')`, [P.p1])
        for (const sql of [
          `update goals set goal_text = 'אחר' where participant_id = $1`,
          `update goals set recorded_at = now() - interval '1 day' where participant_id = $1`,
          `update goals set source = 'goal_form' where participant_id = $1`,
          `update goals set confirmed_at = now() + interval '1 hour' where participant_id = $1`,
          `update goals set confirmation_ip = '9.9.9.9' where participant_id = $1`,
          `delete from goals where participant_id = $1`,
        ]) {
          await db.query('savepoint s')
          await expect(q('service', sql, [P.p1]), sql).rejects.toThrow(/never changes|written once|not edited|cannot be deleted/)
          await db.query('rollback to savepoint s')
        }
      })
    })

    it('the signing form: confirmed on arrival, idempotent by external_ref, supersedes', async () => {
      await tx(async (q) => {
        await q('nutri', `select save_goal($1, '{"goal_text":"טיוטה"}')`, [P.p1])
        const call = `select write_goal($1, '{"goal_type":"weight","goal_text":"ל-70","goal_why":"בריאות"}', 'goal_form', null,
                        '2026-10-01T09:00:00Z', '2026-10-01T09:00:00Z', 'https://x/a.pdf', '972500000011|2026-10-01T09:00:00.000Z') as id`
        const [a] = await q('service', call, [P.p1])
        const [b] = await q('service', call, [P.p1])
        expect(b.id).toBe(a.id)
        const rows = await q('service', goals, [P.p1])
        expect(rows.map((r) => [r.goal_text, r.source, r.confirmed, r.current])).toEqual([
          ['טיוטה', 'platform', false, false],
          ['ל-70', 'goal_form', true, true],
        ])
        await expect(q('nutri', `select write_goal($1, '{"goal_text":"x"}', 'goal_form', null, now())`, [P.p1])).rejects.toThrow(/permission denied/)
      })
    })

    it('the intake log is admin-read, service-write', async () => {
      await tx(async (q) => {
        await q('service', `insert into goal_intake_log (status, outcome) values (401, 'bad_secret')`)
        expect(await q('admin', `select outcome from goal_intake_log`)).toEqual([{ outcome: 'bad_secret' }])
        expect(await q('nutri', `select outcome from goal_intake_log`)).toEqual([])
        await expect(q('admin', `insert into goal_intake_log (status, outcome) values (200, 'x')`)).rejects.toThrow(/permission denied/)
      })
    })
  })

  describe('deals', () => {
    it('are admin-only', async () => {
      await db.query(`insert into participant_deals (participant_id, id_number, price) values ('${P.p1}', '012345678', 2500)`)
      expect(await as('admin', 'select id_number from participant_deals')).toHaveLength(1)
      expect(await as('coach1', 'select * from participant_deals')).toEqual([])
      expect(await as('nutri', 'select * from participant_deals')).toEqual([])
      expect(await as('p1', 'select * from participant_deals')).toEqual([])
    })
  })

  describe('everyone else', () => {
    it('a signed-in phone that is not registered sees nothing and cannot mark', async () => {
      expect(await as('stranger', 'select * from participants')).toEqual([])
      expect(await as('stranger', 'select * from staff')).toEqual([])
      await expect(as('stranger', `select mark_today('nutrition_logged', true)`)).rejects.toThrow(/not a participant/)
    })
    it('anon has no table access', async () => {
      await expect(as('anon', 'select * from participants')).rejects.toThrow(/permission denied/)
      await expect(as('anon', `select mark_today('nutrition_logged', true)`)).rejects.toThrow(/permission denied/)
    })
    it('the notifications log is service-only', async () => {
      expect(await as('admin', 'select * from notifications_log')).toEqual([])
    })
  })
})
