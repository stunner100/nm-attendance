# Design — Night Market HR

Locked design system for this app. Adapted from the Airtable editorial analysis (`DESIGN-airtable.md`). Every page reads this file before emitting UI.

## Provenance

Source DNA: Airtable marketing system (white canvas, near-black primary, signature surface cards, Haas/Inter type voice). This file translates that language into **app surfaces** — admin dashboard, login, check-in — not marketing long-scroll pages.

## System

- Genre · modern-minimal (editorial workflow software)
- Macrostructure · Workbench (app pages)
- Theme · Airtable-adapted (canvas + ink primary + signature accents)
- Axes · light / grotesk-sans (Inter) / neutral primary with chromatic signature cards

### Macrostructure family

- Utility pages (login, check-in): Workbench — single primary task, no marketing grids
- App pages (admin): Workbench — light side-rail nav (`topic-filter-rail`), white top bar (`top-nav`), asymmetric data panels on canvas

### Navigation

- App shell · white 240px side-rail + 64px white top bar (stays light on all pages)
- No marketing footers on app routes

## Tokens (canonical · `tokens.css` is the source of truth)

```css
:root {
  --color-paper:           #ffffff;
  --color-paper-2:         #f8fafc;
  --color-paper-3:         #e0e2e6;
  --color-ink:             #181d26;
  --color-ink-2:           #333840;
  --color-ink-muted:       #41454d;
  --color-rule:            #dddddd;
  --color-border-strong:   #9297a0;
  --color-accent:          #181d26;
  --color-accent-active:   #0d1218;
  --color-accent-ink:      #ffffff;
  --color-link:            #1b61c9;
  --color-link-active:     #1a3866;
  --color-focus:           #458fff;
  --color-info:            #254fad;
  --color-success:         #006400;
  --color-destructive:     #aa2d00;
  --color-signature-coral:   #aa2d00;
  --color-signature-forest:  #0a2e0e;
  --color-signature-cream:   #f5e9d4;
  --color-signature-peach:   #fcab79;
  --color-signature-mint:    #a8d8c4;
  --color-signature-yellow:  #f4d35e;
  --color-signature-mustard: #d9a441;

  --font-display: var(--font-body-loaded), ui-sans-serif, system-ui, sans-serif;
  --font-body:    var(--font-body-loaded), ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-mono-loaded), ui-monospace, monospace;

  --space-xxs: 4px;  --space-xs: 8px;   --space-sm: 12px;
  --space-md:  16px; --space-lg: 24px;  --space-xl: 32px;
  --space-xxl: 48px;

  --text-xs: 0.8125rem;  --text-sm: 0.875rem; --text-md: 1rem;
  --text-lg: 1.25rem;    --text-xl: 1.5rem;   --text-2xl: 2rem;
  --text-display: 2rem;

  --radius-xs: 2px;  --radius-sm: 6px;  --radius-md: 10px;
  --radius-lg: 12px; --radius-pill: 9999px;
  --radius-input: var(--radius-sm);
  --radius-card:  var(--radius-md);
  --radius-button: var(--radius-lg);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.7, 0, 0.84, 0);
  --dur-short: 150ms;
}
```

## Typography

- Display + body · Inter 400–500, roman only (`font-style: normal` on all headings)
- Display emphasis via size and color — not weight 600+ on headlines
- Body · 14px / 400 (`--text-sm`)
- Metrics · `font-variant-numeric: tabular-nums`

## CTA voice

- Primary · near-black fill (`--color-accent`), white text, `--radius-button` (12px), 16×24px padding rhythm
- Secondary · white fill, ink text, 1px `--color-rule` hairline outline, same radius
- Links · `--color-link` — never use link blue as primary button fill

## Motion stance

- Silent success on routine actions — no confetti
- No universal card hover lift or shadow escalation
- `transition` on explicit properties only
- Reduced-motion · ≤150ms opacity crossfade

## App dashboard components

Map Airtable marketing components to admin UI:

| Admin surface | Airtable analogue |
|---------------|-------------------|
| Side nav | `topic-filter-rail` — white, 240px, sentence-case group labels |
| Top bar | `top-nav` — 64px white, hairline bottom border |
| KPI / queue tiles | `demo-grid-card` — white or `--color-paper-2`, hairline border, no icon discs |
| Highlight band (optional) | `signature-coral-card` / `hero-card-dark` — at most one per viewport |
| Insight panels | `feature-card-tabbed` — `--color-paper-2` fill, `--radius-lg` |
| Alerts list | flat rows, hairline dividers, `button-secondary` for row actions |

## Per-page rules

- App pages · no enrichment, no hero gradients, no glassmorphism
- Signature colors · full-card surfaces only, not rainbow icon tiles
- All pages · `overflow-x: clip` on `html` and `body`

## What pages MUST share

- Night Market wordmark, ink primary, Inter type, hairline borders, 12px button radius, semantic tokens

## What pages MAY differ on

- Panel column counts within Workbench only

## Notes — do not reintroduce

- Dark green sidebar (`#061427`) or emerald primary CTAs
- Gradient avatars or colored circular icon backgrounds on stat cards
- Raw hex / `slate-*` / `neutral-*` in components — use tokens / shadcn semantic vars
- Uppercase mono nav group labels
- `transition-all`, hover shadow lift on KPI cards
- Link blue (`#1b61c9`) as primary button background

## Exports

See `tokens.css`, `tokens.json`, and `src/app/globals.css` for live shadcn bridge mappings.
