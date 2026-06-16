# Design — Abonten Technologies HR

Locked design system. Future Hallmark runs read this file first; pages defer to it. Amend intentionally — the file is the rule.

## System

- Genre · modern-minimal
- Macrostructure · Workbench (utility + app pages)
- Theme · custom (vibe: "utilitarian HR emerald")
- Axes · light / grotesk-sans / chromatic-other (emerald accent)

### Macrostructure family

- Utility pages (login, check-in): Workbench — single primary task, left-biased copy, no marketing grids
- App pages (admin): Workbench — N3 side-rail (desktop) + mobile sheet nav, page intro, asymmetric data panels

### Navigation

- App shell · N3 side-rail + mobile dialog nav
- No marketing footers on app routes

## Tokens (canonical · `tokens.css` is the source of truth)

```css
:root {
  --color-paper:        oklch(0.99 0.006 155);
  --color-paper-2:      oklch(0.97 0.008 155);
  --color-paper-3:      oklch(0.94 0.01 155);
  --color-ink:          oklch(0.2 0.02 260);
  --color-ink-2:        oklch(0.42 0.015 260);
  --color-ink-muted:    oklch(0.52 0.012 260);
  --color-rule:         oklch(0.91 0.006 260);
  --color-accent:       oklch(0.52 0.14 160);
  --color-accent-ink:   oklch(0.99 0.006 155);
  --color-focus:        oklch(0.52 0.14 160);
  --color-destructive:  oklch(0.577 0.245 27.325);

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  --space-3xs: 0.25rem;  --space-2xs: 0.5rem;  --space-xs: 0.75rem;
  --space-sm:  1rem;     --space-md:  1.5rem;  --space-lg: 2rem;
  --space-xl:  3rem;     --space-2xl: 4.5rem;

  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-md: 1rem;
  --text-lg: 1.25rem;  --text-xl: 1.5rem;   --text-2xl: 2rem;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.7, 0, 0.84, 0);
  --dur-short: 180ms;  --dur-medium: 280ms;

  --radius-input: 0.5rem;
  --radius-card:  0.75rem;
  --radius-pill:  9999px;
  --radius-shell: 1rem;
}
```

## Typography

- Display · Space Grotesk 600, roman (`font-style: normal` on all headings)
- Body · Inter 400, roman
- Mono · JetBrains Mono 400
- Metrics · `font-variant-numeric: tabular-nums` on all numeric UI

## CTA voice

- Primary · `bg-primary text-primary-foreground` · pill (`rounded-full`) · `h-9`–`h-11`, single-line labels (`whitespace-nowrap`)
- Secondary · outline pill · same radius

## Motion stance

- Silent success on routine actions (check-in, save) — no confetti, no celebratory toasts
- No scroll-stagger, no universal card hover lift
- `transition` lists explicit properties only — never `transition-all`
- Reduced-motion fallback · ≤150 ms opacity crossfade

## Per-page rules

- App pages · no enrichment, no gradient washes, no glassmorphism, no card-in-card nesting
- Login/check-in · typography + form only; no 3-column feature grids
- All pages · `overflow-x: clip` on `html` and `body`

## What pages MUST share

- Wordmark, emerald accent, Space Grotesk headings, Inter body, pill CTAs, flat bordered cards, semantic shadcn tokens

## What pages MAY differ on

- Panel layout within Workbench (2-col vs 3-col data grids) — not theme, fonts, or CTA voice

## Notes

Do **not** reintroduce these patterns on this project:

- Gradient page backgrounds or gradient icon tiles
- Glassmorphism / `backdrop-blur` decorative panels
- Card-in-card (gray shell + white inset)
- 3-up marketing feature grids on utility pages
- `transition-all` on interactive components
- Universal `hover:-translate-y` on stat cards
- Confetti or other celebratory motion on routine actions
- Uppercase mono section eyebrows (use sentence-case group labels)
- Raw `neutral-*` / `slate-*` palette classes — use `primary`, `muted`, `border`, `foreground`

## Exports

`tokens.css` at the project root is the live source of truth. Copy blocks below into new projects as needed.

### tokens.css

See `/tokens.css` — identical to the canonical block in **Tokens** above.

### Tailwind v4 `@theme`

Paste into `globals.css` after `@import "tailwindcss"` (this project maps via `@theme inline` + shadcn bridge):

