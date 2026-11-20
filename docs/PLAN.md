# Portfolio — Project Plan

Personal site for Mohannad Alqadery, SOC analyst (Abu Dhabi).
**Tone:** a practitioner's home on the web, not a job application. No "hire me", no "open to work",
no phone number. The site shows how he thinks and works.

---

## v2 redesign: "Case File Noir" (agreed 2026-11-20)

v1 (sections 1–7 below) shipped. v2 keeps the repo, tooling, content and field notes, and rebuilds
the visual and motion layer. The reference is a monochrome motion portfolio. We keep its structure
and transitions and add a security layer on top; we copy none of its assets or copy.

### Decisions

| Topic     | Decision                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direction | **Case File Noir**: dark monochrome, light/dark toggle, one accent, cyber layer through motion                                                                 |
| Accent    | Signal green `#7BD389`, only for status / live states; severity colours stay semantic-only                                                                     |
| Footer    | **Traffic crowd**: walking line-art crowd (CC0 Open Peeps), giant `MOHANNAD.` watermark, detection boxes lock onto people, "Finally, some traffic on my site." |
| Assistant | **Scripted terminal** panel (no backend, no API key, no prompt-injection surface)                                                                              |
| Contact   | Unchanged: obfuscated email + LinkedIn; the form only builds a `mailto:` draft                                                                                 |

### Reference → our version

| Reference                        | v2                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `< SOFTWARE ENGINEER />` hero    | `[ SECURITY ANALYST ]` decrypt-scrambles in; `{{ /SOC & INCIDENT RESPONSE }}` types in mono    |
| Photo card flips into the intro  | Portrait starts as an ASCII/dither matrix and resolves while it tilts into "Hi, I'm Mohannad." |
| Floating pill nav + `⋯` menu     | Same, `⋯` opens the existing command palette; theme toggle in the pill                         |
| Tech stack columns with chips    | Toolkit columns (Detect · Investigate · Respond · Offensive), daily drivers highlighted        |
| Project folders                  | Case-file folders: redacted pages, KQL snippets and ATT&CK tags slide out on hover             |
| Wavy experience timeline         | Signal trace: a waveform path that draws on scroll, nodes per role and degree                  |
| "Let's talk." form               | "Open a channel." form → `mailto:` draft                                                       |
| Crowd footer with name watermark | Traffic crowd with detection overlay (see Decisions)                                           |

### Design system v2

- **Palette:** neutral monochrome, dark default (`#0A0A0A` canvas) and a light theme
  (`[data-theme='light']`). Accent and severity tokens keep their names, so components don't change.
- **Type:** Archivo variable (weight and width axes) for display, so headlines can condense and
  stretch; Geist for body; Geist Mono for labels and data.
- **Motion:** `motion` (LazyMotion, `reducedMotion="user"`), Lenis smooth scroll (off for reduced
  motion), CSS scroll-driven animations where they're enough. Everything honours reduced motion.
- **Theme:** chosen theme saved in `localStorage`; `public/theme-init.js` applies it before first
  paint (an external file, so the CSP stays `script-src 'self'`).

### Phases (one branch + PR each)

| Phase | Scope                                                                 |
| ----- | --------------------------------------------------------------------- |
| v2.1  | Tokens (mono + light), Archivo, theme infra, Lenis, motion primitives |
| v2.2  | Floating pill nav, theme toggle, `⋯` menu → command palette           |
| v2.3  | Hero: decrypt headline, ASCII portrait, scroll-driven flip into intro |
| v2.4  | Intro + toolkit columns                                               |
| v2.5  | Case-file folders + case detail                                       |
| v2.6  | Signal-trace timeline (experience, education, credentials)            |
| v2.7  | Contact: "Open a channel." + mailto draft                             |
| v2.8  | Footer: traffic crowd, watermark, sticky reveal                       |
| v2.9  | Scripted terminal assistant                                           |
| v2.10 | a11y, reduced motion, perf (Lighthouse ≥ 95), e2e, OG image, deploy   |

---

## 1. Decisions (agreed)

| Topic      | Decision                                                                              |
| ---------- | ------------------------------------------------------------------------------------- |
| Direction  | **A + touches of B** — dark SOC "case file" console, editorial typography and spacing |
| Easter egg | `Ctrl/⌘ + K` command palette (terminal flavour without a cliché terminal hero)        |
| Hosting    | Vercel (preview deploy per branch, custom security headers)                           |
| Contact    | Email (scraper-protected) + LinkedIn only                                             |

## 2. Research takeaways

- **Real security people's sites** (e.g. samcurry.net, billdemirkapi.me): content-first, dark, minimal
  chrome, the _work_ is the hero. Green-on-black hacker imagery is common and dated, so we avoid it.
- **Security brands** (Tines, Chainguard, Wiz, Thinkst): confident type, restrained palette, one accent,
  product UI fragments used as illustration. We borrow the "real UI as illustration" idea: a KQL query
  and incident cases instead of stock hacker art.
