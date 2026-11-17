# mohannad-portfolio

Personal site of **Mohannad Alqadery**, SOC analyst based in Abu Dhabi.

Built with React, TypeScript, Vite and Tailwind CSS. See [`docs/PLAN.md`](docs/PLAN.md) for the design
direction, information architecture and delivery phases.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script              | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the dev server                             |
| `npm run build`     | Type-check and build for production into `dist/` |
| `npm run preview`   | Serve the production build locally               |
| `npm run typecheck` | TypeScript project build (no emit)               |
| `npm run lint`      | Lint with oxlint (warnings fail)                 |
| `npm run format`    | Format with Prettier                             |
| `npm run test`      | Run unit tests with Vitest                       |
| `npm run check`     | Everything CI runs, except the build             |

## Conventions

- [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint on `commit-msg`.
- `lint-staged` runs oxlint and Prettier on staged files before every commit.
- One branch per phase, merged into `main` through a pull request. CI must pass.