```css
@theme {
  --color-paper:        oklch(0.99 0.006 155);
  --color-paper-2:      oklch(0.97 0.008 155);
  --color-paper-3:      oklch(0.94 0.01 155);
  --color-ink:          oklch(0.2 0.02 260);
  --color-ink-2:        oklch(0.42 0.015 260);
  --color-ink-muted:    oklch(0.52 0.012 260);
  --color-rule:         oklch(0.91 0.006 260);
  --color-accent:       oklch(0.52 0.14 160);
  --color-focus:        oklch(0.52 0.14 160);

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body:    "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;

  --spacing-3xs: 0.25rem;
  --spacing-2xs: 0.5rem;
  --spacing-xs:  0.75rem;
  --spacing-sm:  1rem;
  --spacing-md:  1.5rem;
  --spacing-lg:  2rem;
  --spacing-xl:  3rem;
  --spacing-2xl: 4.5rem;

  --text-xs:  0.75rem;
  --text-sm:  0.875rem;
  --text-md:  1rem;
  --text-lg:  1.25rem;
  --text-xl:  1.5rem;
  --text-2xl: 2rem;

  --radius-card:  0.75rem;
  --radius-pill:  9999px;
  --radius-input: 0.5rem;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

Also written to `/tokens.json` in this repo.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper":         { "$value": "oklch(0.99 0.006 155)", "$type": "color" },
    "paper-2":       { "$value": "oklch(0.97 0.008 155)", "$type": "color" },
    "paper-3":       { "$value": "oklch(0.94 0.01 155)",  "$type": "color" },
    "ink":           { "$value": "oklch(0.2 0.02 260)",   "$type": "color" },
    "ink-2":         { "$value": "oklch(0.42 0.015 260)", "$type": "color" },
    "ink-muted":     { "$value": "oklch(0.52 0.012 260)", "$type": "color" },
    "rule":          { "$value": "oklch(0.91 0.006 260)", "$type": "color" },
    "accent":        { "$value": "oklch(0.52 0.14 160)",  "$type": "color" },
    "accent-ink":    { "$value": "oklch(0.99 0.006 155)", "$type": "color" },
    "focus":         { "$value": "oklch(0.52 0.14 160)",  "$type": "color" },
    "destructive":   { "$value": "oklch(0.577 0.245 27.325)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Space Grotesk, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "body":    { "$value": "Inter, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "mono":    { "$value": "JetBrains Mono, ui-monospace, monospace", "$type": "fontFamily" }
  },
  "size": {
    "text-xs":  { "$value": "0.75rem",  "$type": "dimension" },
    "text-sm":  { "$value": "0.875rem", "$type": "dimension" },
    "text-md":  { "$value": "1rem",     "$type": "dimension" },
    "text-lg":  { "$value": "1.25rem",  "$type": "dimension" },
    "text-xl":  { "$value": "1.5rem",   "$type": "dimension" },
    "text-2xl": { "$value": "2rem",     "$type": "dimension" }
  },
  "space": {
    "3xs": { "$value": "0.25rem", "$type": "dimension" },
    "2xs": { "$value": "0.5rem",  "$type": "dimension" },
    "xs":  { "$value": "0.75rem", "$type": "dimension" },
    "sm":  { "$value": "1rem",    "$type": "dimension" },
    "md":  { "$value": "1.5rem",  "$type": "dimension" },
    "lg":  { "$value": "2rem",    "$type": "dimension" },
    "xl":  { "$value": "3rem",    "$type": "dimension" },
    "2xl": { "$value": "4.5rem",  "$type": "dimension" }
  },
  "duration": {
    "short":  { "$value": "180ms", "$type": "duration" },
    "medium": { "$value": "280ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables

This project uses full `oklch()` values (not space-separated triples). Live mapping in `src/app/globals.css`:

```css
:root {
  --background:            var(--color-paper);
  --foreground:            var(--color-ink);
  --card:                    var(--color-paper);
  --card-foreground:         var(--color-ink);
  --popover:                 var(--color-paper);
  --popover-foreground:      var(--color-ink);
  --primary:                 var(--color-accent);
  --primary-foreground:      var(--color-accent-ink);
  --secondary:               var(--color-paper-2);
  --secondary-foreground:    var(--color-ink);
  --muted:                   var(--color-paper-2);
  --muted-foreground:        var(--color-ink-muted);
  --accent:                  var(--color-paper-3);
  --accent-foreground:       var(--color-ink);
  --destructive:             var(--color-destructive);
  --border:                  var(--color-rule);
  --input:                   var(--color-rule);
  --ring:                    var(--color-focus);
  --radius:                  var(--radius-card);
}
```
