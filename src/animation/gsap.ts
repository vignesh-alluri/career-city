import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger) // plugins must be registered once before use
export { gsap, ScrollTrigger }
