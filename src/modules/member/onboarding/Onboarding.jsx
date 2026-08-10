import React, { useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Button, Card, Input, Select } from '../../../components/ui/UI'
import { activityFactors, goalAdjustments, dietTemplates } from '../../../utils/calc'
import { GoalBuilder } from '../goals/GoalBuilder'
import { useAuth } from '../../../auth/AuthContext'
import { uploadProgressPhoto } from '../../../services/supabaseSync'
import { HealthAcknowledgment, readHealthAck } from '../../../components/legal/HealthAcknowledgment'

const STEPS = ['ברוכים הבאים','פרטים אישיים','מטרה חכמה','תזונה','תמונת התחלה','סיום']

export function Onboarding() {
 const { completeOnboarding, addProgressPhoto } = useApp()
 const { user } = useAuth()
 const [step, setStep] = useState(0)
 // Pre-fill name from the signup — LoginScreen stores it in user.name
 // and also in localStorage under hfos:last_name. No reason to ask twice.
 const initialName = user?.name
   || (typeof window !== 'undefined' && (localStorage.getItem('hfos:last_name') || ''))
   || ''
 const [data, setData] = useState({
 name: initialName, age: 30, sex:'male', heightCm: 175, weightKg: 75,
 activity:'moderate', experience:'בינוני',
 goalKey:'recomp', targetPeriodWeeks: 12,
 dietKey:'balanced', constraints:'',
 })
 const [goalPhase, setGoalPhase] = useState('intro') // intro | wizard | done
 const [error, setError] = useState(null)
 const [needHealthAck, setNeedHealthAck] = useState(false)

 const set = (patch) => { setData(d => ({ ...d, ...patch })); setError(null) }
 const next = () => {
 if (step === 2 && goalPhase === 'intro') {
 setError('צריך לבחור אחת מהאופציות למטה: "בואו נבנה מטרה" או "דלג לעכשיו"')
 return
 }
 setError(null)
 setStep(s => Math.min(STEPS.length - 1, s + 1))
 }
 const skipGoal = () => {
 setError(null)
 setGoalPhase('skipped')
 setStep(s => Math.min(STEPS.length - 1, s + 1))
 }
 const prev = () => { setError(null); setStep(s => Math.max(0, s - 1)) }
 const finish = () => {
 // Require health acknowledgment before entering the app
 if (!readHealthAck()) { setNeedHealthAck(true); return }
 completeOnboarding(data)
 }
 const afterHealthAck = () => { setNeedHealthAck(false); completeOnboarding(data) }

 // Full-screen ack gate — intercepts finish
 if (needHealthAck) {
 return (
 <div style={{ minHeight:'100vh', background: t.color.bg, padding: t.space.lg, direction:'rtl', color: t.color.text, display:'flex', alignItems:'center' }}>
 <div style={{ maxWidth: 900, margin:'0 auto', width:'100%' }}>
 <HealthAcknowledgment onConfirm={afterHealthAck} initialName={data.name || initialName} />
 </div>
 </div>
 )
 }

 // Goal step is FULLSCREEN, not inside the card
 if (step === 2 && goalPhase === 'wizard') {
 return (
 <div style={{ minHeight:'100vh', background: t.color.bg, padding: t.space.lg, direction:'rtl', color: t.color.text }}>
 <div style={{ maxWidth: 900, margin:'0 auto'}}>
 <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 24 }}>
 <button onClick={() => setGoalPhase('intro')} style={{
 background: t.color.bgSoft, border:`1px solid ${t.color.border}`, color: t.color.text,
 padding:'8px 14px', borderRadius: t.radius.md, cursor:'pointer', fontFamily:'inherit',
 }}>→ חזור</button>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim }}>שלב 3/5 · מטרה חכמה</div>
 </div>
 <GoalBuilder embedded onDone={() => { setGoalPhase('done'); next() }} />
 </div>
 </div>
 )
 }

 return (
 <div style={{
 minHeight:'100vh', background: t.color.bg, display:'flex', alignItems:'center', justifyContent:'center',
 padding: t.space.lg, direction:'rtl', color: t.color.text,
 }}>
 <Card style={{ maxWidth: 620, width:'100%', padding: 40 }} glow>
 <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 24 }}>
 <div style={{ width:44, height:44, borderRadius:12, background:t.color.wineLight, color:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily: t.font.family.display, fontWeight:800, fontSize:24, letterSpacing:'-0.03em' }}>S</div>
 <div>
 <div style={{ fontFamily: t.font.family.display, fontWeight:700, fontSize: 22, letterSpacing:'-0.02em' }}>Selano</div>
 <div style={{ fontFamily: t.font.family.mono, fontSize:10, color:t.color.silver2, letterSpacing:'0.28em', textTransform:'uppercase' }}>Onboarding</div>
 </div>
 </div>

 {/* stepper */}
 <div style={{ display:'flex', gap: 6, marginBottom: 28 }}>
 {STEPS.map((_, i) => (
 <div key={i} style={{
 flex:1, height: 4, borderRadius: 2,
 background: i <= step ? t.color.gold : t.color.bgSoft, transition: t.transition,
 }} />
 ))}
 </div>

 <div style={{ minHeight: 340 }}>
 {step === 0 && <StepWelcome />}
 {step === 1 && <StepPersonal data={data} set={set} />}
 {step === 2 && <StepGoalIntro onStartWizard={() => setGoalPhase('wizard')} onSkip={skipGoal} goalPhase={goalPhase} />}
 {step === 3 && <StepDiet data={data} set={set} />}
 {step === 4 && <StepPhoto onUpload={addProgressPhoto} userId={user?.id} onNext={next} />}
 {step === 5 && <StepFinish data={data} />}
 </div>

 {error && (
 <div style={{
 marginTop: 20, padding:'12px 16px',
 background: `${t.color.warning}15`, border:`1px solid ${t.color.warning}`,
 borderRadius: t.radius.md, color: t.color.warning,
 fontSize: t.font.sm, fontWeight: 600,
 display:'flex', alignItems:'center', gap: 10,
 }}>
 <span style={{ fontSize: 18 }}> </span>
 <span>{error}</span>
 </div>
 )}

 <div style={{ display:'flex', justifyContent:'space-between', marginTop: 28, gap: 12 }}>
 {step > 0 ? <Button variant="ghost"onClick={prev}>חזור</Button> : <span />}
 {step < STEPS.length - 1
 ? <Button onClick={next}>המשך ←</Button>
 : <Button onClick={finish} icon=" ">בוא נתחיל</Button>}
 </div>
 </Card>
 </div>
 )
}

