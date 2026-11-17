import { useState, type MouseEvent } from 'react'
import { GithubIcon, LinkedinIcon } from '@/components/icons/BrandIcons'
import { Container } from '@/components/ui/Container'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { copyToClipboard, getEmail } from '@/lib/email'
import { scrollToId, scrollToTop } from '@/lib/scroll'

const pad = (n: number) => n.toString().padStart(2, '0')

function FooterHeading({ children }: { children: string }) {
  return <h2 className="mb-4 label text-fg-subtle">{children}</h2>
}

const linkClass =
  'link-underline pb-0.5 text-sm text-fg-muted transition-[color,background-size] hover:text-fg'

export function SiteFooter() {
  const [copied, setCopied] = useState(false)

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
    scrollToId(id)
  }

  return (
    <footer className="border-t border-line">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="font-display text-headline text-fg">
              {site.name.split(' ')[0]}
              <br />
              <em className="text-fg-muted">{site.name.split(' ').slice(1).join(' ')}</em>
            </p>
            <p className="mt-6 label text-fg-subtle">{site.location.coordinates}</p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <FooterHeading>Index</FooterHeading>
            <ul className="space-y-2">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => onSectionClick(e, section.id)}
                    className={linkClass}
                  >
                    <span className="mr-2 font-mono text-[0.625rem] text-fg-subtle">
                      {pad(i + 1)}
                    </span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <FooterHeading>Elsewhere</FooterHeading>
            <ul className="space-y-2">
              <li>
                <a
                  href={site.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <LinkedinIcon className="size-3.5" /> LinkedIn
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => void onCopyEmail()}
                  className={`${linkClass} text-left`}
                >
                  {copied ? 'Email copied' : 'Copy email'}
                </button>
                <output aria-live="polite" className="sr-only">
                  {copied ? 'Email address copied to clipboard' : ''}
                </output>
              </li>
              <li>
                <a
                  href={site.links.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <GithubIcon className="size-3.5" /> Source
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <FooterHeading>Colophon</FooterHeading>
            <p className="text-sm leading-relaxed text-fg-subtle">
              Set in Instrument Serif, Geist and Geist Mono. Built with React, TypeScript and
              Tailwind.
            </p>
            <a href="/.well-known/security.txt" className={`${linkClass} mt-3 inline-block`}>
              security.txt
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-6 label text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {__BUILD_DATE__.slice(0, 4)} {site.name}
          </p>
          <p className="tabular-nums">
            v{__APP_VERSION__} · build {__BUILD_SHA__} · {__BUILD_DATE__}
          </p>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              scrollToTop()
            }}
            className="hover:text-fg"
          >
            Back to top ↑
          </a>
        </div>
      </Container>
    </footer>
  )
}
