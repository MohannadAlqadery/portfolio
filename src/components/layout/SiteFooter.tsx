import { ArrowUp, Check, Mail } from 'lucide-react'
import { useState, type MouseEvent, type ReactNode } from 'react'
import { LinkedinIcon } from '@/components/icons/BrandIcons'
import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { NightShiftCityLoader } from '@/features/night-city/NightShiftCityLoader'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'
import { copyToClipboard, getEmail } from '@/lib/email'
import { goToSection, scrollToTop } from '@/lib/scroll'

const pad = (n: number) => n.toString().padStart(2, '0')

function FooterHeading({ children }: { children: string }) {
  return <h2 className="mb-4 label text-fg-subtle">{children}</h2>
}

const linkClass =
  'group inline-flex items-center gap-2.5 py-1 text-sm text-fg-muted transition-colors hover:text-fg'

/** Fixed-width icon slot so every "Elsewhere" label lines up. */
function IconSlot({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-sm border border-line text-fg-subtle transition-colors group-hover:border-line-strong group-hover:text-fg [&_svg]:size-3.5',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SiteFooter() {
  const [copied, setCopied] = useState(false)
  const [firstName, ...rest] = site.name.split(' ')

  const onCopyEmail = async () => {
    const ok = await copyToClipboard(getEmail())
    if (!ok) {
      window.location.assign(`mailto:${getEmail()}`)
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const onSectionClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    goToSection(id)
  }

  return (
    <footer className="border-t border-line">
      <Container className="pt-14 pb-[max(3.5rem,calc(env(safe-area-inset-bottom)+2rem))] md:pt-20 md:pb-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-12 md:gap-8">
          <div className="col-span-2 md:col-span-6">
            <p className="font-display text-5xl leading-[0.95] text-fg md:text-headline">
              {firstName}
              <br />
              <em className="text-fg-muted">{rest.join(' ')}</em>
            </p>
            <p className="mt-5 label text-fg-subtle">{site.role} · REACH Digital</p>
            <p className="mt-2 flex items-center gap-2 label text-fg-subtle">
              <span
                aria-hidden="true"
                className="size-1.5 animate-pulse-dot rounded-full bg-signal text-signal"
              />
              Based in {site.location.city}, {site.location.country}
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <FooterHeading>Index</FooterHeading>
            <ul className="space-y-1">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`/#${section.id}`}
                    onClick={(e) => onSectionClick(e, section.id)}
                    className="inline-flex items-baseline gap-2.5 py-1 text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    <span className="font-mono text-[0.625rem] text-fg-subtle">{pad(i + 1)}</span>
                    {section.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/notes"
                  className="inline-flex items-baseline gap-2.5 py-1 text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  <span className="font-mono text-[0.625rem] text-fg-subtle">✎</span>
                  Field notes
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <FooterHeading>Elsewhere</FooterHeading>
            <ul className="space-y-1.5">
              <li>
                <a
                  href={site.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <IconSlot>
                    <LinkedinIcon />
                  </IconSlot>
                  LinkedIn
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <button type="button" onClick={() => void onCopyEmail()} className={linkClass}>
                  <IconSlot className={cn(copied && 'border-signal/50 text-signal')}>
                    {copied ? <Check /> : <Mail />}
                  </IconSlot>
                  <span className={cn(copied && 'text-signal')}>
                    {copied ? 'Copied' : 'Copy email'}
                  </span>
                </button>
                <output aria-live="polite" className="sr-only">
                  {copied ? 'Email address copied to clipboard' : ''}
                </output>
              </li>
            </ul>
          </div>
        </div>

        {/* The night-shift city: its buildings stand on the line above the bottom bar. */}
        <NightShiftCityLoader className="mt-16 h-[19rem] md:mt-20 md:h-[23rem]" />

        {/*
          Phone: [© · back to top] / updated. Desktop: © | updated | back to top.
          Version and build SHA stay out of sight but are inspectable on the element.
        */}
        <div
          data-version={__APP_VERSION__}
          data-build={__BUILD_SHA__}
          className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-t border-line pt-6 label text-fg-subtle md:grid-cols-3"
        >
          <p className="md:order-1">
            © {__BUILD_DATE__.slice(0, 4)} {site.name}
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 justify-self-end transition-colors hover:text-fg md:order-3"
          >
            Back to top
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-sm border border-line transition-colors group-hover:border-line-strong"
            >
              <ArrowUp className="size-3.5" />
            </span>
          </button>
          <p className="col-span-2 md:order-2 md:col-span-1 md:text-center">
            Updated <time dateTime={__BUILD_DATE__}>{formatMonth(__BUILD_DATE__.slice(0, 7))}</time>
          </p>
        </div>
      </Container>
    </footer>
  )
}
