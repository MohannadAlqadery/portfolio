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

/** `fallback`: nothing matched, so the UI offers the suggestion chips again. */
export type Reply = { lines: Line[]; action?: Action; fallback?: true }

/** Shown as quick-pick chips before anything has been typed. */
export const SUGGESTIONS = [
  'What do you do?',
  'Which certifications?',
  'What tools do you use?',
  'How can I reach you?',
] as const

/** The first thing the terminal says. */
export const WELCOME: Line[] = [
  { text: 'Hi, this is Mohannad’s terminal. Ask about my work in plain words, or type `help`.' },
  {
    text: 'It’s scripted, not AI: every answer comes from this site, and nothing you type leaves your browser.',
    tone: 'muted',
  },
]

const muted = (text: string): Line => ({ text, tone: 'muted' })
const signal = (text: string): Line => ({ text, tone: 'signal' })
const warn = (text: string): Line => ({ text, tone: 'warn' })
const item = (text: string, tone: Tone = 'muted'): Line => ({ text, tone, indent: true })

const HELP: Line[] = [
  { text: 'Ask in plain words, or use a command:' },
  muted('  whoami      who I am and what I do'),
  muted('  certs       my certifications, and where to verify them'),
  muted('  cases       the roles I’ve held, as case files'),
  muted('  tools [x]   my toolkit, optionally filtered (tools kql)'),
  muted('  study       my degree and coursework'),
  muted('  contact     how to reach me'),
  muted('  goto <x>    jump to a section (goto toolkit)'),
  muted('  notes       open the field notes'),
  muted('  theme       switch between light and dark'),
  muted('  clear       clear the screen · exit  close'),
  muted('Tip: the ` key opens and closes this terminal anywhere on the site.'),
]

const host = (url: string) => new URL(url).host
const firstName = site.name.split(' ')[0] ?? site.name

function whoami(): Reply {
  const current = cases.find((c) => c.status === 'active')
  return {
    lines: [
      signal(`I’m ${site.name}, a ${site.role.replace(/Analyst/, 'analyst')}.`),
      ...(current
        ? [
            {
              text: `Right now I’m a ${current.title} at ${current.org.replace(/ LLC$/, '')} in ${current.location}.`,
            },
          ]
        : []),
      ...(current ? [muted(current.summary)] : []),
      muted('I focus on threat detection, investigation and incident response.'),
    ],
  }
}

function certs(): Reply {
  const lines: Line[] = [{ text: 'Here’s what I’m certified in:' }]
  for (const c of credentials) {
    const when = c.issued ? formatMonth(c.issued.slice(0, 7)) : String(c.year)
    lines.push({ text: `${c.code} · ${c.name}` })
    lines.push(
      item(`${c.issuer} · ${when}${c.verifyUrl ? ` · verify at ${host(c.verifyUrl)}` : ''}`),
    )
  }
  lines.push(muted('The verification links are on the cards: `goto credentials`.'))
  return { lines }
}

function caseList(): Reply {
  return {
    lines: [
      { text: 'Where I’ve worked, newest first:' },
      ...cases.flatMap((c) => [
        {
          text: `${c.id}  ${c.title}${c.status === 'active' ? ' (current)' : ''}`,
          tone: c.status === 'active' ? ('signal' as const) : ('plain' as const),
        },
        item(`${c.org} · ${formatMonth(c.start)} → ${c.end ? formatMonth(c.end) : 'now'}`),
      ]),
      muted('Type `goto cases` to open the case files.'),
    ],
  }
}

function tools(filter: string): Reply {
  const needle = filter.trim().toLowerCase()
  if (needle) {
    const hits = toolkit.flatMap((area) =>
      area.items
        .filter((entry) => entry.name.toLowerCase().includes(needle))
        .map((entry) => ({ area: area.title, entry })),
    )
    if (hits.length === 0)
      return {
        lines: [
          warn(`Nothing in my toolkit matches "${filter.trim()}".`),
          muted('Type `tools` to see everything.'),
        ],
      }
    return {
      lines: hits.map(({ area, entry }) => ({
        text: `${entry.name} · ${area}${entry.core ? ' · used on shift' : ''}${entry.level === 'basics' ? ' · still building' : ''}`,
      })),
    }
  }
  return {
    lines: [
      { text: 'What I work with (what I use on shift comes first):' },
      ...toolkit.map((area) => {
        const core = area.items.filter((i) => i.core).map((i) => i.name)
        const rest = area.items.filter((i) => !i.core).map((i) => i.name)
        return item(`${area.title}: ${[...core, ...rest].join(', ')}`, 'plain')
      }),
      muted('Filter it with a word, for example `tools splunk`.'),
    ],
  }
}

