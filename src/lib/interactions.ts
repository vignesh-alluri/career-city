/**
 * Two small effects for the whole app, driven by ONE listener each (not one per button):
 *  - click ripple: clicking anything marked data-ripple sends two glass rings spreading from the click point.
 *    Mark the element with data-ripple="light" for a white ripple (used on the pink buttons).
 *  - cursor glow: the page glow and any element marked data-spotlight follow the mouse.
 * The elements need `position: relative; overflow: hidden` so the ripple is clipped to their shape.
 * Both effects are skipped for visitors who prefer reduced motion.
 */
export function installInteractions(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  document.addEventListener('pointerdown', (e) => {
    if (reduceMotion.matches || e.button !== 0) return
    const target = (e.target as Element | null)?.closest<HTMLElement>('[data-ripple]')
    if (!target || (target as HTMLButtonElement).disabled) return
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 3
    for (const className of ['ripple-wave', 'ripple-wave ripple-wave--inner']) {
      const wave = document.createElement('span')
      wave.className = className
      wave.style.width = wave.style.height = `${size}px`
      wave.style.left = `${e.clientX - rect.left - size / 2}px`
      wave.style.top = `${e.clientY - rect.top - size / 2}px`
      target.appendChild(wave)
      wave.addEventListener('animationend', () => wave.remove(), { once: true })
    }
  })

  let frame = 0
  document.addEventListener('pointermove', (e) => {
    if (reduceMotion.matches || frame) return // at most one update per screen refresh
    const { clientX, clientY } = e
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-spotlight]')
    frame = requestAnimationFrame(() => {
      frame = 0
      document.documentElement.style.setProperty('--gx', `${clientX}px`)
      document.documentElement.style.setProperty('--gy', `${clientY}px`)
      if (el) {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${clientX - r.left}px`)
        el.style.setProperty('--my', `${clientY - r.top}px`)
      }
    })
  }, { passive: true })
}
