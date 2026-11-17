import { ArrowUpRight, Check, Copy, Eye, Mail } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LocalClock } from '@/components/layout/LocalClock'
import { Section } from '@/components/layout/Section'
import { Button, ButtonLink } from '@/components/ui/Button'
import { site } from '@/content/site'
import { copyToClipboard, getEmail } from '@/lib/email'

function ChannelRow({
  label,
  value,
  actions,
}: {
  label: string
  value: ReactNode
  actions: ReactNode
}) {
  return (
    <li className="grid gap-4 border-b border-line py-6 md:grid-cols-12 md:items-center md:gap-8">
      <span className="label text-fg-subtle md:col-span-2">{label}</span>
      <span className="min-w-0 font-display text-3xl break-words text-fg md:col-span-6 md:text-4xl">
        {value}
      </span>
      <span className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">{actions}</span>
    </li>
  )
}

export function ContactSection() {
  const [email, setEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    const address = email ?? getEmail()
    setEmail(address)
    if (await copyToClipboard(address)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Section
      id="contact"
      title={
        <>
          Open a <em className="text-fg-muted">channel</em>
        </>
      }
      intro="Security conversations, questions about something on this page, or a hello from another analyst. My inbox is open."
    >
      <ul className="border-t border-line">
        <ChannelRow
          label="Email"
          value={
            email ? (
              <span className="select-all">{email}</span>
            ) : (
              <span className="text-fg-subtle">
                <span aria-hidden="true">••••••••</span>@gmail.com
                <span className="sr-only">Address hidden until revealed</span>
              </span>
            )
          }
          actions={
            email ? (
              <>
                <Button onClick={() => void onCopy()}>
                  {copied ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : (
                    <Copy aria-hidden="true" className="size-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <ButtonLink href={`mailto:${email}`} variant="primary">
                  <Mail aria-hidden="true" className="size-3.5" />
                  Write
                </ButtonLink>
              </>
            ) : (
              <Button onClick={() => setEmail(getEmail())}>
                <Eye aria-hidden="true" className="size-3.5" />
                Reveal address
              </Button>
            )
          }
        />
        <ChannelRow
          label="LinkedIn"
          value="mohannad-alqadery"
          actions={
            <ButtonLink href={site.links.linkedin} external>
              Open profile
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </ButtonLink>
          }
        />
      </ul>
      <output aria-live="polite" className="sr-only">
        {copied ? 'Email address copied to clipboard' : ''}
      </output>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <LocalClock />
        <p className="label text-fg-subtle">UTC+4 · Replies in English or Arabic</p>
      </div>
    </Section>
  )
}