function study(): Reply {
  return {
    lines: [
      {
        text: `I studied for a ${education.degree} at ${education.school}, ${education.location}.`,
      },
      muted(
        `${formatMonth(education.start)} → ${formatMonth(education.end)} · ${education.result}`,
      ),
      { text: 'Coursework:' },
      ...education.coursework.map((c) => item(c.name, 'plain')),
    ],
  }
}

function contact(): Reply {
  return {
    lines: [
      { text: 'The best ways to reach me:' },
      item('Email: kept away from scrapers. Type `email` and I’ll show it.', 'plain'),
      item(`LinkedIn: ${site.links.linkedin.replace(/^https:\/\/(www\.)?/, '')}`, 'plain'),
      muted('Or write me a note in the contact form: `goto contact`.'),
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
  {
    test: /\b(are you (an? )?(ai|bot|real|human)|what are you|chatgpt|llm)\b/,
    reply: () => ({
      lines: [
        { text: 'I’m a scripted terminal, not an AI.' },
        muted(
          `${firstName} wrote these answers from this site’s content, and nothing you type is sent anywhere.`,
        ),
      ],
    }),
  },
  {
    test: /\b(thanks|thank you|cheers|thx)\b/,
    reply: () => ({ lines: [{ text: 'Anytime. Type `help` if you want to look around more.' }] }),
  },
  {
    test: /\b(where are you|where do you live|based|located|location)\b/,
    reply: () => ({
      lines: [
        {
          text: `I’m based in ${cases.find((c) => c.status === 'active')?.location ?? 'Abu Dhabi, UAE'}.`,
        },
        muted('Gulf Standard Time (GST, UTC+4).'),
      ],
    }),
  },
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
      return { lines: [{ text: 'Here’s my address:' }], action: { type: 'reveal-email' } }
    case 'notes':
      return {
        lines: [muted('Opening the field notes…')],
        action: { type: 'navigate', path: '/notes' },
      }
    case 'theme':
      return { lines: [muted('Switching the theme…')], action: { type: 'theme' } }
    case 'clear':
    case 'cls':
      return { lines: [], action: { type: 'clear' } }
    case 'exit':
    case 'quit':
    case 'close':
      return { lines: [muted('Closing the terminal. See you around.')], action: { type: 'close' } }
    case 'ls':
      return { lines: [{ text: sections.map((s) => s.id).join('  ') }, muted('notes')] }
    case 'goto':
    case 'cd':
    case 'open': {
      if (cmd === 'open' && /^notes?$/i.test(rest)) {
        return {
          lines: [muted('Opening the field notes…')],
          action: { type: 'navigate', path: '/notes' },
        }
      }
      const id = findSection(rest)
      const label = sections.find((s) => s.id === id)?.label ?? id
      return id
        ? { lines: [muted(`Taking you to ${label}…`)], action: { type: 'goto', id } }
        : {
            lines: [
              warn(`There’s no section called "${rest}".`),
              muted(`Try one of: ${sections.map((s) => s.id).join(', ')}.`),
            ],
          }
    }
    case 'sudo':
      return { lines: [warn('Nice try. This attempt has been logged and escalated to L2.')] }
    case 'rm':
      return { lines: [warn('Blocked by policy. Incident opened: CASE-0000.')] }
    case 'hi':
    case 'hello':
    case 'hey':
      return {
        lines: [{ text: 'Hi! Ask about my work, my certifications or my tools, or type `help`.' }],
      }
    default:
      break
  }

  const lower = input.toLowerCase()
  const intent = INTENTS.find(({ test }) => test.test(lower))
  if (intent) return intent.reply()

  return {
    lines: [
      warn(
        `I don’t have an answer for "${input.length > 32 ? `${input.slice(0, 32)}…` : input}" yet.`,
      ),
      muted('I’m a scripted terminal, not an AI. Type `help`, or try one of the questions below.'),
    ],
    fallback: true,
  }
}
