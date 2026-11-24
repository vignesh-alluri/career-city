import { TrainGlyph } from '@/components/ui/Train'

/** Shown while the first page's code is still downloading: a train crossing an empty rail. */
export function BootScreen() {
  return (
    <div role="status" className="grid min-h-screen place-items-center bg-void">
      <div className="flex flex-col items-center gap-3">
        <div aria-hidden className="rail w-64 max-w-[80vw] overflow-hidden"><span className="train-loop"><TrainGlyph cars={3} /></span></div>
        <p className="eyebrow">Boarding...</p>
      </div>
    </div>
  )
}
