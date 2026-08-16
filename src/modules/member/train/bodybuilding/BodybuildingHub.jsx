import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Tabs } from '../../../../components/ui/UI'
import { useI18n } from '../../../../i18n/i18n'
import { ExplorePrograms } from './ExplorePrograms'
import { MyRoutines } from './MyRoutines'
import { TrainerGenerator } from './TrainerGenerator'
import { LegendPrograms } from './LegendPrograms'

// Main tab for the Bodybuilding module. Standalone Exercise Library
// was removed — the picker inside RoutineBuilder covers the same
// 562-exercise catalog and only in a context where it's actionable.
export function BodybuildingHub() {
 const { t: tr } = useI18n()
 const [tab, setTab] = useState('trainer')

 return (
 <div>
 <Tabs
 tabs={[
 { key:'trainer', label: 'בנה אימון משלך' },
 { key:'legends', label: 'תכניות אליפות' },
 { key:'programs', label: 'תכניות נוספות' },
 { key:'routines', label: 'האימונים שלי' },
 ]}
 active={tab}
 onChange={setTab}
 />

 {tab === 'trainer'&& <TrainerGenerator />}
 {tab === 'legends'&& <LegendPrograms />}
 {tab === 'programs'&& <ExplorePrograms />}
 {tab === 'routines'&& <MyRoutines />}
 </div>
 )
}
