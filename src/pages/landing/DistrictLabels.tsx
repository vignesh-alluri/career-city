import { DISTRICTS } from '@/config/districts'
import { useCityStore } from '@/store/cityStore'
import { DISTRICT_IDS, type DistrictId } from '@/types'
import { labelElements } from '@/three/labelRegistry'

function Label({ id, name, color }: { id: DistrictId; name: string; color: string }) {
  // true while this district is hovered, selected, or is the one the scroll tour is currently on
  const active = useCityStore((s) => s.hovered === id || s.selected === id || (s.mode === 'scroll' && DISTRICT_IDS[s.activeSection - 1] === id))
  return (
    <div
      ref={(el) => { if (el) labelElements.set(id, el); else labelElements.delete(id) }}
      className="absolute top-0 left-0 opacity-0 will-change-transform"
    >
      <div className="relative">
        <div
          className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-ink transition-transform duration-300 select-none"
          style={{ transform: active ? 'scale(1.12)' : 'scale(1)', borderColor: active ? color : undefined }}
        >
          <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 ${active ? 14 : 8}px ${color}` }} />
          {name}
        </div>
        {/* a thin stem pointing down at the district */}
        <span aria-hidden className="absolute top-full left-1/2 h-6 w-px -translate-x-1/2" style={{ background: `linear-gradient(${color}, transparent)` }} />
      </div>
    </div>
  )
}

/**
 * The five district name labels, drawn over the 3D city. Where each one sits is decided by LabelProjector, inside the canvas.
 * Place this inside the same box as the canvas (it fills that box and lets every click pass through).
 */
export function DistrictLabels() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {DISTRICTS.map((d) => <Label key={d.id} id={d.id} name={d.name} color={d.color} />)}
    </div>
  )
}
