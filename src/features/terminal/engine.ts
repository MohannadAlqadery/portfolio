/**
 * The terminal's brain: scripted answers built from the site's own content. No AI and no
 * network; plain commands (`certs`) and loose questions ("what tools do you use?") both map to
 * the same handful of intents. Pure, so it is unit tested without a DOM.
 */
import { cases } from '@/content/cases'
import { credentials } from '@/content/credentials'
import { education } from '@/content/education'
import { sections, type SectionId } from '@/content/sections'
import { site } from '@/content/site'
import { toolkit } from '@/content/toolkit'
import { formatMonth } from '@/lib/dates'

export type Tone = 'plain' | 'muted' | 'signal' | 'warn'
/** `indent` sets a line under the one before it (details of a list item). */
export type Line = { text: string; tone?: Tone; indent?: boolean }

export type Action =
  | { type: 'goto'; id: SectionId }
  | { type: 'navigate'; path: string }
  | { type: 'theme' }
  | { type: 'clear' }
  | { type: 'close' }
  | { type: 'reveal-email' }

export type Reply = { lines: Line[]; action?: Action }

/** Shown as quick-pick chips before anything has been typed. */
export const SUGGESTIONS = [
  'What do you do?',
  'Which certifications?',
  'What tools do you use?',
  'How can I reach you?',
] as const

const muted = (text: string): Line => ({ text, tone: 'muted' })
const signal = (text: string): Line => ({ text, tone: 'signal' })
const warn = (text: string): Line => ({ text, tone: 'warn' })

const HELP: Line[] = [
  { text: 'Commands (or just ask in plain words):' },
  muted('  whoami      who I am and what I do'),
  muted('  certs       certifications, with where to verify them'),
  muted('  cases       roles, as case files'),
  muted('  tools [x]   the toolkit, optionally filtered (tools kql)'),
  muted('  study       the degree behind it'),
  muted('  contact     how to reach me'),
  muted('  goto <x>    jump to a section (goto toolkit)'),
  muted('  notes       open the field notes'),
  muted('  theme       switch light / dark'),
  muted('  clear       clear the screen · exit  close'),
  muted('Tip: the ` key opens and closes this terminal anywhere on the site.'),
]

const host = (url: string) => new URL(url).host

function whoami(): Reply {
  const current = cases.find((c) => c.status === 'active')
  return {
    lines: [
      signal(`${site.name}, ${site.role}`),
      { text: current ? `${current.title} at ${current.org}, ${current.location}.` : site.role },
      muted(current?.summary ?? ''),
      muted('Focus: threat detection · investigation · incident response.'),
    ].filter((line) => line.text !== ''),
  }
}

function certs(): Reply {
  const lines: Line[] = []
  for (const c of credentials) {
    const when = c.issued ? formatMonth(c.issued.slice(0, 7)) : String(c.year)
    lines.push({ text: `${c.code} · ${c.name}` })
    lines.push({
      text: `${c.issuer} · ${when}${c.verifyUrl ? ` · verify at ${host(c.verifyUrl)}` : ''}`,
      tone: 'muted',
      indent: true,
    })
  }
  return { lines }
}

function caseList(): Reply {
  return {
    lines: [
      ...cases.flatMap((c) => [
        {
          text: `${c.id}  ${c.title}`,
          tone: c.status === 'active' ? ('signal' as const) : ('plain' as const),
        },
        {
          text: `${c.org} · ${formatMonth(c.start)} → ${c.end ? formatMonth(c.end) : 'now'}`,
          tone: 'muted' as const,
          indent: true,
        },
      ]),
      muted('Run `goto cases` to open them.'),
    ],
  }
}

function tools(filter: string): Reply {
  const needle = filter.trim().toLowerCase()
  if (needle) {
    const hits = toolkit.flatMap((area) =>
      area.items
        .filter((item) => item.name.toLowerCase().includes(needle))
        .map((item) => ({ area: area.title, item })),
    )
    if (hits.length === 0) return { lines: [warn(`No tool matching "${filter.trim()}".`)] }
    return {
      lines: hits.map(({ area, item }) => ({
        text: `${item.name} · ${area}${item.core ? ' · used on shift' : ''}${item.level === 'basics' ? ' · still building' : ''}`,
      })),
    }
  }
  return {
    lines: [
      ...toolkit.map((area) => {
        const core = area.items.filter((i) => i.core).map((i) => i.name)
        const rest = area.items.filter((i) => !i.core).map((i) => i.name)
        return { text: `${area.title}: ${[...core, ...rest].join(', ')}` }
      }),
      muted('Used on shift come first. Try `tools splunk`.'),
    ],
  }
}

