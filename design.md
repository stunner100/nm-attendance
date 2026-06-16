# Design — Abonten Technologies HR

A locked design system for this app. Every page redesign reads this file before emitting code.

## Genre

modern-minimal

## Macrostructure family

- Utility pages (login, check-in): Workbench — single primary task, left-biased copy, no marketing grids
- App pages (admin): Workbench — sidebar nav, page intro, data panels in asymmetric grids

## Theme

- `--color-paper` oklch(99% 0.006 155)
- `--color-paper-2` oklch(97% 0.008 155)
- `--color-ink` oklch(20% 0.02 260)
- `--color-ink-2` oklch(42% 0.015 260)
- `--color-rule` oklch(91% 0.006 260)
- `--color-accent` oklch(52% 0.14 160)
- `--color-focus` oklch(52% 0.14 160)

## Typography

- Display: Space Grotesk 600, roman
- Body: Inter 400, roman
- Mono: JetBrains Mono 400
- Metrics: tabular-nums on all numeric UI

## Spacing

4-point named scale in `tokens.css`. Use semantic Tailwind tokens mapped from shadcn variables.

## Motion

- Easings: `--ease-out` exponential
- Reveal pattern: none on app surfaces; opacity-only on state change ≤ 150ms
- Reduced-motion: collapse spatial motion to opacity crossfade
- No confetti, no scroll-stagger, no universal card lift

## Microinteractions stance

- Silent success on routine actions (check-in, save)
- `transition` lists explicit properties only — never `transition-all`
- Hover delay 800ms on tooltips; focus delay 0ms

## CTA voice

- Primary: filled pill, `bg-primary text-primary-foreground`, single line labels
- Secondary: outline pill

## Per-page allowances

- App pages: no enrichment, no gradient washes, no glassmorphism
- Login/check-in: typography + form only

## What pages MUST share

- Wordmark, accent emerald, Space Grotesk headings, Inter body, pill CTAs, flat bordered cards

## Exports

See `tokens.css` at project root for canonical token block. Shadcn mapping lives in `src/app/globals.css` `:root`.
