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
      ).rejects.toThrow(/row-level security/)
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
      const ok = await as('nutri', `insert into goals (participant_id, goal_type, goal_text, goal_value) values ($1, 'weight', 'ל-70', 70) returning id`, [P.p1])
      expect(ok).toHaveLength(1)
      await expect(
        as('nutri', `insert into goals (participant_id, goal_type, goal_text) values ($1, 'other', 'x')`, [P.p2]),
      ).rejects.toThrow(/row-level security/)
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
