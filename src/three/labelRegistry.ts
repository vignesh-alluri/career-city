import type { DistrictId } from '@/types'

/**
 * The HTML label elements, by district. The page's <DistrictLabels> adds each element when it mounts, and the
 * <LabelProjector> inside the 3D scene moves them every frame. It is a plain Map on purpose (not React state): positions change
 * every frame while the camera flies, and re-rendering React 60 times a second would be wasteful.
 */
export const labelElements = new Map<DistrictId, HTMLElement>()
