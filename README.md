# mohannad-portfolio

Personal site of **Mohannad Alqadery**, SOC analyst based in Abu Dhabi.

**Live:** https://mohannad-alqadery.vercel.app

Built with React, TypeScript, Vite and Tailwind CSS. See [`docs/PLAN.md`](docs/PLAN.md) for the design
direction, information architecture and delivery phases.

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
- Fonts are self-hosted, so there are no third-party requests.
- The contact email is assembled at runtime and only shown on request; no phone number is published.
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