- **Godly / Recent.design picks**: technical annotations (coordinates, indices like `01 / 06`), halftone
  and dither textures, thin rules, oversized editorial headlines, generous negative space.
- **What makes portfolios look AI-generated** (and what we avoid): purple-blue gradients, glassmorphism
  cards everywhere, emoji bullets, "Passionate about…" copy, identical rounded cards in 3-column grids,
  random glowing orbs.

## 3. Information architecture (single page + later `/notes`)

| #   | Section             | Idea                                                                                               |
| --- | ------------------- | -------------------------------------------------------------------------------------------------- |
| 00  | Nav                 | `MA` monogram, section index, local Abu Dhabi time, `⌘K` hint                                      |
| 01  | Hero                | Name in large editorial type + a live-typing KQL query whose "results" are his highlights          |
| 02  | Profile             | Short first-person intro, focus areas, languages                                                   |
| 03  | Case files          | Experience as incident cases: `CASE-2608 · SOC L1 Analyst · status: active`, expandable details    |
| 04  | Credentials         | SC-200, eJPTv2, eSOC, AWS, Cisco as "evidence" cards with issuer, year and verify link             |
| 05  | Toolkit             | ATT&CK-matrix-style grid: Detect · Investigate · Respond · Offensive · Frameworks                  |
| 06  | Education           | BA Cybersecurity and Cloud Computing, coursework                                                   |
| 07  | Contact             | "Open a channel": obfuscated email + LinkedIn                                                      |
| —   | Footer              | Build hash, `/.well-known/security.txt`, colophon                                                  |
| —   | Field notes (later) | MDX write-ups / lab notes / detection queries — only once real content exists (nothing fabricated) |

All content lives in typed files under `src/content/` so it can be edited without touching components.

## 4. Design system

- **Palette (dark-first):** near-black with a slight green tint `#0B0D0C`, surfaces `#121513`,
  hairlines `#232825`, text `#EDEFEA`, muted `#8C958D`. One signal accent (green `#7BD389`) plus
  severity colours used _only_ for semantic chips (amber `#E8B14A`, red `#E5534B`).
- **Type:** editorial serif for display moments (Instrument Serif), clean grotesk for body (Geist),
  mono for data and labels (Geist Mono / JetBrains Mono). Fonts self-hosted (CSP-friendly).
- **Motifs:** section indices `01 / 07`, coordinates, thin rules, subtle dot-grid / halftone, status dots.
- **Motion:** purposeful only (typing query, reveal on scroll, case expand). Honours `prefers-reduced-motion`.
- **Responsive:** mobile-first; grids collapse to stacked case cards; palette works on touch via a button.

## 5. Tech stack

- Vite + React + TypeScript (strict)
- Tailwind CSS v4 (`@tailwindcss/vite`), design tokens via `@theme`
- `motion` for animation, `cmdk` for the command palette, Radix primitives / shadcn-style components where useful, `lucide-react` icons
- Quality: oxlint (Vite's default linter, much faster than ESLint), Prettier + tailwind plugin, Vitest + Testing Library, Playwright + axe (smoke + a11y)
- Workflow: Husky + lint-staged + commitlint (Conventional Commits), GitHub Actions CI (typecheck, lint, test, build)
- Deploy: Vercel with `vercel.json` security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

## 6. Phases

| Phase | Scope                                                                       | Done when                                  |
| ----- | --------------------------------------------------------------------------- | ------------------------------------------ |
| 0     | Install Node, Git, gh; create GitHub repo                                   | `gh auth status` OK, empty repo pushed     |
| 1     | Scaffold + tooling + CI                                                     | CI green on `main`                         |
| 2     | Design tokens, fonts, base primitives (Section, Chip, Rule, Kbd…)           | Style sheet page renders all primitives    |
| 3     | Layout shell: nav, footer, section scaffold, command palette                | Navigable skeleton on mobile and desktop   |
| 4     | Hero with KQL console                                                       | Animation works, reduced-motion fallback   |
| 5     | Content sections (profile, cases, credentials, toolkit, education, contact) | All resume content represented             |
| 6     | Motion and polish                                                           | Design review with Mohannad                |
| 7     | Quality: a11y, perf, SEO/OG image, security headers, security.txt           | Lighthouse ≥ 95 all categories, axe clean  |
| 8     | Deploy to Vercel (+ custom domain if wanted)                                | Live: https://mohannad-alqadery.vercel.app |
| 9     | (Later) Field notes with MDX                                                | First real write-up published              |

## 7. Conventions

- Branch per phase (`feat/phase-2-design-system`), small Conventional Commits, PR into `main`, squash merge.
- Every push to a branch gets a Vercel preview URL.
- No personal data beyond what's listed in the Decisions table goes into the repo.
