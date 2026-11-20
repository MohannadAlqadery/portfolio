import { ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { StatusDot } from '@/components/ui/StatusDot'
import { SignalFieldLoader } from '@/features/signal-field/SignalFieldLoader'
import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'
import { copyToClipboard, getEmail, openMailto } from '@/lib/email'
import { goToSection, scrollToTop } from '@/lib/scroll'

const linkClass = 'py-1 text-sm text-fg-muted transition-colors hover:text-fg'

function FooterHeading({ children }: { children: string }) {
  return <h2 className="mb-3 label text-fg-subtle">{children}</h2>
}

/**
 * The footer is the last scene: an index and contact band, a big sign-off, then the "traffic"
 * signal field (the name as a live dot matrix) and a status strip. As it scrolls into view its contents rise
 * from behind the page's edge, as if the page were lifting off them (CSS scroll timeline).
 */
export function SiteFooter() {
  const [copied, setCopied] = useState(false)
  const firstName = site.name.split(' ')[0] ?? site.name

  const onCopyEmail = async () => {
    if (!(await copyToClipboard(getEmail()))) {
      openMailto(`mailto:${getEmail()}`)
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
    // The top 4rem (inside the padding) fades out, so contents rising past the edge dissolve
    // instead of being sliced.
    <footer className="overflow-hidden bg-canvas [mask-image:linear-gradient(to_bottom,transparent,black_4rem)] [view-timeline-name:--footer]">
      <div className="footer-reveal">
        <Container className="pt-20">
          <div className="grid gap-x-8 gap-y-8 md:grid-cols-12 md:gap-y-10">
            <div className="md:col-span-4">
              <p className="font-display text-2xl font-bold tracking-tight text-fg">
                {firstName}
                <span className="text-fg-subtle">.</span>
              </p>
              <p className="mt-2 text-sm text-fg-muted">
                SOC analyst
                <br />
                on the blue team.
              </p>
            </div>

            <nav aria-label="Footer" className="md:col-span-5">
              <FooterHeading>Explore</FooterHeading>
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`/#${section.id}`}
                      onClick={(e) => onSectionClick(e, section.id)}
                      className={linkClass}
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to="/notes" className={linkClass}>
                    Field notes
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="md:col-span-3">
              <FooterHeading>Get in touch</FooterHeading>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => void onCopyEmail()}
                    className={cn(linkClass, 'inline-flex items-center gap-2', copied && 'text-fg')}
                  >
                    {copied ? 'Copied' : 'Copy email'}
                    {copied ? (
                      <Check aria-hidden="true" className="size-3.5" />
                    ) : (
                      <Copy aria-hidden="true" className="size-3.5" />
                    )}
                  </button>
                  <output aria-live="polite" className="sr-only">
                    {copied ? 'Email address copied to clipboard' : ''}
                  </output>
                </li>
                <li>
                  <a
                    href={site.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(linkClass, 'inline-flex items-center gap-1.5')}
                  >
                    LinkedIn
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex items-end justify-between gap-6 pb-8 md:mt-20">
            <p className="font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-none font-bold tracking-[-0.03em] text-fg">
              See you around.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="group mb-1 inline-flex shrink-0 items-center gap-2 label text-fg-subtle transition-colors hover:text-fg"
            >
              Back to top
              <ArrowUp
                aria-hidden="true"
                className="size-3.5 transition-transform group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </Container>

        {/* The signal field: the name as a live dot matrix, with traffic streaming through it. */}
        <Container>
          <div className="relative h-[clamp(8.5rem,26vw,24rem)] border-y border-line">
            <SignalFieldLoader />
          </div>
        </Container>

        {/* Status strip: the one place the green "live" light belongs in the footer. */}
        <Container
          data-version={__APP_VERSION__}
          data-build={__BUILD_SHA__}
          className="grid gap-x-6 gap-y-2 py-5 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))] label text-fg-subtle md:grid-cols-3 md:items-center md:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <p className="flex items-center gap-2">
            <StatusDot pulse />
            All systems normal
          </p>
          <p className="md:text-center">Finally, some traffic on my site.</p>
          <p className="md:text-right">
            © {__BUILD_DATE__.slice(0, 4)} {site.name} · build {__BUILD_SHA__} ·{' '}
            <time dateTime={__BUILD_DATE__}>{formatMonth(__BUILD_DATE__.slice(0, 7))}</time>
          </p>
        </Container>
      </div>
    </footer>
  )
}
