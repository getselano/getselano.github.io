// Local food library — all values PER 100g.
//
// `barcode` is a demo EAN-13 for on-device lookup.
// Micronutrients tracked alongside the macros: fiber / sugar / satFat in
// grams, sodium in milligrams. These come back free in the same
// OpenFoodFacts payload we already fetch, so we keep them rather than
// discarding them.
export const foods = [
  // ── חלבון ──────────────────────────────────────────────────────
  { id:'chicken_breast', name:'חזה עוף מבושל', kcal:165, p:31, c:0, f:3.6, fiber:0, sugar:0, sodium:74, satFat:1, cat:'חלבון', barcode:'7290000000101' },
  { id:'salmon', name:'סלמון אפוי', kcal:206, p:22, c:0, f:12, fiber:0, sugar:0, sodium:61, satFat:2.5, cat:'חלבון' },
  { id:'tuna', name:'טונה במים', kcal:116, p:26, c:0, f:1, fiber:0, sugar:0, sodium:247, satFat:0.3, cat:'חלבון' },
  { id:'egg', name:'ביצה שלמה', kcal:143, p:13, c:1.1, f:9.5, fiber:0, sugar:1.1, sodium:142, satFat:3.1, cat:'חלבון' },
  { id:'tofu', name:'טופו', kcal:76, p:8, c:1.9, f:4.8, fiber:0.3, sugar:0.6, sodium:7, satFat:0.7, cat:'חלבון' },
  { id:'greek_yogurt', name:'יוגורט יווני 2%', kcal:73, p:10, c:3.6, f:1.9, fiber:0, sugar:3.6, sodium:34, satFat:1.2, cat:'חלבון', barcode:'7290000000200' },
  { id:'cottage', name:'קוטג׳ 5%', kcal:98, p:11, c:3.4, f:5, fiber:0, sugar:3.4, sodium:364, satFat:3, cat:'חלבון', barcode:'7290000000217' },
  { id:'whey', name:'אבקת חלבון מי גבינה', kcal:400, p:80, c:10, f:3.3, fiber:0.5, sugar:6.7, sodium:500, satFat:1.7, cat:'חלבון', barcode:'7290000000224' },

  // ── פחמימה ─────────────────────────────────────────────────────
  { id:'rice', name:'אורז לבן מבושל', kcal:130, p:2.7, c:28, f:0.3, fiber:0.4, sugar:0.1, sodium:1, satFat:0.1, cat:'פחמימה' },
  { id:'rice_brown', name:'אורז מלא מבושל', kcal:112, p:2.6, c:23, f:0.9, fiber:1.8, sugar:0.4, sodium:5, satFat:0.2, cat:'פחמימה' },
  { id:'oats', name:'שיבולת שועל יבשה', kcal:389, p:16.9, c:66, f:6.9, fiber:10.6, sugar:1, sodium:2, satFat:1.2, cat:'פחמימה', barcode:'7290000000305' },
  { id:'sweet_potato', name:'בטטה אפויה', kcal:90, p:2, c:21, f:0.1, fiber:3.3, sugar:6.5, sodium:36, satFat:0, cat:'פחמימה' },
  { id:'pasta', name:'פסטה מבושלת', kcal:158, p:5.8, c:31, f:0.9, fiber:1.8, sugar:0.6, sodium:1, satFat:0.2, cat:'פחמימה' },
  { id:'bread_whole', name:'לחם מחמצת מלא', kcal:247, p:9, c:41, f:3.4, fiber:6, sugar:3, sodium:450, satFat:0.7, cat:'פחמימה', barcode:'7290000000411' },

  // ── קטניה ──────────────────────────────────────────────────────
  { id:'lentils', name:'עדשים מבושלות', kcal:116, p:9, c:20, f:0.4, fiber:7.9, sugar:1.8, sodium:2, satFat:0.1, cat:'קטניה' },
  { id:'chickpea', name:'חומוס מבושל', kcal:164, p:8.9, c:27, f:2.6, fiber:7.6, sugar:4.8, sodium:7, satFat:0.3, cat:'קטניה' },

  // ── שומן ───────────────────────────────────────────────────────
  { id:'avocado', name:'אבוקדו', kcal:160, p:2, c:9, f:15, fiber:6.7, sugar:0.7, sodium:7, satFat:2.1, cat:'שומן' },
  { id:'olive_oil', name:'שמן זית', kcal:884, p:0, c:0, f:100, fiber:0, sugar:0, sodium:2, satFat:13.8, cat:'שומן' },
  { id:'almond', name:'שקדים', kcal:579, p:21, c:22, f:50, fiber:12.5, sugar:4.4, sodium:1, satFat:3.8, cat:'שומן' },
  { id:'walnut', name:'אגוזי מלך', kcal:654, p:15, c:14, f:65, fiber:6.7, sugar:2.6, sodium:2, satFat:6.1, cat:'שומן' },
  { id:'peanut_butter', name:'חמאת בוטנים', kcal:588, p:25, c:20, f:50, fiber:6, sugar:9, sodium:425, satFat:10, cat:'שומן', barcode:'7290000000602' },

  // ── ירק ────────────────────────────────────────────────────────
  { id:'broccoli', name:'ברוקולי מאודה', kcal:35, p:2.4, c:7, f:0.4, fiber:3.3, sugar:1.4, sodium:41, satFat:0, cat:'ירק' },
  { id:'cucumber', name:'מלפפון', kcal:15, p:0.7, c:3.6, f:0.1, fiber:0.5, sugar:1.7, sodium:2, satFat:0, cat:'ירק' },
  { id:'tomato', name:'עגבנייה', kcal:18, p:0.9, c:3.9, f:0.2, fiber:1.2, sugar:2.6, sodium:5, satFat:0, cat:'ירק' },

  // ── פרי ────────────────────────────────────────────────────────
  { id:'apple', name:'תפוח', kcal:52, p:0.3, c:14, f:0.2, fiber:2.4, sugar:10.4, sodium:1, satFat:0, cat:'פרי' },
  { id:'banana', name:'בננה', kcal:89, p:1.1, c:23, f:0.3, fiber:2.6, sugar:12.2, sodium:1, satFat:0.1, cat:'פרי' },
  { id:'berries', name:'פירות יער', kcal:57, p:0.7, c:14, f:0.3, fiber:5.3, sugar:8, sodium:1, satFat:0, cat:'פרי' },

  // ── קינוח ──────────────────────────────────────────────────────
  { id:'dark_choc', name:'שוקולד מריר 70%', kcal:598, p:7.8, c:46, f:43, fiber:11, sugar:24, sodium:20, satFat:24.5, cat:'קינוח', barcode:'7290000000701' },
]

