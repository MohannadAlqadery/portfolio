# Portfolio — Project Plan

Personal site for Mohannad Alqadery, SOC analyst (Abu Dhabi).
**Tone:** a practitioner's home on the web, not a job application. No "hire me", no "open to work",
no phone number. The site shows how he thinks and works.

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

| Phase | Scope                                                                       | Done when                                 |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------- |
| 0     | Install Node, Git, gh; create GitHub repo                                   | `gh auth status` OK, empty repo pushed    |
| 1     | Scaffold + tooling + CI                                                     | CI green on `main`                        |
| 2     | Design tokens, fonts, base primitives (Section, Chip, Rule, Kbd…)           | Style sheet page renders all primitives   |
| 3     | Layout shell: nav, footer, section scaffold, command palette                | Navigable skeleton on mobile and desktop  |
| 4     | Hero with KQL console                                                       | Animation works, reduced-motion fallback  |
| 5     | Content sections (profile, cases, credentials, toolkit, education, contact) | All resume content represented            |
| 6     | Motion and polish                                                           | Design review with Mohannad               |
| 7     | Quality: a11y, perf, SEO/OG image, security headers, security.txt           | Lighthouse ≥ 95 all categories, axe clean |
| 8     | Deploy to Vercel (+ custom domain if wanted)                                | Live URL                                  |
| 9     | (Later) Field notes with MDX                                                | First real write-up published             |

## 7. Conventions

- Branch per phase (`feat/phase-2-design-system`), small Conventional Commits, PR into `main`, squash merge.
- Every push to a branch gets a Vercel preview URL.
- No personal data beyond what's listed in the Decisions table goes into the repo.
