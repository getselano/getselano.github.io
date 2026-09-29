# אתגר 6 השבועות · גריפ

שכבת מעקב והנעה מעל בוסטאפ, האפליקציה של התזונאית וקבוצת הוואטסאפ.
Next.js (App Router) · Supabase · Netlify · PWA · RTL · Asia/Jerusalem.

## הרצה מקומית

```bash
cd grip-challenge
npm install
npm run dev          # בלי משתני Supabase → מצב הדגמה עם נתונים לדוגמה ובורר תפקידים
npm test             # מודול החישובים, הודעות, לו"ז, אדפטר הנוכחות
npm run test:rls     # מדיניות RLS מול Postgres אמיתי (צריך initdb/pg_ctl מקומיים)
npm run typecheck
```

## מבנה

| איפה | מה |
|---|---|
| `lib/calc.ts` | **מודול החישובים.** רצף, כלל יום החופש, `reward_days`, סטטוס צבע, ארבעת התנאים, מיילסטונים, תחזית. כל המסכים קוראים ממנו דרך `snapshot()`. |
| `lib/calc.test.ts` | הטסטים שבקריטריוני הקבלה (רצף עם יום חופש, שני חסרים באותו שבוע, `reward_days` לא רצוף, שלושת הצבעים) ועוד. |
| `supabase/migrations/0001_schema.sql` | סכמה, RLS לארבעת התפקידים, `mark_today()`, `my_call_dates()`, `mark_milestone_seen()`. |
| `tests/rls.test.ts` | בדיקות RLS: משתתף לא רואה משתתף אחר, מאמן רק את המוקצים לו, וכו׳. |
| `lib/attendance/` | `AttendanceProvider` + `ManualAttendanceProvider` (ברירת מחדל) + שלד `BoostappAttendanceProvider`. |
| `lib/data/` | גישה לנתונים: Supabase (דרך RLS) ומימוש הדגמה בזיכרון מאחורי אותו ממשק. |
| `app/(participant)` | בית · סימון יומי (`/today`) · התקדמות · הצוות שלי · רגע הזכייה (`/win`). |
| `app/(staff)` | מסך צוות (`/team`), כרטיס משתתף ותיעוד שיחה, דשבורד admin, ניהול משתתפים/צוות/לו״ז, לפני-אחרי. |
| `app/api/intake/signup` | קליטה ממערכת החתימה: משתתף + פרטי העסקה (`participant_deals`, admin בלבד). קוד ה-Apps Script ב-`apps-script/grip-intake.gs`. היעד נקבע בשיחת הקליטה ומוזן באפליקציה. |
| `app/api/cron/*` + `netlify/functions` | תזכורת יומית (20:00) וסיכום שבועי (מוצ״ש 21:00) בוואטסאפ. |
| `app/api/auth/send-code` | Send SMS Hook של Supabase: קוד הכניסה נשלח בוואטסאפ (Green API). |

## הקמה

1. **Supabase:** פרויקט חדש → SQL Editor → להריץ את `supabase/migrations/0001_schema.sql` ואחריו `0002_deals.sql`.
2. **Auth → Phone:** להפעיל התחברות בטלפון. קוד הכניסה נשלח **בוואטסאפ** מהטלפון העסקי של גריפ (Green API)
   דרך Send SMS Hook: Authentication → Hooks → Send SMS → HTTPS → `https://<site>/api/auth/send-code`,
   ואת ה-secret שנוצר שמים ב-`SEND_CODE_HOOK_SECRET`. אין צורך ב-Twilio.
3. **admin ראשון:** `insert into staff (full_name, phone, role) values ('אביב', '9725XXXXXXXX', 'admin');`
   (טלפון בפורמט ספרות בלבד, בלי `+` ובלי 0 מוביל). משם הכל מהממשק.
4. **Netlify:** Base directory = `grip-challenge`. משתני הסביבה לפי `.env.example`.
   ה-scheduled functions נטענות מ-`netlify/functions`.
5. **Apps Script:** להדביק את `apps-script/grip-intake.gs` בסוף `קוד.gs`, להגדיר `GRIP_URL` ו-`GRIP_INTAKE_SECRET`,
   ולקרוא ל-`gripSync_(data, stamp, file.getUrl())` בתוך `submitAgreement` אחרי `logRow_`.
6. **וואטסאפ (Green API):** `GREEN_API_URL`, `GREEN_API_ID_INSTANCE`, `GREEN_API_TOKEN` מדף המופע ב-Green API.
   קוד הכניסה, התזכורת היומית והסיכום השבועי יוצאים כולם מהמספר העסקי. בלי טוקן ההודעות רק נרשמות ללוג (dry run).
7. **בוסטאפ:** כשיתברר ה-API, לממש את `fetchCheckIns` ב-`lib/attendance/boostapp.ts` ולהגדיר
   `ATTENDANCE_PROVIDER=boostapp`. שום מסך לא משתנה.

## החלטות פרשנות (מקומות שהמפרט לא סגר)

כל אחת מבודדת בקבוע או בפונקציה אחת, קל לשנות:

- **"היום" פתוח:** יום נוכחי שעוד לא סומן לא שובר ולא נספר; הרצף נקרא מאתמול.
- **יום חופש בקצה הרצף:** יום סלוח שאין לפניו יום מסומן לא נספר (אחרת רצף "1" בלי אף סימון).
- **שבוע קלנדרי** לכלל יום החופש = ראשון–שבת. התנאים השבועיים (מדידה, שיחה) נספרים לפי שבועות התוכנית (1–6) בגלל הכניסה המתגלגלת.
- **שיחה שהוחמצה:** 7 ימים בלי שיחה, כשיום ההתחלה נחשב מגע ראשון, כדי שמשתתף חדש לא יהיה אדום ביום 1.
- **תנאי התזונה ("יומי")** = 36 ימים מדווחים (יום חופש בשבוע × 6 שבועות) — `NUTRITION_REQUIRED_DAYS`.
- **יום המדידה:** יום 7, 14, … 42 של התוכנית.
- **מיילסטונים:** `week_1` = 7 ימים מסומנים, `halfway` = 18 (חצי מ-36), `ten_workouts` = 10 אימונים.
- **תוקף האימון האישי:** 30 יום אחרי יום 42 — `REWARD_VALIDITY_DAYS`.
- **שווי חודש מנוי** לתחזית העלות: `NEXT_PUBLIC_MEMBERSHIP_MONTH_VALUE` (לא הוגדר במפרט).
- **תוספות לסכמה** שהמסכים דרשו: `schedule_slots` (ימי אימון והאימון הבא), `workout_confirmed_by/at` (הסרת סימון שגוי; אין חובת אישור — האימון נספר מיד),
  `milestones.seen_at` (רגע הזכייה פעם אחת), `participants.marketing_consent` (לפני-אחרי), `notifications_log` (בלי כפילויות בוואטסאפ).
- **סיכומי שיחות** גלויים לצוות בלבד; המשתתף מקבל רק את התאריכים (לתנאי השיחה השבועית).
- **משתתף מסמן רק את היום** (לפי שעון ישראל בשרת). תיקון ימים קודמים — admin, במסך העריכה.
- **ציון ביום 1:** לפי `ceil(12·day/42)` משתתף ביום 1–3 בלי אימון מסומן צהוב. זה המפרט כלשונו.
