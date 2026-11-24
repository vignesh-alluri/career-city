export const COLORS = {
  void: '#060B1E',
  ground: '#07102A',
  platform: '#0C1638',
  body: '#131C42',
  accent: '#35D9FF',   // cyan
  violet: '#A66BFF',
  // Tokyo night palette taken from the two reference photos:
  blue: '#4D7CFF',     // electric blue facades
  ice: '#E8F0FF',      // white-blue office windows
  warm: '#FFC27A',     // warm windows
  amber: '#FF6A1F',    // highway light trails
  orange: '#FF8A3D',
  red: '#FF3B4E',      // aviation lights on tall roofs
  pink: '#FF3D9A',     // neon magenta
  tower: '#6C5CFF',    // lit tower body
  vermilion: '#E8392C', // torii gates and paper lanterns
  lantern: '#FF3B2E',
} as const

/**
 * The pixel colours a lit window can have. A window's `tone` is an index into this list;
 * the extra index WINDOW_COLORS.length means "the district's own colour".
 */
export const WINDOW_COLORS = [
  '#E8F0FF', // 0 white-blue
  '#4D8BFF', // 1 electric blue
  '#35D9FF', // 2 sky cyan
  '#FF3D9A', // 3 magenta
  '#FF8AC0', // 4 light pink
  '#FF8A3D', // 5 orange
  '#FFD07A', // 6 warm gold
  '#A66BFF', // 7 violet
] as const

/** Very dark body colours. Each building leans one way, so whole blocks glow blue, magenta or orange like the photo. */
export const BODY_TINTS = {
  blue: '#101A3E',
  magenta: '#2A1034',
  orange: '#2A1612',
  concrete: '#26324F', // plain grey-blue Japanese office and apartment blocks, as in the rainy-street reference
  mixed: '#13182F',
} as const
