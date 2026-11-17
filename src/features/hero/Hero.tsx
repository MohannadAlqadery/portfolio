import { ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Kbd } from '@/components/ui/Kbd'
import { StatusDot } from '@/components/ui/StatusDot'
import { hero, heroQuery, heroResult } from '@/content/hero'
import { site } from '@/content/site'
import { modKeyLabel } from '@/lib/platform'
import { scrollToId } from '@/lib/scroll'
import { QueryConsole } from './QueryConsole'

export function Hero() {
  const [firstName, ...rest] = site.name.split(' ')
  const [modKey] = useState(modKeyLabel)

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Dot grid that fades out toward the edges, centred behind the console. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-dotgrid [mask-image:radial-gradient(ellipse_70%_60%_at_75%_65%,black,transparent_75%)] opacity-60"
      />

      <Container className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-center gap-12 py-12 md:gap-16 md:py-16">
        <div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 label text-fg-subtle">
            <span>{site.location.coordinates}</span>
            <span aria-hidden="true">/</span>
            <span>
              {site.location.city}, {site.location.country}
            </span>
          </p>
          <h1 id="hero-title" className="mt-5 font-display text-display text-fg">
            {firstName} <em className="text-fg-muted">{rest.join(' ')}</em>
          </h1>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="space-y-8 lg:col-span-5">
            <p className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface/60 px-2.5 py-1.5 label text-fg-muted">
              <StatusDot pulse />
              {hero.status}
            </p>
            <p className="max-w-md text-lg leading-relaxed text-pretty text-fg-muted">
              {hero.intro}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink
                href="#cases"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId('cases')
                }}
              >
                Read the case files
                <ArrowDown aria-hidden="true" className="size-3.5" />
              </ButtonLink>
              <p className="hidden items-center gap-1.5 text-sm text-fg-subtle sm:flex">
                or press <Kbd>{modKey}</Kbd>
                <Kbd>K</Kbd>
              </p>
            </div>
          </div>

          <QueryConsole query={heroQuery} result={heroResult} className="lg:col-span-7" />
        </div>
      </Container>
    </section>
  )
}
