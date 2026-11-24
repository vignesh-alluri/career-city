import { useMemo } from 'react'
import { COLORS } from '../config/palette'
import { toriiParts } from '../utils/toriiLayout'
import { InstancedBoxes } from './InstancedBoxes'

/** A vermilion torii gate in front of each district: two pillars, a lower beam and a dark top beam. */
export function ToriiGates() {
  const { pillars, beams, tops } = useMemo(toriiParts, [])
  return (
    <group>
      <InstancedBoxes items={pillars} color={COLORS.vermilion} />
      <InstancedBoxes items={beams} color={COLORS.vermilion} />
      <InstancedBoxes items={tops} color="#14101C" />
    </group>
  )
}
