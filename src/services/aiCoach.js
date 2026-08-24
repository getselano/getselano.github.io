// AI Coach service - calls Google Gemini API from the client.
// Falls back to old keyword matching if the API key isn't configured
// or if a request fails.
//
// The user's API key comes from VITE_GEMINI_KEY env var.
// Free tier: 15 requests/min, 1500/day per project (plenty for pilot).

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY
// gemini-2.5-flash — current stable, generous free tier
// (1500 requests/day, 1M tokens/day). Bumped from 2.0-flash-exp.
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export const aiEnabled = !!GEMINI_KEY

// System prompt: makes Gemini act as a Selano fitness expert
const SYSTEM_PROMPT = `אתה מומחה כושר, תזונה ובריאות של אפליקציית Selano Holistic Fitness OS.

התמחות:
- כושר ואימונים (בודיבילדינג, כוח, METCONS, פונקציונאלי, יוגה, ריצה)
- תזונה, מקרו, קלוריות, בדיקות דם
- הורמונים (טסטו, אסטרוגן, קורטיזול, אינסולין, GH)
- שינה, התאוששות, מחזורי REM
- פציעות ושיקום (מתי לנוח, מתי לחזור לרופא)
- ניווט באפליקציה - אתה יודע איפה כל דבר בפלטפורמה

אישיות:
- מקצועי אבל חם
- ישיר, לא מפוצץ מילים
- אתה עונה בעברית (אלא אם המשתמש כתב באנגלית)
- אם אין לך מידע ודאי - תגיד את זה בפירוש
- אם השאלה חורגת מהתחום שלך (למשל תשלומים) - הפנה למאמן/מנהל האפליקציה

מבנה תשובה:
- קצר וישיר (2-4 משפטים אלא אם השאלה דורשת יותר)
- אם רלוונטי - הצע פעולה קונקרטית ("עבור ל־תזונה → הוסף")
- אם השאלה אישית/רגשית - הפנה למאמן המנטלי בפלטפורמה

מבנה הפלטפורמה:
-  בית ·  מטרה ·  תובנות ·  התקדמות ·  אימונים ·  שיקום ·  תזונה ·  מנטלי
-  הרגלים ·  יומן ·  V.O.D (סרטוני אימון בבית) ·  חנות ·  אימון אישי ·  פרופיל

אזהרה מקצועית: הצע ראייה מקצועית לרופא/פיזיוטרפיסט לפני שינויים משמעותיים בתזונה או אימון אם יש מצב רפואי.`

// Build message history for Gemini's format
function buildMessages(conversationHistory, userQuestion, userContext = {}) {
  const contextParts = []
  if (userContext.name) contextParts.push(`שם: ${userContext.name}`)
  if (userContext.sex) contextParts.push(`מין: ${userContext.sex === 'female' ? 'אישה' : 'גבר'}`)
  if (userContext.age) contextParts.push(`גיל: ${userContext.age}`)
  if (userContext.goal) contextParts.push(`מטרה נוכחית: ${userContext.goal}`)
  if (userContext.plan) contextParts.push(`תכנית פעילה: ${userContext.plan}`)
  const contextLine = contextParts.length ? `\n\nמידע על המשתמש: ${contextParts.join(', ')}` : ''

  // Gemini uses parts + role: 'user' | 'model' format
  const contents = []
  // Recent conversation history (last 5 exchanges)
  for (const m of (conversationHistory || []).slice(-10)) {
    contents.push({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })
  }
  contents.push({ role: 'user', parts: [{ text: userQuestion + contextLine }] })

  return contents
}

// Main API call - returns the assistant reply text, or null on failure
export async function askAiCoach({ question, history = [], userContext = {} }) {
  if (!aiEnabled) return null

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: buildMessages(history, question, userContext),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    })

    if (!response.ok) {
      console.warn('[aiCoach] Gemini API error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    return text.trim()
  } catch (err) {
    console.warn('[aiCoach] request failed:', err.message)
    return null
  }
}

