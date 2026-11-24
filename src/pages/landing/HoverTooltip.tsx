import { useLayoutEffect, useEffect, useRef } from 'react'
import { DISTRICT_BY_ID } from '@/config/districts'
import { useCityStore } from '@/store/cityStore'

/** Small tooltip that follows the pointer while a district is hovered. Position is set directly on the element, not through React state. */
export function HoverTooltip() {
  const hovered = useCityStore((s) => s.hovered)
  const selected = useCityStore((s) => s.selected)
  const ref = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const info = hovered && hovered !== selected ? DISTRICT_BY_ID[hovered] : null

  const place = () => {
    if (ref.current) ref.current.style.transform = `translate(${pointer.current.x + 16}px, ${pointer.current.y + 16}px)`
  }

  useEffect(() => {
    const move = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY }; place() }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useLayoutEffect(place, [info?.id])

  if (!info) return null
  return (
    <div ref={ref} className="glass pointer-events-none fixed top-0 left-0 z-40 max-w-60 rounded-control px-3 py-2 text-sm">
      <p className="font-medium">{info.name}</p>
      <p className="text-xs text-muted">Click to explore</p>
    </div>
  )
}
