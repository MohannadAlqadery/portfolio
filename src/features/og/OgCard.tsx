import { credentials } from '@/content/credentials'
import { heroScene } from '@/content/hero'
import { site } from '@/content/site'
import { AsciiMonogram } from '@/features/hero/AsciiMonogram'

/**
 * 1200×630 social preview card, rendered at /#og and captured to public/og.png by
 * `npm run og`. Built from the same fonts, tokens and pieces as the site's hero.
 */
export default function OgCard() {
  const [first, second] = heroScene.headline
  const certs = credentials
    .filter((c) => c.featured)
    .map((c) => c.code)
    .join(' · ')

  return (
    <div
      id="og-card"
      className="relative flex h-[630px] w-[1200px] overflow-hidden bg-canvas px-16 py-14"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dotgrid [mask-image:radial-gradient(ellipse_55%_70%_at_78%_50%,black,transparent_75%)] opacity-60"
      />

      <div className="relative flex flex-1 flex-col justify-between">
        <p className="label text-[15px] text-fg-subtle">
          {site.location.coordinates} / {site.location.city}, {site.location.country}
        </p>

        <div>
          <p className="font-display text-[150px] leading-[0.84] font-extrabold tracking-[-0.02em] text-fg uppercase font-stretch-[72%]">
            <span className="text-[0.55em] font-light text-fg-subtle font-stretch-100%">[ </span>
            {first}
            <br />
            {second}
            <span className="text-[0.55em] font-light text-fg-subtle font-stretch-100%"> ]</span>
          </p>
          <p className="mt-8 font-display text-[34px] font-semibold tracking-tight text-fg">
            {site.name}
            <span className="text-fg-subtle"> · SOC L1 · REACH Digital</span>
          </p>
        </div>

        <div className="flex items-center justify-between pr-10 font-mono text-[17px]">
          <span className="text-fg-muted">{heroScene.tagline}</span>
          <span className="tracking-wide text-fg-subtle">{certs}</span>
        </div>
      </div>

      <div className="relative flex items-center">
        <AsciiMonogram className="w-[300px] -rotate-3" />
      </div>
    </div>
  )
}
