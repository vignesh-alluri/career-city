import type { ReactNode } from 'react'
import { useCityStore } from '@/store/cityStore'
import { useSideLayout } from '@/hooks/useMediaQuery'
import { hasWebGL } from '@/lib/webgl'
import { cn } from '@/lib/utils'

/**
 * One full-screen story section. Without WebGL the sections are simply always visible, as plain page content.
 * With the city, only the section currently on screen is shown, so text never competes with the camera move.
 */
export function SectionFrame({ index, children }: { index: number; children: ReactNode }) {
  const side = useSideLayout()
  const webgl = hasWebGL()
  const visible = useCityStore((s) => !webgl || (s.mode === 'scroll' && s.activeSection === index))

  return (
    <section data-section className={cn('pointer-events-none flex h-svh snap-start px-6 md:px-[7vw]', side || !webgl ? 'items-center' : 'items-end pb-16')}>
      <div className={cn('max-w-lg transition-opacity duration-500', visible ? 'pointer-events-auto opacity-100' : 'opacity-0')} inert={!visible}>
        {children}
      </div>
    </section>
  )
}