// Extract blood-test values from an uploaded image or PDF using Gemini vision.
// fileData is a base64 string (without the data: prefix). mimeType is e.g. "image/jpeg" or "application/pdf".
// Returns { values: { markerId: number, ... }, detectedNames: [...] } or null on failure.
//
// The prompt lists exactly the marker IDs the app expects. Gemini scans the
// document and returns only what it finds — never invents values.
export async function extractBloodMarkersFromFile({ fileData, mimeType }) {
  if (!aiEnabled) return null
  if (!fileData || !mimeType) return null

  const markerList = [
    { id: 'hgb',      aliases: ['Hemoglobin', 'HGB', 'המוגלובין'] },
    { id: 'ferritin', aliases: ['Ferritin', 'פריטין'] },
    { id: 'b12',      aliases: ['B12', 'Vitamin B12', 'ויטמין B12', 'קובלמין'] },
    { id: 'vitD',     aliases: ['Vitamin D', '25-OH Vitamin D', '25(OH)D', 'ויטמין D'] },
    { id: 'glucose',  aliases: ['Glucose', 'Fasting Glucose', 'גלוקוז', 'סוכר בצום'] },
    { id: 'hba1c',    aliases: ['HbA1c', 'A1C', 'המוגלובין מסוכרר'] },
    { id: 'chol',     aliases: ['Total Cholesterol', 'Cholesterol', 'כולסטרול כולל'] },
    { id: 'ldl',      aliases: ['LDL', 'LDL Cholesterol', 'כולסטרול LDL'] },
    { id: 'hdl',      aliases: ['HDL', 'HDL Cholesterol', 'כולסטרול HDL'] },
    { id: 'tg',       aliases: ['Triglycerides', 'TG', 'טריגליצרידים'] },
    { id: 'alt',      aliases: ['ALT', 'SGPT', 'אלט'] },
    { id: 'ast',      aliases: ['AST', 'SGOT', 'אסט'] },
    { id: 'creat',    aliases: ['Creatinine', 'קריאטינין'] },
    { id: 'tsh',      aliases: ['TSH', 'Thyroid Stimulating Hormone', 'תריס'] },
    { id: 'crp',      aliases: ['CRP', 'C-Reactive Protein', 'חלבון C תגובתי'] },
    { id: 'testo',    aliases: ['Testosterone', 'Total Testosterone', 'טסטוסטרון'] },
  ]

  const prompt = `אתה עוזר שקורא מסמכי בדיקות דם ומחלץ ערכים.

המסמך הבא הוא בדיקת דם (בעברית או באנגלית). חלץ ערכים לסמנים הבאים בלבד:

${markerList.map(m => `- ${m.id}: ${m.aliases.join(' / ')}`).join('\n')}

הוראות חשובות:
1. החזר **רק** JSON תקין, בלי טקסט לפני או אחרי, בלי \`\`\`json.
2. הכלל בתוצאה רק ערכים שמצאת בפועל במסמך. אל תמציא נתונים.
3. הערך חייב להיות מספר בלבד (לא מחרוזת, בלי יחידות).
4. אם ערך מופיע ביחידות שונות מהמקובל, המר: TSH ל־mIU/L, ויטמין D ל־ng/mL, וכו'.
5. אם לא מצאת סמן כלשהו — פשוט אל תכלול אותו בתוצאה.

מבנה התשובה:
{"values": {"hgb": 14.2, "ferritin": 45, ...}, "note": "הערה קצרה על הבדיקה (תאריך, מעבדה) — אופציונלי"}`

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: fileData } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      console.warn('[aiCoach] blood extract failed:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null

    // Gemini is asked for pure JSON. Strip anything wrapping in case it slipped.
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const parsed = JSON.parse(cleaned)
    // Sanity — only keep numeric values that match a known marker id
    const known = new Set(markerList.map(m => m.id))
    const values = {}
    for (const [k, v] of Object.entries(parsed.values || {})) {
      if (!known.has(k)) continue
      const n = Number(v)
      if (Number.isFinite(n)) values[k] = n
    }
    return { values, note: parsed.note || null }
  } catch (err) {
    console.warn('[aiCoach] extract error:', err.message)
    return null
  }
}