// portion size hints (grams) for common serving units
export const portionSizes = {
  'כף':      15,
  'כפית':    5,
  'כוס':     240,
  'חצי כוס': 120,
  'פרוסה':   30,
  'ביצה':    50,
  'פרי בינוני': 150,
  'מנה קטנה':  100,
  'מנה בינונית': 200,
  'מנה גדולה': 300,
}

// The nutrients we scale and total. Macros first, then micros.
// `unit` drives display; sodium is the only one in mg.
export const NUTRIENTS = [
  { key:'kcal',   he:'קלוריות',    short:'קק״ל', unit:''   },
  { key:'p',      he:'חלבון',      short:'חלבון', unit:'ג׳' },
  { key:'c',      he:'פחמימות',    short:'פחמ׳',  unit:'ג׳' },
  { key:'f',      he:'שומן',       short:'שומן',  unit:'ג׳' },
  { key:'fiber',  he:'סיבים',      short:'סיבים', unit:'ג׳' },
  { key:'sugar',  he:'סוכר',       short:'סוכר',  unit:'ג׳' },
  { key:'satFat', he:'שומן רווי',  short:'רווי',  unit:'ג׳' },
  { key:'sodium', he:'נתרן',       short:'נתרן',  unit:'מ״ג' },
]

// Micronutrient keys only — the four we added on top of the macros.
export const MICRO_KEYS = ['fiber', 'sugar', 'satFat', 'sodium']

// Scale a per-100g food to an actual eaten amount. Single source of truth
// so every add-path (search / barcode / custom / recipe) produces the same
// shape and never forgets a nutrient.
export function scaleFood(food, grams) {
  const factor = (Number(grams) || 0) / 100
  const out = {
    foodId: food.id,
    name: food.name,
    grams: Number(grams) || 0,
    kcal: round1(num(food.kcal) * factor),
    p:    round1(num(food.p) * factor),
    c:    round1(num(food.c) * factor),
    f:    round1(num(food.f) * factor),
  }
  for (const k of MICRO_KEYS) {
    if (food[k] != null) out[k] = round1(num(food[k]) * factor)
  }
  return out
}