function StepGoalIntro({ onStartWizard, onSkip, goalPhase }) {
 return (
 <div style={{ textAlign:'center', padding:'20px 0'}}>
 <div style={{ fontSize: 56, marginBottom: 16 }}>{goalPhase === 'done'? ' ':' '}</div>
 <h2 style={{ fontSize: t.font.xxl, fontWeight: 800, marginBottom: 10 }}>
 {goalPhase === 'done'? 'מטרה נבנתה בהצלחה':'עכשיו - המטרה הראשונה שלך'}
 </h2>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, lineHeight: 1.6, maxWidth: 460, margin:'0 auto 24px'}}>
 {goalPhase === 'done'
 ? 'המטרה שלך מוגדרת ומדידה. תוכל לעקוב אחריה מהעמוד הראשי ולעדכן מדדים בקלות.'
 :'זה החלק הכי חשוב באונבורדינג. מטרה חכמה = ספציפית, מדידה, ובעלת דדליין. אם אתה לא בטוח - יש coaching שיעזור.'}
 </p>
 {goalPhase === 'intro'&& (
 <div style={{ display:'flex', gap: 10, justifyContent:'center', flexWrap:'wrap'}}>
 <Button onClick={onStartWizard} icon="">בואו נבנה מטרה</Button>
 <Button variant="ghost"onClick={onSkip}>דלג לעכשיו</Button>
 </div>
 )}
 </div>
 )
}

function StepWelcome() {
 return (
 <div style={{ textAlign:'center', padding:'20px 0'}}>
 <div style={{ fontSize: 64, marginBottom: 20 }}> </div>
 <h1 style={{ fontSize: t.font.xxl, fontWeight: 800, marginBottom: 12 }}>ברוכים הבאים ל־Selano</h1>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, lineHeight: 1.7, maxWidth: 460, margin:'0 auto'}}>
 מערכת לניהול הביצועים שלך — אימונים, תזונה, מנטלי, הכל במקום אחד ומחובר.
 </p>
 </div>
 )
}

