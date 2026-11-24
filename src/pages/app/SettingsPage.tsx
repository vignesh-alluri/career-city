import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Download, Keyboard, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useApplications, useReminders } from '@/hooks/useTracker'
import { applicationsToCsv, downloadText, remindersToCsv } from '@/lib/csv'
import { describeWater, getWaterStatus } from '@/components/effects/waterStatus'
import { ACCENTS, ACCENT_IDS, CALENDAR_VIEWS, PALETTES, PALETTE_INFO, WATER_STRENGTHS, type WaterStrength, type CalendarView, type CityEffects, type Density } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/preferencesStore'
import { useUiStore } from '@/store/uiStore'
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/types'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="eyebrow text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </Card>
  )
}

function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
      <span><span className="block">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
    </label>
  )
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-control border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-[calc(var(--radius-control)-2px)] px-3 py-1.5 text-sm transition-colors', value === o.value ? 'bg-accent text-void' : 'text-muted hover:text-ink')}
        >{o.label}</button>
      ))}
    </div>
  )
}

const VIEW_LABELS: Record<CalendarView, string> = { month: 'Month', week: 'Week', agenda: 'Agenda' }
const WATER_OPTIONS: { value: WaterStrength; label: string }[] = WATER_STRENGTHS.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
const CITY_EFFECT_OPTIONS: { value: CityEffects; label: string }[] = [{ value: 'auto', label: 'Auto' }, { value: 'full', label: 'Full' }, { value: 'light', label: 'Light' }]
const DENSITIES: { value: Density; label: string }[] = [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]

