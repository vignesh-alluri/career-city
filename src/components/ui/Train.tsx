/** A little train made of CSS (see .train and .car in globals.css). Decorative, so hidden from screen readers by whoever places it. */
export function TrainGlyph({ cars = 4 }: { cars?: number }) {
  return <span className="train">{Array.from({ length: cars }, (_, i) => <span key={i} className="car" />)}</span>
}