function StepPersonal({ data, set }) {
 return (
 <div style={{ display:'grid', gap: 14 }}>
 <Input label="שם מלא"placeholder="דנה כהן"value={data.name} onChange={e => set({ name: e.target.value })} />
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
 <Input type="number"label="גיל"value={data.age} onChange={e => set({ age: +e.target.value })} />
 <Select label="מין"value={data.sex} onChange={e => set({ sex: e.target.value })}>
 <option value="male">גבר</option>
 <option value="female">אישה</option>
 </Select>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
 <Input type="number"label="גובה (ס״מ)"value={data.heightCm} onChange={e => set({ heightCm: +e.target.value })} />
 <Input type="number"label="משקל (ק״ג)"value={data.weightKg} onChange={e => set({ weightKg: +e.target.value })} />
 </div>
 <Select label="רמת פעילות יומית"value={data.activity} onChange={e => set({ activity: e.target.value })}>
 {Object.entries(activityFactors).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 </div>
 )
}


function StepDiet({ data, set }) {
 return (
 <div style={{ display:'grid', gap: 12 }}>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, marginBottom: 4 }}>סגנון תזונה מועדף (ניתן לשנות בכל עת):</div>
 {Object.entries(dietTemplates).map(([k, v]) => (
 <div key={k} onClick={() => set({ dietKey: k })} style={{
 padding:'14px 16px', border: `1px solid ${data.dietKey === k ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.md, cursor:'pointer',
 background: data.dietKey === k ? t.color.goldGlow :'transparent',
 transition: t.transition,
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
 <div style={{ fontWeight: 600, color: data.dietKey === k ? t.color.gold : t.color.text }}>{v.label}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{v.p}% חלבון · {v.c}% פחמ׳ · {v.f}% שומן</div>
 </div>
 </div>
 ))}
 </div>
 )
}

function StepPhoto({ onUpload, userId, onNext }) {
 const [angle, setAngle] = useState('front')
 const [uploaded, setUploaded] = useState(false)
 const [uploading, setUploading] = useState(false)
 const fileRef = React.useRef(null)

 const handle = (e) => {
 const file = e.target.files?.[0]
 if (!file) return
 setUploading(true)
 const reader = new FileReader()
 reader.onload = async (ev) => {
 onUpload({
 id:'photo_'+ Date.now(),
 date: new Date().toISOString(),
 dataUrl: ev.target.result,
 angle,
 note:'תמונת התחלה',
 })
 // Fire-and-forget cloud upload; local copy is already saved.
 try { await uploadProgressPhoto({ userId, file, angle, note:'תמונת התחלה'}) } catch (_) {}
 setUploaded(true)
 setUploading(false)
 }
 reader.readAsDataURL(file)
 }

 return (
 <div style={{ textAlign:'center', padding:'10px 0'}}>
 <div style={{ fontSize: 56, marginBottom: 12 }}> </div>
 <h2 style={{ fontSize: t.font.xxl, fontWeight: 800, marginBottom: 8 }}>תמונת התחלה של המסע</h2>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, lineHeight: 1.6, maxWidth: 460, margin:'0 auto 20px'}}>
 תמונה אחת עכשיו = השוואות מדהימות עוד חודשיים. אור טבעי, מראה טובה.
 <br />
 <b style={{ color: t.color.gold }}>אופציונלי</b> - אפשר לדלג ולעשות אחר כך.
 </p>

 {uploaded ? (
 <div style={{ padding: 20, background: `${t.color.success}20`, borderRadius: t.radius.md, border: `1px solid ${t.color.success}`, marginBottom: 16 }}>
 <div style={{ fontSize: 32 }}> </div>
 <div style={{ fontWeight: 700, color: t.color.success, marginTop: 6 }}>נשמר!</div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginTop: 4 }}>נזכיר לך בעוד שבועיים לתמונה חדשה</div>
 </div>
 ) : (
 <>
 <div style={{ display:'flex', gap: 8, justifyContent:'center', marginBottom: 16 }}>
 {[{ v:'front', l:'חזית'}, { v:'side', l:'צד'}, { v:'back', l:'גב'}].map(a => (
 <button key={a.v} onClick={() => setAngle(a.v)} style={{
 padding:'10px 18px', borderRadius: t.radius.md,
 background: angle === a.v ? t.color.gold : t.color.bgSoft,
 color: angle === a.v ? '#0d0d14': t.color.text,
 border: `1px solid ${angle === a.v ? t.color.gold : t.color.border}`,
 cursor:'pointer', fontFamily:'inherit', fontWeight: 700,
 }}>{a.l}</button>
 ))}
 </div>
 <input ref={fileRef} type="file"accept="image/*"capture="environment"onChange={handle} style={{ display:'none'}} />
 <Button size="lg"icon=" " disabled={uploading} onClick={() => fileRef.current?.click()}>
 {uploading ? 'מעלה...':'צלם/בחר תמונה'}
 </Button>
 </>
 )}

 <div style={{ marginTop: 20, padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm, fontSize: t.font.xs, color: t.color.textDim, lineHeight: 1.5 }}>
 התמונות שלך נשמרות מקומית במכשיר בלבד. גישה חיצונית תוכנס אחרי חיבור backend.
 </div>
 </div>
 )
}

function StepFinish({ data }) {
 return (
 <div style={{ textAlign:'center', padding:'20px 0'}}>
 <div style={{ fontSize: 64, marginBottom: 16 }}> </div>
 <h2 style={{ fontSize: t.font.xxl, fontWeight: 800, marginBottom: 8 }}>הכל מוכן{data.name ? `, ${data.name.split(' ')[0]}` :''}</h2>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, marginBottom: 24 }}>
 נכין לך תכנית אימון + יעדי תזונה מותאמים על סמך הנתונים שהזנת.
 </p>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, textAlign:'center'}}>
 {[
 { label:'BMI', val: (data.weightKg / ((data.heightCm/100)**2)).toFixed(1) },
 { label:'מטרה', val: goalAdjustments[data.goalKey]?.label.split(' ')[0] || '-'},
 { label:'תזונה', val: dietTemplates[data.dietKey]?.label || '-' },
 ].map((s, i) => (
 <div key={i} style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: 4 }}>{s.label}</div>
 <div style={{ fontSize: t.font.lg, fontWeight: 700, color: t.color.gold }}>{s.val}</div>
 </div>
 ))}
 </div>
 </div>
 )
}