/** Everything that can be personalised, in one place. Changes apply immediately and are remembered in this browser. */
export default function SettingsPage() {
  const accent = usePreferences((s) => s.accent)
  const density = usePreferences((s) => s.density)
  const weekStartsOn = usePreferences((s) => s.weekStartsOn)
  const calendarView = usePreferences((s) => s.calendarView)
  const waterCursor = usePreferences((s) => s.waterCursor)
  const cityEffects = usePreferences((s) => s.cityEffects)
  const palette = usePreferences((s) => s.palette)
  const waterStrength = usePreferences((s) => s.waterStrength)
  const dashboard = usePreferences((s) => s.dashboard)
  const boardHidden = usePreferences((s) => s.boardHidden)
  const update = usePreferences((s) => s.update)
  const reset = usePreferences((s) => s.reset)
  const openHelp = useUiStore((s) => s.openHelp)
  const applications = useApplications()
  const reminders = useReminders()
  const stamp = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        id="settings" title="Settings" description="Make the workspace yours. Changes apply straight away and are saved in this browser."
        actions={<><Button variant="secondary" onClick={openHelp}><Keyboard size={16} /> Shortcuts</Button><Button variant="ghost" onClick={reset}><RotateCcw size={16} /> Reset all</Button></>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Appearance" description="The palette colours the surfaces. The accent colour is used for buttons, links and whatever is selected.">
          <div role="group" aria-label="Palette" className="grid grid-cols-2 gap-3">
            {PALETTES.map((id) => (
              <button
                key={id} type="button" aria-pressed={palette === id} onClick={() => update({ palette: id })}
                className={cn('flex flex-col gap-2 rounded-control border p-2.5 text-left text-xs transition-colors', palette === id ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink')}
              >
                {/* a tiny preview: page, then sidebar and card on top of it */}
                <span aria-hidden className="flex h-10 overflow-hidden rounded-[3px] border border-white/10" style={{ background: PALETTE_INFO[id].swatch[0] }}>
                  <span className="w-1/4" style={{ background: PALETTE_INFO[id].swatch[1] }} />
                  <span className="m-1.5 flex-1 rounded-[2px]" style={{ background: PALETTE_INFO[id].swatch[2] }} />
                </span>
                <span className="font-medium">{PALETTE_INFO[id].label}</span>
                <span className="text-muted">{PALETTE_INFO[id].hint}</span>
              </button>
            ))}
          </div>
          <div role="group" aria-label="Accent colour" className="flex flex-wrap gap-3">
            {ACCENT_IDS.map((id) => (
              <button
                key={id} type="button" aria-pressed={accent === id} onClick={() => update({ accent: id })}
                className={cn('flex flex-col items-center gap-1.5 rounded-control border p-2 text-xs transition-colors', accent === id ? 'border-accent text-ink' : 'border-line text-muted hover:text-ink')}
              >
                <span className="size-8 rounded-full" style={{ background: ACCENTS[id].color, boxShadow: accent === id ? `0 0 14px ${ACCENTS[id].color}` : undefined }} />
                {ACCENTS[id].label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Spacing</span>
            <Segmented label="Spacing" value={density} options={DENSITIES} onChange={(v) => update({ density: v })} />
          </div>
        </Section>

        <Section title="Effects" description="Visual extras. Visitors whose system asks for reduced motion never see them, whatever is set here.">
          <Check label="Water cursor" hint={`The cursor leaves a glassy ripple trail as it moves across the workspace. Now: ${waterCursor ? describeWater(getWaterStatus()) : 'switched off.'}`} checked={waterCursor} onChange={(v) => update({ waterCursor: v })} />
          {waterCursor && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">Ripple strength</span>
              <Segmented label="Ripple strength" value={waterStrength} options={WATER_OPTIONS} onChange={(v) => update({ waterStrength: v })} />
              <p className="text-xs text-muted">How strongly the cursor pushes the water and how bright the ripples look. Subtle is barely there; Lively is the original.</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">3D city effects</span>
            <Segmented label="3D city effects" value={cityEffects} options={CITY_EFFECT_OPTIONS} onChange={(v) => update({ cityEffects: v })} />
            <p className="text-xs text-muted">
              Auto starts with everything and switches the heavy effects off by itself if the city runs slowly. Full always keeps the mirror
              reflections and big water. Light never uses them: pick it if My city still lags.
            </p>
          </div>
        </Section>

        <Section title="Calendar" description="How the calendar starts out. You can still switch view any time with 1, 2 or 3.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Week starts on" value={String(weekStartsOn)} onChange={(e) => update({ weekStartsOn: e.target.value === '0' ? 0 : 1 })}>
              <option value="1">Monday</option>
              <option value="0">Sunday</option>
            </Select>
            <Select label="Opens in" value={calendarView} onChange={(e) => update({ calendarView: e.target.value as CalendarView })}>
              {CALENDAR_VIEWS.map((v) => <option key={v} value={v}>{VIEW_LABELS[v]}</option>)}
            </Select>
          </div>
        </Section>

        <Section title="Dashboard" description="Choose what the dashboard shows.">
          <Check label="Your line and skyline" hint="The metro line of stages, the quick facts under it, and the skyline of buildings." checked={dashboard.stats} onChange={(v) => update({ dashboard: { ...dashboard, stats: v } })} />
          <Check label="Deadlines board" checked={dashboard.deadlines} onChange={(v) => update({ dashboard: { ...dashboard, deadlines: v } })} />
          <Check label="Coming up board (reminders)" checked={dashboard.upcoming} onChange={(v) => update({ dashboard: { ...dashboard, upcoming: v } })} />
        </Section>

        <Section title="Board columns" description="Hide the stages you do not use. Hidden columns keep their applications; they just are not shown on the board.">
          <div className="grid gap-3 sm:grid-cols-2">
            {APPLICATION_STATUSES.map((s) => (
              <Check
                key={s} label={STATUS_LABELS[s]} checked={!boardHidden.includes(s)}
                onChange={(visible) => update({ boardHidden: visible ? boardHidden.filter((x) => x !== s) : [...boardHidden, s] })}
              />
            ))}
          </div>
        </Section>

        <Section title="Your data" description="Download everything you have saved as a CSV file that opens in Excel or Google Sheets. Your data is yours to keep.">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary" disabled={!applications.data}
              onClick={() => applications.data && downloadText(`career-city-applications-${stamp}.csv`, applicationsToCsv(applications.data))}
            ><Download size={16} /> Applications ({applications.data?.length ?? '…'})</Button>
            <Button
              variant="secondary" disabled={!reminders.data || !applications.data}
              onClick={() => reminders.data && applications.data && downloadText(`career-city-reminders-${stamp}.csv`, remindersToCsv(reminders.data, applications.data))}
            ><Download size={16} /> Reminders ({reminders.data?.length ?? '…'})</Button>
          </div>
          {(applications.isError || reminders.isError) && <p role="alert" className="text-sm text-danger">Could not load your data. Try again in a moment.</p>}
        </Section>
      </div>
    </div>
  )
}