// Detect if a question is emotional/personal - should route to mental coach
// ─── TECHNIQUE COACHING ─────────────────────────────────────────────
// Turns measured joint angles plus a few key stills into coaching language.
//
// The clip itself is never uploaded. MediaPipe has already run on-device and
// produced the numbers; we send 2-4 JPEG frames and the angle table. A 15s
// clip is roughly 87,000 tokens of video, versus about 2,000 this way — which
// is what keeps this inside the free tier instead of costing per review.
export async function coachTechnique({ movement, summary, findings, stills = [], userContext = {} }) {
  if (!aiEnabled) return null

  const measured = Object.entries(summary || {})
    .filter(([, v]) => v && typeof v === 'object' && v.min != null)
    .map(([k, v]) => `${k}: מינימום ${v.min}° · מקסימום ${v.max}° · ממוצע ${v.avg}°`)
    .join('\n')

  // Hand over the same gaps the report shows, so the coaching text cannot
  // quote a different number than the image the user is looking at.
  const ruleResults = (findings || [])
    .map(f => {
      if (!f.measured) return `- ${f.he}: ${f.ok ? 'תקין' : 'חריגה'}`
      const { value, targetHe, delta, jointHe } = f.measured
      return f.ok
        ? `- ${f.he}: תקין (${jointHe} ${value}°)`
        : `- ${f.he}: חריגה — ${jointHe} נמדדה ${value}°, נדרש ${targetHe}, פער ${Math.abs(delta)}°`
    })
    .join('\n')

  const prompt = `אתה מאמן הרמת משקולות וג׳ימנסטיקס. נתח את הביצוע של התרגיל "${movement.he}".

מדידות זוויות מפרקים שחושבו על המכשיר מתוך הסרטון:
${measured || 'לא נמדדו זוויות'}
${summary?.reachedDepth != null ? `\nעומק: ${summary.reachedDepth ? 'הירך ירדה מתחת לקו הברך' : 'הירך לא ירדה מתחת לקו הברך'}` : ''}

בדיקות אוטומטיות:
${ruleResults || 'אין'}

${userContext.experience ? `רמת המתאמן: ${userContext.experience}` : ''}

מצורפות תמונות מנקודות המפתח בתנועה.

כתוב בעברית, בגוף שני, בפורמט הזה בדיוק:
עיקר הדברים: משפט אחד.
מה עובד טוב: 1-2 נקודות.
מה לתקן: עד 3 נקודות, כל אחת עם תיקון מעשי אחד.
תרגיל עזר: תרגיל אחד קונקרטי עם סטים וחזרות.

כללים:
- התבסס על המספרים שקיבלת. אל תמציא מדידות ואל תשנה אותן — המשתמש רואה בדיוק את אותם מספרים על התמונות.
- אם התמונות לא ברורות או שהמדידות לא עקביות — אמור זאת במפורש במקום לנחש.
- אל תאבחן פציעות ואל תיתן ייעוץ רפואי.
- קצר. בלי הקדמות.`

  const parts = [{ text: prompt }]
  for (const still of stills.slice(0, 4)) {
    const base64 = String(still.dataUrl || '').split(',')[1]
    if (base64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } })
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
    })
    if (!res.ok) {
      console.warn('[aiCoach] technique request failed:', res.status)
      return null
    }
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch (err) {
    console.warn('[aiCoach] technique request threw:', err?.message || err)
    return null
  }
}

export function isMentalQuestion(text) {
  const mentalKeywords = [
    'מרגיש', 'לחוץ', 'עצוב', 'חרד', 'מפחד', 'כועס', 'מדוכא', 'עייף נפשית',
    'שחוק', 'לא רוצה', 'מוותר', 'קשה לי נפשית', 'ריקנות', 'בודד',
    'מבולבל רגשית', 'רוצה לבכות', 'אני לא מסוגל נפשית', 'שנאה', 'תסכול',
  ]
  const lower = (text || '').toLowerCase()
  return mentalKeywords.some(kw => lower.includes(kw))
}
