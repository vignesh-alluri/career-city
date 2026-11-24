import { useEffect, useRef, useState, type RefObject } from 'react'

/** Tells us whether an element is on screen, so the 3D loop can pause when nobody can see it. */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}
