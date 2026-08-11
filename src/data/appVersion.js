// App version + release notes.
// Bump APP_VERSION whenever you ship a change worth announcing to members.
// The admin dashboard checks this against the last-broadcast version stored
// per admin in localStorage; if it's higher, VersionAnnouncement offers to
// broadcast the notes to every member as an admin_message.
//
// KEEP entries chronological — newest first — so the admin sees the latest at
// the top. Each entry: { date, title, body, category }.

export const APP_VERSION = '0.3.0'

export const CHANGELOG = [
  {
    version: '0.3.0',
    date: '2026-08-11',
    title: 'עדכון גדול בסלאנו',
    body: [
      'הוספנו למערכת:',
      '• מערכת הודעות מהאדמין — טוסט שקופץ בראש המסך + פעמון חדש בהדר להיסטוריה מלאה',
      '• קורא בדיקות דם חכם — פשוט צלמו/העלו את הבדיקה והמערכת ממלאת את הערכים אוטומטית',
      '• מאגר יוגה מורחב עם BOHO BEAUTIFUL — 15+ סרטונים חדשים + קישור לערוץ המלא',
      '• עיצוב מקצועי נקי יותר',
      '',
      'שיהיה בהצלחה באימונים!',
    ].join('\n'),
    category: 'important',
  },
  {
    version: '0.2.5',
    date: '2026-07-25',
    title: 'שיפורי חוויה',
    body: 'תיקוני עיצוב במסך הבית, שיפור בנרמול תרגילים בתכניות אימון, ותיקון תצוגת המרשמים בתזונה.',
    category: 'general',
  },
]

// Return the newest release-notes entry for a given target version
export function entryForVersion(v) {
  return CHANGELOG.find(x => x.version === v) || null
}