function study(): Reply {
  return {
    lines: [
      { text: education.degree },
      muted(
        `${education.school} · ${formatMonth(education.start)} → ${formatMonth(education.end)} · ${education.result}`,
      ),
      muted(education.coursework.map((c) => c.name).join(' · ')),
    ],
  }
}

function contact(): Reply {
  return {
    lines: [
      { text: 'Email: hidden from scrapers. Run `email` to reveal it.' },
      { text: `LinkedIn: ${site.links.linkedin.replace(/^https:\/\/(www\.)?/, '')}` },
      muted('Or use the contact form: `goto contact`.'),
    ],
  }
}

function findSection(word: string): SectionId | undefined {
  const w = word.toLowerCase().replace(/^#/, '')
  const aliases: Record<string, SectionId> = {
    about: 'profile',
    experience: 'timeline',
    education: 'timeline',
    skills: 'toolkit',
    tools: 'toolkit',
    certs: 'credentials',
    work: 'cases',
  }
  return sections.find((s) => s.id === w || s.label.toLowerCase() === w)?.id ?? aliases[w]
}

/** Intents tried in order against plain-language input. */
const INTENTS: { test: RegExp; reply: () => Reply }[] = [
  { test: /\b(who|about you|what do you do|your (job|role)|introduce)\b/, reply: whoami },
  { test: /\b(cert|certif|sc-?200|ejpt|esoc|credential|qualif)/, reply: certs },
  { test: /\b(tool|stack|skill|siem|kql|splunk|sentinel|use)\b/, reply: () => tools('') },
  { test: /\b(experience|job|work|role|case|career|employ)/, reply: caseList },
  { test: /\b(degree|study|studied|universit|education|school|course)/, reply: study },
  { test: /\b(contact|reach|email|mail|linkedin|hire|talk|message)\b/, reply: contact },
]

export function respond(raw: string): Reply {
  const input = raw.trim()
  if (!input) return { lines: [] }
  const [command = '', ...args] = input.split(/\s+/)
  const cmd = command.toLowerCase()
  const rest = args.join(' ')

  switch (cmd) {
    case 'help':
    case '?':
    case 'man':
      return { lines: HELP }
    case 'whoami':
      return whoami()
    case 'certs':
    case 'certifications':
      return certs()
    case 'cases':
      return caseList()
    case 'tools':
    case 'toolkit':
    case 'skills':
      return tools(rest)
    case 'study':
    case 'education':
      return study()
    case 'contact':
      return contact()
    case 'email':
      return { lines: [muted('Revealing address…')], action: { type: 'reveal-email' } }
    case 'notes':
      return {
        lines: [muted('Opening field notes…')],
        action: { type: 'navigate', path: '/notes' },
      }
    case 'theme':
      return { lines: [muted('Switching theme…')], action: { type: 'theme' } }
    case 'clear':
    case 'cls':
      return { lines: [], action: { type: 'clear' } }
    case 'exit':
    case 'quit':
    case 'close':
      return { lines: [muted('Session closed.')], action: { type: 'close' } }
    case 'ls':
      return { lines: [{ text: sections.map((s) => s.id).join('  ') }, muted('notes')] }
    case 'goto':
    case 'cd':
    case 'open': {
      if (cmd === 'open' && /^notes?$/i.test(rest)) {
        return {
          lines: [muted('Opening field notes…')],
          action: { type: 'navigate', path: '/notes' },
        }
      }
      const id = findSection(rest)
      return id
        ? { lines: [muted(`Jumping to ${id}…`)], action: { type: 'goto', id } }
        : { lines: [warn(`No section "${rest}". Try: ${sections.map((s) => s.id).join(', ')}.`)] }
    }
    case 'sudo':
      return { lines: [warn('Nice try. This attempt has been logged and escalated to L2.')] }
    case 'rm':
      return { lines: [warn('Blocked by policy. Incident opened: CASE-0000.')] }
    case 'hi':
    case 'hello':
    case 'hey':
      return { lines: [{ text: 'Hello. Ask me anything about my work, or type `help`.' }] }
    default:
      break
  }

  const lower = input.toLowerCase()
  const intent = INTENTS.find(({ test }) => test.test(lower))
  if (intent) return intent.reply()

  return {
    lines: [
      warn(`command not found: ${command}`),
      muted('This is a scripted terminal, not an AI. Type `help`, or try a question below.'),
    ],
  }
}
