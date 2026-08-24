import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { dataService } from '../services/dataService'
import { todayKey } from '../utils/date'
import { supabase, supabaseEnabled } from '../lib/supabase'
import {
  upsertProfile, markOnboarded, newClientId,
  pushMealLog, deleteMealLog, fetchMealLogs,
  pushCustomFood, deleteCustomFood, fetchCustomFoods,
  pushBloodTest, fetchBloodTests,
} from '../services/supabaseSync'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const ROLES = ['member','coach','admin']

const initialState = {
  role: 'member',           // active view: member | coach | admin
  onboarded: false,
  profile: {
    name: '', age: 30, sex: 'male', heightCm: 175, weightKg: 75,
    activity: 'moderate', experience: 'בינוני',
    goals: [], goalKey: 'recomp', targetPeriodWeeks: 12,
    dietKey: 'balanced',
    constraints: '',
    oneRMs: {}, // { squat: 100, bench: 80, deadlift: 140, ohp: 55, ... }
  },
  plan: null,               // active workout plan
  plansArchive: [],         // [{id, name, programId, startedAt, archivedAt, weeksCompleted, totalWeeks, completionPct, snapshot}]
  workoutLogs: [],          // {date, sessionName, exercises:[{id,name,sets:[{w,r,rpe}]}] }
  workoutLogsTrash: [],     // soft-deleted workouts — restorable from History → recycle bin
  waterLog: {},             // { 'YYYY-MM-DD': cupsCount } — 250ml per cup
  mealLogs: {},             // { [dateKey]: [{foodId, grams}] }
  moodCheckins: [],         // {date, mood, energy, stress, sleepHours, note}
  habits: [
    { id:'water',   name:'שתיית 3 ליטר מים', icon:'', streak:0, doneToday:false },
    { id:'sleep',   name:'8 שעות שינה',      icon:'', streak:0, doneToday:false },
    { id:'steps',   name:'10,000 צעדים',     icon:'', streak:0, doneToday:false },
    { id:'stretch', name:'10 דק׳ מתיחות',    icon:'', streak:0, doneToday:false },
  ],
  bloodTests: [],           // {date, values:{markerId: value}}
  wearable: null,           // last synced snapshot
  customFoods: [],          // user-created foods {id, name, cat, kcal, p, c, f, barcode?}
  rehabPrograms: [],        // active rehab {id, area, startedAt, painLog:[], sessions:[]}
  measurements: [],         // {date, weight, bodyFat?, waist?, chest?, hips?, arms?, thighs?, note?}
  progressPhotos: [],       // {id, date, dataUrl, angle: 'front'|'side'|'back', note?}
  personalRecords: [],      // {id, exercise, weight, reps, date, note?}
  goals: [],                // {id, title, kind, metric, deadlineWeeks, why, barriers, weeklyActions, checkins, status}
  personalTrainingRequests: [], // {id, name, phone, email, age, level, goals, injuries, timePref, whyNow, submittedAt, status}
  benchmarkPRs: {},         // { [benchmarkId]: {time, rounds?, completedAt, history: [{time, rounds?, date}]} }
  // Bodybuilding module
  bbRoutines: [],           // user-saved routines (custom or copied from system)
  bbSavedPrograms: [],      // program ids the user has saved to their library
  bbActiveProgram: null,    // currently active program (like 'plan' but for bodybuilding)
  exercisePRs: {},          // { [exerciseId]: { heaviestWeight: {weight,reps,date}, best1RM: {kg,date}, bestSetVolume: {weight,reps,total,date}, bestSessionVolume: {total,date}, history: [] } }
  workoutSettings: {        // per-user preferences
    rpeEnabled: false,
    plateCalculatorEnabled: true,
    warmupCalculatorEnabled: true,
    defaultRestSeconds: 90,
    keepAwake: true,
    leaderboardOptIn: false,
  },
  lastActiveDate: todayKey(),
  reminders: {                // meal + workout push reminders
    enabled: false,           // user must opt-in (browser permission)
    meals: {
      breakfast: { at: '08:00', enabled: true },
      lunch:     { at: '13:00', enabled: true },
      dinner:    { at: '19:00', enabled: true },
      snack:     { at: '16:00', enabled: false },
    },
    workouts: {               // dow → time (Sunday=0)
      0: { at: '18:00', enabled: false },
      1: { at: '18:00', enabled: true },
      2: { at: '18:00', enabled: false },
      3: { at: '18:00', enabled: true },
      4: { at: '18:00', enabled: false },
      5: { at: '18:00', enabled: true },
      6: { at: '10:00', enabled: false },
    },
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':        return { ...state, ...action.payload }
    case 'SET_ROLE':       return { ...state, role: action.role }
    case 'SET_ONBOARDED':  return { ...state, onboarded: true, profile: { ...state.profile, ...action.profile } }
    case 'UPDATE_PROFILE': return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'UPDATE_REMINDERS': return { ...state, reminders: { ...(state.reminders || {}), ...action.patch } }
    case 'SET_1RM':        return { ...state, profile: { ...state.profile, oneRMs: { ...(state.profile.oneRMs || {}), [action.lift]: action.value } } }
    case 'SET_PLAN': {
      const now = new Date().toISOString()
      const newPlan = { ...action.plan, id: action.plan?.id || 'plan_' + Date.now(), startedAt: action.plan?.startedAt || action.plan?.createdAt || now, difficultyByWeek: action.plan?.difficultyByWeek || {} }
      // Archive the existing plan (if any) with a snapshot
      let archive = state.plansArchive || []
      if (state.plan) {
        const logsCount = (state.workoutLogs || []).filter(l => l.planId === state.plan.id || l.planId === state.plan.programId).length
        const expectedTotal = (state.plan.days || 3) * (state.plan.weeks || 12)
        const pct = expectedTotal > 0 ? Math.round((logsCount / expectedTotal) * 100) : 0
        archive = [
          {
            id: state.plan.id || state.plan.programId,
            name: state.plan.name,
            programId: state.plan.programId,
            style: state.plan.style,
            startedAt: state.plan.startedAt,
            archivedAt: now,
            weeksScheduled: state.plan.weeks,
            sessionsDone: logsCount,
            sessionsExpected: expectedTotal,
            completionPct: pct,
            snapshot: state.plan,
          },
          ...archive,
        ].slice(0, 20)  // keep last 20 plans
      }
      return { ...state, plan: newPlan, plansArchive: archive }
    }
    case 'RESUME_PLAN': {
      // Bring an archived plan back to active - archive current if exists
      const target = (state.plansArchive || []).find(p => p.id === action.id)
      if (!target?.snapshot) return state
      let archive = state.plansArchive.filter(p => p.id !== action.id)
      const now = new Date().toISOString()
      if (state.plan) {
        const logsCount = (state.workoutLogs || []).filter(l => l.planId === state.plan.id || l.planId === state.plan.programId).length
        const expectedTotal = (state.plan.days || 3) * (state.plan.weeks || 12)
        const pct = expectedTotal > 0 ? Math.round((logsCount / expectedTotal) * 100) : 0
        archive = [{
          id: state.plan.id || state.plan.programId, name: state.plan.name, programId: state.plan.programId,
          style: state.plan.style, startedAt: state.plan.startedAt, archivedAt: now,
          weeksScheduled: state.plan.weeks, sessionsDone: logsCount, sessionsExpected: expectedTotal,
          completionPct: pct, snapshot: state.plan,
        }, ...archive].slice(0, 20)
      }
      return { ...state, plan: { ...target.snapshot, startedAt: now }, plansArchive: archive }
    }
    case 'REMOVE_ARCHIVED_PLAN':
      return { ...state, plansArchive: (state.plansArchive || []).filter(p => p.id !== action.id) }
    case 'CLOSE_PLAN': {
      // Archive the current plan (with completion snapshot) and clear plan.
      if (!state.plan) return state
      const now = new Date().toISOString()
      const logsCount = (state.workoutLogs || []).filter(l => l.planId === state.plan.id || l.planId === state.plan.programId).length
      const expectedTotal = (state.plan.days || 3) * (state.plan.weeks || 12)
      const pct = expectedTotal > 0 ? Math.round((logsCount / expectedTotal) * 100) : 0
      const archived = {
        id: state.plan.id || state.plan.programId,
        name: state.plan.name,
        programId: state.plan.programId,
        style: state.plan.style,
        startedAt: state.plan.startedAt,
        archivedAt: now,
        weeksScheduled: state.plan.weeks,
        sessionsDone: logsCount,
        sessionsExpected: expectedTotal,
        completionPct: pct,
        snapshot: state.plan,
      }
      return {
        ...state,
        plan: null,
        plansArchive: [archived, ...(state.plansArchive || [])].slice(0, 20),
      }
    }
    case 'LOG_WORKOUT': {
      // Auto-tag with planId and planWeek so weekly-progression util can group by week
      let log = action.log
      if (state.plan) {
        const start = new Date(state.plan.startedAt || state.plan.createdAt || Date.now()).getTime()
        const daysSince = Math.floor((Date.now() - start) / 86400000)
        const planWeek = Math.max(1, Math.min(state.plan.weeks || 12, Math.floor(daysSince / 7) + 1))
        log = { ...log, planId: state.plan.id || state.plan.programId, planWeek }
      }
      // Stamp with an id so delete/restore can target it uniquely
      if (!log.id) log = { ...log, id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
      return { ...state, workoutLogs: [log, ...state.workoutLogs] }
    }
    case 'DELETE_WORKOUT_LOG': {
      const idx = (state.workoutLogs || []).findIndex(l => (l.id || l.date) === action.key)
      if (idx < 0) return state
      const log = state.workoutLogs[idx]
      const nextLogs = state.workoutLogs.filter((_, i) => i !== idx)
      // Soft-delete → keep in trash for restore
      const nextTrash = [{ ...log, deletedAt: new Date().toISOString() }, ...(state.workoutLogsTrash || [])].slice(0, 100)
      return { ...state, workoutLogs: nextLogs, workoutLogsTrash: nextTrash }
    }
    case 'DELETE_WORKOUT_LOGS_BY_PLAN': {
      const isMatch = (l) => (l.planId || null) === (action.planId || null)
      const toTrash = (state.workoutLogs || []).filter(isMatch).map(l => ({ ...l, deletedAt: new Date().toISOString() }))
      const nextLogs = (state.workoutLogs || []).filter(l => !isMatch(l))
      const nextTrash = [...toTrash, ...(state.workoutLogsTrash || [])].slice(0, 200)
      return { ...state, workoutLogs: nextLogs, workoutLogsTrash: nextTrash }
    }
    case 'CLEAR_ALL_WORKOUT_LOGS': {
      const toTrash = (state.workoutLogs || []).map(l => ({ ...l, deletedAt: new Date().toISOString() }))
      const nextTrash = [...toTrash, ...(state.workoutLogsTrash || [])].slice(0, 500)
      return { ...state, workoutLogs: [], workoutLogsTrash: nextTrash }
    }
    case 'RESTORE_WORKOUT_LOG': {
      const idx = (state.workoutLogsTrash || []).findIndex(l => (l.id || l.date) === action.key)
      if (idx < 0) return state
      const log = state.workoutLogsTrash[idx]
      const { deletedAt, ...restored } = log
      return {
        ...state,
        workoutLogsTrash: state.workoutLogsTrash.filter((_, i) => i !== idx),
        workoutLogs: [restored, ...(state.workoutLogs || [])],
      }
    }
    case 'PURGE_TRASH': {
      return { ...state, workoutLogsTrash: [] }
    }
    case 'WATER_ADD': {
      const day = action.day
      const cur = (state.waterLog || {})[day] || 0
      return { ...state, waterLog: { ...(state.waterLog || {}), [day]: Math.max(0, Math.min(30, cur + action.delta)) } }
    }
    case 'WATER_RESET_DAY': {
      const next = { ...(state.waterLog || {}) }
      delete next[action.day]
      return { ...state, waterLog: next }
    }
    case 'SET_WEEK_DIFFICULTY': {
      if (!state.plan) return state
      return { ...state, plan: { ...state.plan, difficultyByWeek: { ...(state.plan.difficultyByWeek || {}), [action.week]: action.difficulty } } }
    }
    case 'START_NEW_CYCLE': {
      if (!state.plan) return state
      const now = new Date().toISOString()
      return { ...state, plan: { ...state.plan, startedAt: now, cycle: (state.plan.cycle || 1) + 1, difficultyByWeek: {} } }
    }
    case 'MERGE_CLOUD_NUTRITION': {
      // Union by clientId, local first. Never drops a local-only entry — the
      // device may hold rows written while offline or before sync existed.
      const mealLogs = { ...state.mealLogs }
      for (const [date, cloudItems] of Object.entries(action.mealLogs || {})) {
        const local = mealLogs[date] || []
        const seen = new Set(local.map(m => m.clientId).filter(Boolean))
        const additions = cloudItems.filter(m => m.clientId && !seen.has(m.clientId))
        if (additions.length) mealLogs[date] = [...local, ...additions]
        else if (!mealLogs[date]) mealLogs[date] = local
      }

      const foodIds = new Set(state.customFoods.map(f => f.id))
      const customFoods = [
        ...state.customFoods,
        ...(action.customFoods || []).filter(f => !foodIds.has(f.id)),
      ]

      const bloodKey = (b) => b.clientId || `${b.date}`
      const bloodSeen = new Set(state.bloodTests.map(bloodKey))
      const bloodTests = [
        ...state.bloodTests,
        ...(action.bloodTests || []).filter(b => !bloodSeen.has(bloodKey(b))),
      ].sort((a, b) => String(b.date).localeCompare(String(a.date)))

      return { ...state, mealLogs, customFoods, bloodTests }
    }
    case 'LOG_MEAL': {
      const key = action.date || todayKey()
      const cur = state.mealLogs[key] || []
      return { ...state, mealLogs: { ...state.mealLogs, [key]: [...cur, action.item] } }
    }
    case 'REMOVE_MEAL': {
      const key = action.date || todayKey()
      const cur = state.mealLogs[key] || []
      return { ...state, mealLogs: { ...state.mealLogs, [key]: cur.filter((_,i)=>i!==action.index) } }
    }
    case 'ADD_CHECKIN':    return { ...state, moodCheckins: [action.checkin, ...state.moodCheckins] }
    case 'TOGGLE_HABIT': {
      const habits = state.habits.map(h => h.id === action.id ? { ...h, doneToday: !h.doneToday, streak: !h.doneToday ? h.streak+1 : Math.max(0,h.streak-1) } : h)
      return { ...state, habits }
    }
    case 'ADD_HABIT':      return { ...state, habits: [...state.habits, action.habit] }
    case 'REMOVE_HABIT':   return { ...state, habits: state.habits.filter(h=>h.id!==action.id) }
    case 'ADD_BLOOD':      return { ...state, bloodTests: [action.test, ...state.bloodTests] }
    case 'SET_WEARABLE':   return { ...state, wearable: action.data }
    case 'ADD_CUSTOM_FOOD':return { ...state, customFoods: [action.food, ...state.customFoods] }
    case 'REMOVE_CUSTOM_FOOD': return { ...state, customFoods: state.customFoods.filter(f => f.id !== action.id) }
    case 'START_REHAB':    return { ...state, rehabPrograms: [action.program, ...state.rehabPrograms.filter(p => p.area !== action.program.area)] }
    case 'LOG_REHAB_PAIN': return { ...state, rehabPrograms: state.rehabPrograms.map(p => p.id === action.programId ? { ...p, painLog: [{ date: new Date().toISOString(), pain: action.pain, note: action.note }, ...p.painLog] } : p) }
    case 'LOG_REHAB_SESSION': return { ...state, rehabPrograms: state.rehabPrograms.map(p => p.id === action.programId ? { ...p, sessions: [{ date: new Date().toISOString(), week: action.week }, ...p.sessions] } : p) }
    case 'STOP_REHAB':     return { ...state, rehabPrograms: state.rehabPrograms.filter(p => p.id !== action.id) }
    case 'ADD_MEASUREMENT': return { ...state, measurements: [action.m, ...state.measurements] }
    case 'REMOVE_MEASUREMENT': return { ...state, measurements: state.measurements.filter((_,i) => i !== action.index) }
    case 'ADD_PROGRESS_PHOTO': return { ...state, progressPhotos: [action.photo, ...state.progressPhotos] }
    case 'REMOVE_PROGRESS_PHOTO': return { ...state, progressPhotos: state.progressPhotos.filter(p => p.id !== action.id) }
    case 'ADD_PR':         return { ...state, personalRecords: [action.pr, ...state.personalRecords] }
    case 'REMOVE_PR':      return { ...state, personalRecords: state.personalRecords.filter(p => p.id !== action.id) }
    case 'SET_GOAL':       return { ...state, goals: [action.goal, ...(state.goals || []).filter(g => g.id !== action.goal.id && g.status === 'active').map(g => ({ ...g, status: 'archived' })), ...(state.goals || []).filter(g => g.status !== 'active')] }
    case 'REMOVE_GOAL':    return { ...state, goals: (state.goals || []).filter(g => g.id !== action.id) }
    case 'CHECKIN_GOAL':   return { ...state, goals: (state.goals || []).map(g => g.id === action.goalId ? { ...g, checkins: [{ date: new Date().toISOString(), value: action.value, note: action.note }, ...(g.checkins || [])] } : g) }
    case 'ADD_TRAINING_REQUEST': return { ...state, personalTrainingRequests: [action.request, ...(state.personalTrainingRequests || [])] }
    case 'UPDATE_TRAINING_REQUEST': return { ...state, personalTrainingRequests: (state.personalTrainingRequests || []).map(r => r.id === action.id ? { ...r, ...action.patch } : r) }
    // ─── Bodybuilding module ───────────────────────────────
    case 'BB_SAVE_ROUTINE': {
      const routines = state.bbRoutines || []
      const existing = routines.findIndex(r => r.id === action.routine.id)
      const next = existing >= 0
        ? routines.map((r, i) => i === existing ? action.routine : r)
        : [action.routine, ...routines]
      return { ...state, bbRoutines: next }
    }
    case 'BB_DELETE_ROUTINE':
      return { ...state, bbRoutines: (state.bbRoutines || []).filter(r => r.id !== action.id) }
    case 'BB_SAVE_PROGRAM': {
      const saved = state.bbSavedPrograms || []
      if (saved.includes(action.programId)) return state
      return { ...state, bbSavedPrograms: [action.programId, ...saved] }
    }
    case 'BB_UNSAVE_PROGRAM':
      return { ...state, bbSavedPrograms: (state.bbSavedPrograms || []).filter(id => id !== action.programId) }
    case 'BB_SET_ACTIVE_PROGRAM':
      return { ...state, bbActiveProgram: action.program }
    case 'BB_UPDATE_EXERCISE_PR': {
      // action.result: { exerciseId, weight, reps, sessionVolume, date, workoutId }
      const { exerciseId, weight, reps, sessionVolume, date, workoutId } = action.result
      const prev = state.exercisePRs?.[exerciseId] || {}
      const setVolume = weight * reps
      // Epley formula for 1RM estimation
      const est1RM = reps === 1 ? weight : weight * (1 + reps / 30)

      const heaviestWeight = !prev.heaviestWeight || weight > (prev.heaviestWeight.weight || 0)
        ? { weight, reps, date, workoutId }
        : prev.heaviestWeight
      const best1RM = !prev.best1RM || est1RM > (prev.best1RM.kg || 0)
        ? { kg: Math.round(est1RM * 10) / 10, weight, reps, date }
        : prev.best1RM
      const bestSetVolume = !prev.bestSetVolume || setVolume > (prev.bestSetVolume.total || 0)
        ? { weight, reps, total: setVolume, date }
        : prev.bestSetVolume
      const bestSessionVolume = sessionVolume != null && (!prev.bestSessionVolume || sessionVolume > (prev.bestSessionVolume.total || 0))
        ? { total: sessionVolume, date, workoutId }
        : prev.bestSessionVolume

      const history = [{ weight, reps, setVolume, date }, ...(prev.history || [])].slice(0, 100)
      return {
        ...state,
        exercisePRs: {
          ...(state.exercisePRs || {}),
          [exerciseId]: { heaviestWeight, best1RM, bestSetVolume, bestSessionVolume, history },
        },
      }
    }
    case 'BB_UPDATE_SETTINGS':
      return { ...state, workoutSettings: { ...(state.workoutSettings || {}), ...action.patch } }
    case 'SAVE_BENCHMARK_PR': {
      const { benchmarkId, time, rounds, completedAt } = action.pr
      const prev = state.benchmarkPRs?.[benchmarkId]
      // Keep the best score. For "for_time" lower is better; for "amrap" higher rounds is better.
      const isForTimePR = rounds == null
      const isBetter = !prev
        || (isForTimePR && time < (prev.time ?? Infinity))
        || (!isForTimePR && rounds > (prev.rounds ?? 0))
      const history = [...(prev?.history || []), { time, rounds, date: completedAt }]
      const nextEntry = isBetter
        ? { time, rounds, completedAt, history }
        : { ...prev, history }
      return { ...state, benchmarkPRs: { ...(state.benchmarkPRs || {}), [benchmarkId]: nextEntry } }
    }
    case 'RESET':          return initialState
    default: return state
  }
}

function init() {
  // sync init from local cache - async backend hydration happens in useEffect
  const saved = (typeof window !== 'undefined')
    ? JSON.parse(localStorage.getItem('hfos:state') || 'null')
    : null
  return saved ? { ...initialState, ...saved } : initialState
}

// Resolve the signed-in user then run a sync call. Fire-and-forget by design:
// nutrition writes must never block the UI or fail a local dispatch, and the
// local state remains the source of truth when the backend is unreachable.
async function withUser(fn) {
  if (!supabaseEnabled) return
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) await fn(user.id)
  } catch { /* offline / not signed in — local state already updated */ }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  // persist on change (skip first render to avoid overwriting a fresh hydrate)
  const firstRender = React.useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    dataService.setState(state)
  }, [state])

  // Latest state, read by the async backfill below — which must not re-run on
  // every state change just to see the current rows.
  const stateRef = React.useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Pull nutrition from the cloud once per session, then push anything local
  // the cloud is missing. Runs after auth resolves; a device that logged meals
  // offline (or before sync existed) uploads them on its next signed-in load.
  const hydratedRef = React.useRef(false)
  useEffect(() => {
    if (!supabaseEnabled || hydratedRef.current) return
    let cancelled = false

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id || cancelled) return
      hydratedRef.current = true

      const [mealLogs, customFoods, bloodTests] = await Promise.all([
        fetchMealLogs(user.id),
        fetchCustomFoods(user.id),
        fetchBloodTests(user.id),
      ])
      if (cancelled) return
      // A null result means the fetch failed (or the migration is missing) —
      // merging it would look like "the cloud is empty" and change nothing,
      // but skipping keeps the backfill below from running against bad data.
      if (mealLogs == null && customFoods == null && bloodTests == null) return

      dispatch({
        type: 'MERGE_CLOUD_NUTRITION',
        mealLogs: mealLogs || {},
        customFoods: customFoods || [],
        bloodTests: bloodTests || [],
      })

      // Backfill: push local rows the cloud doesn't have yet.
      const cloudMealIds = new Set(
        Object.values(mealLogs || {}).flat().map(m => m.clientId).filter(Boolean)
      )
      for (const [date, items] of Object.entries(stateRef.current.mealLogs || {})) {
        for (const item of items) {
          if (!item.clientId || cloudMealIds.has(item.clientId)) continue
          pushMealLog(user.id, date, item).catch(() => {})
        }
      }
      const cloudFoodIds = new Set((customFoods || []).map(f => f.id))
      for (const food of stateRef.current.customFoods || []) {
        if (!cloudFoodIds.has(food.id)) pushCustomFood(user.id, food).catch(() => {})
      }
      const cloudBloodIds = new Set((bloodTests || []).map(b => b.clientId).filter(Boolean))
      for (const test of stateRef.current.bloodTests || []) {
        if (test.clientId && !cloudBloodIds.has(test.clientId)) {
          pushBloodTest(user.id, test).catch(() => {})
        }
      }
    }

    run().catch(() => { /* stay on local state */ })
    return () => { cancelled = true }
  }, [])

  const api = {
    state,
    setRole: (role) => dispatch({ type:'SET_ROLE', role }),
    completeOnboarding: async (profile) => {
      dispatch({ type:'SET_ONBOARDED', profile })
      // Push profile to cloud so it's available on other devices
      if (supabaseEnabled) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) markOnboarded(user.id, profile).catch(() => {})
      }
    },
    updateReminders: (patch) => dispatch({ type: 'UPDATE_REMINDERS', patch }),
    updateProfile: async (patch) => {
      dispatch({ type:'UPDATE_PROFILE', patch })
      if (supabaseEnabled) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) upsertProfile(user.id, patch).catch(() => {})
      }
    },
    set1RM: (lift, value) => dispatch({ type:'SET_1RM', lift, value: +value || 0 }),
    setPlan: (plan) => dispatch({ type:'SET_PLAN', plan }),
    resumePlan: (id) => dispatch({ type:'RESUME_PLAN', id }),
    removeArchivedPlan: (id) => dispatch({ type:'REMOVE_ARCHIVED_PLAN', id }),
    closePlan: () => dispatch({ type:'CLOSE_PLAN' }),
    setWeekDifficulty: (week, difficulty) => dispatch({ type:'SET_WEEK_DIFFICULTY', week, difficulty }),
    startNewCycle: () => dispatch({ type:'START_NEW_CYCLE' }),
    logWorkout: (log) => dispatch({ type:'LOG_WORKOUT', log }),
    deleteWorkoutLog: (key) => dispatch({ type:'DELETE_WORKOUT_LOG', key }),
    deleteWorkoutLogsByPlan: (planId) => dispatch({ type:'DELETE_WORKOUT_LOGS_BY_PLAN', planId }),
    clearAllWorkoutLogs: () => dispatch({ type:'CLEAR_ALL_WORKOUT_LOGS' }),
    restoreWorkoutLog: (key) => dispatch({ type:'RESTORE_WORKOUT_LOG', key }),
    purgeWorkoutTrash: () => dispatch({ type:'PURGE_TRASH' }),
    addWaterCup: (day, delta = 1) => dispatch({ type:'WATER_ADD', day, delta }),
    resetWaterDay: (day) => dispatch({ type:'WATER_RESET_DAY', day }),
    logMeal: (item, date) => {
      // clientId is minted here so the local row and the cloud row share a key
      const stamped = { ...item, clientId: item.clientId || newClientId() }
      const day = date || todayKey()
      dispatch({ type:'LOG_MEAL', item: stamped, date })
      withUser(uid => pushMealLog(uid, day, stamped))
    },
    removeMeal: (index, date) => {
      const day = date || todayKey()
      const victim = (state.mealLogs[day] || [])[index]
      dispatch({ type:'REMOVE_MEAL', index, date })
      if (victim?.clientId) withUser(uid => deleteMealLog(uid, victim.clientId))
    },
    addCheckin: (checkin) => dispatch({ type:'ADD_CHECKIN', checkin }),
    toggleHabit: (id) => dispatch({ type:'TOGGLE_HABIT', id }),
    addHabit: (habit) => dispatch({ type:'ADD_HABIT', habit }),
    removeHabit: (id) => dispatch({ type:'REMOVE_HABIT', id }),
    addBlood: (test) => {
      const stamped = { ...test, clientId: test.clientId || newClientId() }
      dispatch({ type:'ADD_BLOOD', test: stamped })
      withUser(uid => pushBloodTest(uid, stamped))
    },
    setWearable: (data) => dispatch({ type:'SET_WEARABLE', data }),
    addCustomFood: (food) => {
      dispatch({ type:'ADD_CUSTOM_FOOD', food })
      withUser(uid => pushCustomFood(uid, food))
    },
    removeCustomFood: (id) => {
      dispatch({ type:'REMOVE_CUSTOM_FOOD', id })
      withUser(uid => deleteCustomFood(uid, id))
    },
    startRehab: (program) => dispatch({ type:'START_REHAB', program }),
    logRehabPain: (programId, pain, note) => dispatch({ type:'LOG_REHAB_PAIN', programId, pain, note }),
    logRehabSession: (programId, week) => dispatch({ type:'LOG_REHAB_SESSION', programId, week }),
    stopRehab: (id) => dispatch({ type:'STOP_REHAB', id }),
    addMeasurement: (m) => dispatch({ type:'ADD_MEASUREMENT', m }),
    removeMeasurement: (index) => dispatch({ type:'REMOVE_MEASUREMENT', index }),
    addProgressPhoto: (photo) => dispatch({ type:'ADD_PROGRESS_PHOTO', photo }),
    removeProgressPhoto: (id) => dispatch({ type:'REMOVE_PROGRESS_PHOTO', id }),
    addPR: (pr) => dispatch({ type:'ADD_PR', pr }),
    removePR: (id) => dispatch({ type:'REMOVE_PR', id }),
    setGoal: (goal) => dispatch({ type:'SET_GOAL', goal }),
    removeGoal: (id) => dispatch({ type:'REMOVE_GOAL', id }),
    checkinGoal: (goalId, value, note) => dispatch({ type:'CHECKIN_GOAL', goalId, value, note }),
    addTrainingRequest: (request) => dispatch({ type:'ADD_TRAINING_REQUEST', request }),
    updateTrainingRequest: (id, patch) => dispatch({ type:'UPDATE_TRAINING_REQUEST', id, patch }),
    saveBenchmarkPR: (pr) => dispatch({ type:'SAVE_BENCHMARK_PR', pr }),
    // Bodybuilding module
    bbSaveRoutine: (routine) => dispatch({ type:'BB_SAVE_ROUTINE', routine }),
    bbDeleteRoutine: (id) => dispatch({ type:'BB_DELETE_ROUTINE', id }),
    bbSaveProgram: (programId) => dispatch({ type:'BB_SAVE_PROGRAM', programId }),
    bbUnsaveProgram: (programId) => dispatch({ type:'BB_UNSAVE_PROGRAM', programId }),
    bbSetActiveProgram: (program) => dispatch({ type:'BB_SET_ACTIVE_PROGRAM', program }),
    bbUpdateExercisePR: (result) => dispatch({ type:'BB_UPDATE_EXERCISE_PR', result }),
    bbUpdateSettings: (patch) => dispatch({ type:'BB_UPDATE_SETTINGS', patch }),
    reset: () => dispatch({ type:'RESET' }),
  }

  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>
}

export { ROLES }