// ─── OpenFoodFacts ────────────────────────────────────────────────
// Free, no API key. Two entry points: barcode lookup and name search.

const OFF_FIELDS = [
  'code', 'product_name', 'product_name_he', 'brands', 'nutriments',
  'image_front_thumb_url', 'image_thumb_url', 'categories_hierarchy',
  'serving_size',
].join(',')

const OFF_TIMEOUT_MS = 8000

// Shared mapper — both lookup paths run through this so the barcode result
// and the search result carry exactly the same fields.
function mapOffProduct(p, code) {
  const n = p.nutriments || {}
  const barcode = code || p.code || ''
  const kcalRaw = num(n['energy-kcal_100g']) || num(n['energy-kcal'])
  const kcal = kcalRaw || (num(n.energy_100g) ? num(n.energy_100g) / 4.184 : 0)
  // OFF reports sodium in grams; we store milligrams. Fall back to salt/2.5.
  const sodiumG = n.sodium_100g != null ? num(n.sodium_100g) : num(n.salt_100g) / 2.5
  return {
    id: 'off_' + barcode,
    name: p.product_name_he || p.product_name || `מוצר ${barcode}`,
    kcal:   Math.round(kcal) || 0,
    p:      round1(num(n.proteins_100g)),
    c:      round1(num(n.carbohydrates_100g)),
    f:      round1(num(n.fat_100g)),
    fiber:  round1(num(n.fiber_100g)),
    sugar:  round1(num(n.sugars_100g)),
    satFat: round1(num(n['saturated-fat_100g'])),
    sodium: Math.round(sodiumG * 1000) || 0,
    cat: p.categories_hierarchy?.[0]?.replace(/^en:/, '') || 'סרוק',
    barcode,
    brand: p.brands || '',
    image: p.image_front_thumb_url || p.image_thumb_url || null,
    servingSize: p.serving_size || '',
    source: 'openfoodfacts',
  }
}

// Returns { name, kcal, p, c, f, fiber, sugar, satFat, sodium, ... } or null
export async function lookupBarcode(barcode) {
  // First check local db
  const local = foods.find(f => f.barcode === barcode)
  if (local) return { ...local, source: 'local' }

  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null
    return mapOffProduct(data.product || {}, barcode)
  } catch { return null }
}

// Search OpenFoodFacts by product name. This is what lifts the searchable
// universe past the local library — the barcode path only ever reaches
// packaged goods the user physically has in hand.
//
// Returns [] on network failure so the caller can fall back to local results
// rather than showing an error.
export async function searchFoodsOnline(query, { limit = 24, signal } = {}) {
  const q = (query || '').trim()
  if (q.length < 2) return []
  const url = 'https://world.openfoodfacts.org/cgi/search.pl'
    + `?search_terms=${encodeURIComponent(q)}`
    + '&search_simple=1&action=process&json=1'
    + `&page_size=${limit}&fields=${OFF_FIELDS}`
  try {
    const res = await fetchWithTimeout(url, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products || [])
      .map(p => mapOffProduct(p, p.code))
      // Drop entries with no usable energy value — OFF has many stubs.
      .filter(f => f.kcal > 0 && f.name && !f.name.startsWith('מוצר '))
      .sort(rankOffResult)
  } catch { return [] }
}

// Prefer entries that look complete and locally relevant: Hebrew name first,
// then ones that actually carry macro data.
function rankOffResult(a, b) {
  const score = (f) => {
    let s = 0
    if (/[\u0590-\u05FF]/.test(f.name)) s += 4   // Hebrew product name
    if (f.p > 0 || f.c > 0 || f.f > 0) s += 2    // has macros
    if (f.fiber > 0 || f.sodium > 0) s += 1      // has micros
    if (f.image) s += 1
    return s
  }
  return score(b) - score(a)
}

function fetchWithTimeout(url, { signal } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), OFF_TIMEOUT_MS)
  // Respect an outer abort (e.g. the user typed another character)
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true })
  return fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal })
    .finally(() => clearTimeout(timer))
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function round1(v) {
  return Math.round(num(v) * 10) / 10
}
