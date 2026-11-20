import { ArrowUpRight, Check, Copy, Eye, Mail } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { LinkedinIcon } from '@/components/icons/BrandIcons'
import { LocalClock } from '@/components/layout/LocalClock'
import { Section } from '@/components/layout/Section'
import { Button, ButtonLink } from '@/components/ui/Button'
import { site } from '@/content/site'
import { cn } from '@/lib/cn'
import { buildMailto, copyToClipboard, getEmail, openMailto } from '@/lib/email'

const TOPICS = [
  'A security question',
  'About a write-up',
  'Just saying hello',
  'Something else',
] as const

const fieldClass =
  'w-full border-0 border-b border-line-strong bg-transparent px-0 py-3 text-fg transition-colors placeholder:text-fg-subtle focus:border-fg focus:outline-none focus-visible:outline-none'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label text-fg-subtle">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Left column: the address (revealed on request), LinkedIn and local time. */
function Channels() {
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
    <div className="space-y-10">
      <div>
        <p className="label text-fg-subtle">Email</p>
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight break-all text-fg md:text-3xl">
          {email ? (
            <span className="select-all">{email}</span>
          ) : (
            <span className="text-fg-subtle">
              <span aria-hidden="true">••••••••</span>@gmail.com
              <span className="sr-only">Address hidden until revealed</span>
            </span>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {email ? (
            <>
              <Button size="sm" onClick={() => void onCopy()}>
                {copied ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : (
                  <Copy aria-hidden="true" className="size-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <ButtonLink size="sm" href={`mailto:${email}`} variant="solid">
                <Mail aria-hidden="true" className="size-3.5" />
                Write
              </ButtonLink>
            </>
          ) : (
            <Button size="sm" onClick={() => setEmail(getEmail())}>
              <Eye aria-hidden="true" className="size-3.5" />
              Reveal address
            </Button>
          )}
        </div>
        <output aria-live="polite" className="sr-only">
          {copied ? 'Email address copied to clipboard' : ''}
        </output>
      </div>

      <div>
        <p className="label text-fg-subtle">Elsewhere</p>
        <a
          href={site.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-3 inline-flex items-center gap-2 text-fg"
        >
          <LinkedinIcon aria-hidden="true" className="size-4 text-fg-muted" />
          <span className="link-underline pb-0.5">LinkedIn</span>
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </div>

      <div className="space-y-1">
        <LocalClock />
        <p className="label text-fg-subtle">UTC+4 · Replies in English or Arabic</p>
      </div>
    </div>
  )
}

/**
 * Right column: compose a message and open it as a draft in the visitor's mail app. Nothing is
 * sent from the page (no backend, and the CSP allows no form submissions anywhere).
 */
function DraftForm() {
  const id = useId()
  const [name, setName] = useState('')
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [opened, setOpened] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (message.trim().length < 2) {
      setError('Write a few words first, so the draft has something in it.')
      document.getElementById(`${id}-message`)?.focus()
      return
    }
    setError(null)
    openMailto(buildMailto(getEmail(), { name, topic, message }))
    setOpened(true)
  }

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className="space-y-8">
      <p id={`${id}-title`} className="font-display text-xl font-semibold tracking-tight text-fg">
        Draft a message
      </p>

      <Field label="Your name (optional)" htmlFor={`${id}-name`}>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should I call you?"
          className={fieldClass}
        />
      </Field>

      <fieldset>
        <legend className="label text-fg-subtle">What’s it about?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOPICS.map((option) => (
            <label key={option} className="cursor-pointer">
              <input
                type="radio"
                name="topic"
                value={option}
                checked={topic === option}
                onChange={() => setTopic(option)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'inline-flex h-8 items-center rounded-sm border px-3 text-[0.8125rem] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg',
                  topic === option
                    ? 'border-fg bg-fg text-canvas'
                    : 'border-line-strong text-fg-muted hover:border-fg-subtle hover:text-fg',
                )}
              >
                {option}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Message" htmlFor={`${id}-message`}>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A question, a correction, or just hello."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(fieldClass, 'resize-y')}
        />
        {error ? (
          <p id={`${id}-error`} className="mt-2 text-sm text-sev-high">
            {error}
          </p>
        ) : null}
      </Field>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" variant="solid">
          Create email draft
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Button>
        <output
          aria-live="polite"
          className="block max-w-xs text-xs leading-relaxed text-fg-subtle"
        >
          {opened
            ? 'Draft handed to your mail app. If nothing opened, reveal the address and copy it.'
            : 'Nothing is sent from this page: it opens your own mail app with the draft filled in.'}
        </output>
      </div>
    </form>
  )
}

export function ContactSection() {
  return (
    <Section
      id="contact"
      title={
        <>
          Open a <em>channel.</em>
        </>
      }
      intro="Security conversations, questions about something on this page, or a hello from another analyst. My inbox is open."
    >
      <div className="grid gap-14 border-t border-line pt-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Channels />
        </div>
        <div className="lg:col-span-7">
          <DraftForm />
        </div>
      </div>
    </Section>
  )
}
