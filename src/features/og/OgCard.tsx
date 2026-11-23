import { AsciiMonogram } from '@/features/hero/AsciiMonogram'

/**
 * 1200×630 social preview card, rendered at /#og and captured to public/og.png by `npm run og`.
 * Just the mark: the hero's ASCII "MA" card on the page's dark canvas and dot grid, nothing else.
 */
export default function OgCard() {
  return (
    <div
      id="og-card"
      className="relative flex h-[630px] w-[1200px] items-center justify-center overflow-hidden bg-canvas"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dotgrid [mask-image:radial-gradient(ellipse_45%_60%_at_50%_50%,black,transparent_75%)] opacity-60"
      />
      <AsciiMonogram className="relative w-[330px] -rotate-3" />
    </div>
  )
}
