# mohannad-portfolio

Personal site of **Mohannad Alqadery**, SOC analyst based in Abu Dhabi.

**Live:** https://mohannad-alqadery.vercel.app

Built with React, TypeScript, Vite and Tailwind CSS, with `motion` and Lenis for animation and
smooth scrolling. See [`docs/PLAN.md`](docs/PLAN.md) for the design direction ("Case File Noir",
v2), information architecture and delivery phases.

## What's on the page

- **Hero:** a pinned scroll scene. A decrypting `[ SECURITY ANALYST ]` headline, then an ASCII
  monogram card that tilts in 3D into the "Hi, I'm Mohannad." intro.
- **Floating pill nav** with the current section, a light/dark switch (circular reveal) and a
  drop-down site menu; `Ctrl/⌘ K` opens a command palette.
- **Sections:** profile (word-by-word scroll reveal), case files as document folders,
  credentials, toolkit as staggered chip columns, a signal-trace timeline, and contact with a
  `mailto:` draft form.
- **Footer:** City watch: a night city seen from a SOC, in the page's own colour tokens (its sky
  is the page background). Buildings are hosts that get patched in waves, new CVEs ping in, an
  advisory ticker scrolls, packets run along rooftop cables and malicious ones are dropped at a
  firewall, and a profiler checks passers-by's devices for missing updates and anomalies, then
  marks them resolved. Colour appears only as severity. The light theme shows the same city by
  day. Drawn in code on one canvas (`src/features/city-watch`); nothing reacts to the pointer.
- **Ask terminal:** a scripted assistant (corner pill, or the backtick key) that answers from the
  site's own content. No AI and no network.
- **Field notes** at `/notes`: MDX write-ups, pre-rendered as static HTML.

Every animation honours Reduce Motion and runs on time, not frames (same speed at 60, 120 or
144 Hz). Layouts are tested from a 280 px folded phone to 4K, and large, tall monitors scale the
whole page up. The heavier pieces (footer street, terminal, palette) load only when they are
needed, and green is reserved for live status.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script              | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                             |
| `npm run build`     | Type-check and build for production into `dist/`                 |
| `npm run preview`   | Serve the build locally **with the production security headers** |
| `npm run typecheck` | TypeScript project build (no emit)                               |
| `npm run lint`      | Lint with oxlint (warnings fail)                                 |
| `npm run format`    | Format with Prettier                                             |
| `npm run test`      | Unit and component tests (Vitest + Testing Library)              |
| `npm run test:e2e`  | Playwright e2e, axe accessibility and header checks              |
| `npm run og`        | Re-render `public/og.png` and `public/apple-touch-icon.png`      |
| `npm run check`     | Typecheck, lint, format check and unit tests                     |

## Quality gates (CI)

Every pull request runs three jobs:

1. **Verify**: typecheck, lint, format, unit tests, build.
2. **E2E**: Playwright on desktop and a mobile device profile. It checks WCAG 2.2 AA with axe, fails on
   any console error or CSP violation, and verifies security headers, `robots.txt`, `sitemap.xml`,
   `security.txt` and social metadata.
3. **Lighthouse**: performance ≥ 90, accessibility = 100, best practices and SEO ≥ 95, CLS ≤ 0.05.
   Reports are kept as build artifacts.

## Security

- Strict Content Security Policy (`script-src 'self'`, no third-party origins), HSTS, `nosniff`,
  `frame-ancestors 'none'`, COOP/CORP and a locked-down Permissions-Policy, all defined in
  [`vercel.json`](vercel.json). `vite preview` and the e2e suite reuse the same headers.
- Fonts, illustrations and scripts are self-hosted, so there are no third-party requests.
- The light/dark theme is applied before first paint by an external `public/theme-init.js`, so no
  inline script is needed.
- The contact email is assembled at runtime and only shown on request; no phone number is published.
  The contact form only builds a `mailto:` draft, so nothing is submitted (`form-action 'none'`).
- [`/.well-known/security.txt`](https://securitytxt.org/) is generated at build time with a rolling
  one-year expiry.

## Deployment

Hosted on [Vercel](https://vercel.com) (project `mohannad-alqadery`), connected to this repository:

- **Production**: every merge to `main` deploys to https://mohannad-alqadery.vercel.app.
- **Previews**: every pull request gets its own preview URL, posted as a check on the PR.
- Build settings and security headers come from [`vercel.json`](vercel.json); nothing is configured
  only in the dashboard.
- The local `.vercel/` link folder and `.env*` files (short-lived Vercel token) are git-ignored.

## Configuration

| Variable   | Purpose                                                                             |
| ---------- | ----------------------------------------------------------------------------------- |
| `SITE_URL` | Absolute origin for canonical/Open Graph URLs. Defaults to Vercel's production URL. |

## Conventions

- [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint on `commit-msg`.
- `lint-staged` runs oxlint and Prettier on staged files before every commit.
- One branch per phase, merged into `main` through a pull request. CI must pass.
