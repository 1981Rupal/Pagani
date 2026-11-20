# Arte e Scienza — Design System

> Pagani Atelier · concept study · not affiliated with Pagani Automobili S.p.A.
> This is the single source of truth for colour, type, spacing, components and motion. If it isn't in here, ask before inventing it.

---

## 1. The idea

Every Pagani begins as a pencil sketch and ends as carbon and titanium. The site follows the same path:

| Mode | Name | Feels like | Used for |
|---|---|---|---|
| ☀️ Day | **Arte** | Ink on parchment, a sketchbook | Opening reveal, Legacy, stories, "Meet the hands", owner's chapter |
| 🌙 Night | **Scienza** | Carbon, brushed aluminium, a lit showroom | Collection, turntable, configurator, Ask the car, reserve |

**The signature moment:** when the visitor scrolls (or navigates) from story into the cars, the page turns from parchment to carbon. *From the sketch to the machine.* That transition happens **once** per journey: day → night, never back and forth.

---

## 2. Colour

### Arte (day)
| Token | Hex | Role |
|---|---|---|
| `arte.page` — Pergamena | `#F3EEE3` | Page background |
| `arte.paper` | `#FBF8F1` | Raised surface (sketchbook page, cards) |
| `arte.wash` | `#E8E1D3` | Placeholders, image wells, banner |
| `arte.rule` | `#D9D1C1` | 1px lines, borders, dividers |
| `arte.ink` — Inchiostro | `#1B1A17` | Headlines, body text, sketch lines, outline buttons |
| `arte.sepia` — Seppia | `#5E584D` | Supporting text, captions, labels |
| `arte.accent` — Cuoio | `#8A4B2A` | **The one accent:** primary button, active state, kickers |

### Scienza (night)
| Token | Hex | Role |
|---|---|---|
| `scienza.page` — Carbonio | `#0E0F10` | Page background |
| `scienza.panel` — Grafite | `#1A1C1E` | Panels, spec tiles, cards |
| `scienza.stage` | `#121416` | Turntable / media stage |
| `scienza.rule` | `#2C2F32` | 1px lines, borders, taken slot dots |
| `scienza.text` | `#ECEAE4` | Headlines, body text |
| `scienza.muted` | `#9A9C9F` | Supporting text, labels |
| `scienza.metal` — Alluminio | `#C8CBCF` | Spec values, metal details, outline buttons |
| `scienza.accent` — Bronzo | `#B88A5A` | **The one accent:** primary button, selected slot, kickers |

### Contrast (checked, WCAG)
| Pair | Ratio | OK for |
|---|---|---|
| Ink on Pergamena | 15.0 : 1 | everything |
| Sepia on Pergamena | 6.1 : 1 | body text |
| Cuoio on Pergamena | 5.8 : 1 | text + links |
| Pergamena on Cuoio (button) | 5.8 : 1 | button labels |
| Sepia on Wash | 5.4 : 1 | placeholder labels |
| Text on Carbonio | 15.9 : 1 | everything |
| Muted on Carbonio | 7.0 : 1 | body text |
| Muted on Grafite | 6.2 : 1 | labels in panels |
| Alluminio on Grafite | 10.5 : 1 | spec values |
| Bronzo on Carbonio | 6.2 : 1 | text + links |
| Carbonio on Bronzo (button) | 6.2 : 1 | button labels |

### Colour rules
1. **One accent per screen, ~2% of pixels.** Cuoio by day, Bronzo by night. It marks the *next step* only (primary CTA, the selected thing). Never decoration.
2. **One primary button per view.** Everything else is outline or text.
3. **Don't mix modes** inside one section. A section is either Arte or Scienza.
4. **No gradients, glows or drop shadows.** Depth comes from flat surfaces + 1px rules.
5. **Paint colours are content, not UI.** Car paint swatches in the configurator can be any colour; UI chrome stays in the palette.
6. **Never pure `#000` or `#FFF`.**

---

## 3. Typography

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | **Bodoni Moda** (Google Fonts) | 400, 400 italic | Headlines, model names. Italic for the second word: *Utopia Roadster* |
| Text | **Manrope** | 300, 400, 500, 600 | Body, buttons, nav, forms |
| Data | **IBM Plex Mono** | 400, 500 | Specs, chassis / build numbers, kickers, labels |

**Why:** Bodoni is an Italian face from Parma, close to Modena. Manrope stays calm and precise. The mono type reads like engraved titanium.

### Type scale (desktop → mobile)
| Token | Size | Line height | Font |
|---|---|---|---|
| `display-xl` | 96 → 56px | 0.98 | Bodoni |
| `display-l` | 84 → 48px | 1.0 | Bodoni |
| `display-m` | 52 → 36px | 1.05 | Bodoni |
| `display-s` | 40 → 30px | 1.1 | Bodoni |
| `body-l` | 17px | 1.7 | Manrope 400 |
| `body` | 15px | 1.7 | Manrope 400 |
| `small` | 13px | 1.6 | Manrope 400 |
| `kicker` | 12px, `letter-spacing: 0.2em`, UPPERCASE | 1.4 | Plex Mono |
| `spec` | 20–22px | 1.3 | Plex Mono |
| `label` | 11px, `letter-spacing: 0.14em`, UPPERCASE | 1.4 | Plex Mono |

Rules: no font below 11px · kickers and labels are the **only** uppercase text · numbers that matter (852 hp, Build 047 / 130) are always mono.

---

## 4. Space, shape, layout

- **Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 120
- **Section padding:** 96px top/bottom desktop, 64px mobile
- **Container:** `max-width: 1280px`, side padding 32px (20px mobile)
- **Corners:** **square (0px) everywhere.** The only round things are round in real life: paint swatches, slot dots, wheels.
- **Lines:** 1px rules, like engraving. Borders over fills.
- **Touch targets:** ≥ 44 × 44px (primary buttons 52px tall).
- **Grid:** 12 columns, 24px gutter. Spec rows use 4 equal tiles with a 1px gap showing `rule` colour between them.

---

## 5. Components

### Buttons
| Variant | Arte | Scienza |
|---|---|---|
| Primary | bg Cuoio · text Pergamena · 600 | bg Bronzo · text Carbonio · 600 |
| Outline | 1px Ink · text Ink | 1px Alluminio · text Text |
| Ghost / link | text Cuoio + "→" | text Bronzo + "→" |

Height 48–52px, padding 0 26px, Manrope 14px, `letter-spacing: 0.04em`, square corners. Labels are verbs: *Begin your commission*, *Open the sketchbook*. Never "Buy now" or "Add to cart".

### Kicker + headline (every section starts this way)
```
KICKER IN MONO · 12px · accent colour
Headline in Bodoni, *italic second word*
One sentence of body in muted colour.
```

### Spec tiles
4 tiles in a row, `panel` background, 1px `rule` gaps. Label (mono 11px, muted) above value (mono 20–22px, metal).

### Chips
1px `rule` border, 6px 14px padding, 13px. Active chip = filled Ink (day) / Text (night).

### Inputs
No box. Transparent background, 1px bottom line (Ink / Alluminio), mono uppercase label above, 44px min height, placeholder is a real example ("Lake Como at dusk, smoked bronze").

### Slot dots
Taken: filled `rule` · Open: 1px Alluminio ring · Selected: filled Bronzo + 2px Bronzo outline offset 2px. Always add a legend.

### Image / media placeholders
`wash` (day) or `stage` (night) block with a mono label in brackets: `[ 36-FRAME TURNTABLE · UTOPIA ROADSTER ]`. Never lorem ipsum, never stock photos.

---

## 6. Motion

| Thing | Duration | Easing |
|---|---|---|
| Hover / press | 150–200ms | `ease-out` |
| Reveal on scroll (fade + 16px rise) | 700ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Day → night transition | 900ms | same |
| Sketch line draw-in | 1200–1600ms | `ease-in-out` |
| Car change / lights dim | 600ms | `ease-out` |

Rules: **slow is expensive.** Nothing bounces, nothing spins for fun. Respect `prefers-reduced-motion`: replace movement with a plain 200ms fade.

---

## 7. Sound

- Sound starts **only after a gesture** (hold to start, hold to hear). Never autoplay.
- One shared audio manager, one global mute (top-right, label "SOUND ON / OFF").
- Only one sound plays at a time.

---

## 8. Voice

- Calm, quiet confidence. Short sentences.
- Say *commission*, *build*, *atelier*, *advisor*, *owner*. Not *buy*, *cart*, *deal*, *customer*.
- No prices in the UI. Use "Price on request".
- No invented facts: unknown numbers stay as `[HOURS]`, `[YOUR PRICE]` until confirmed.
- No AI that pretends to be Horacio Pagani (or any real person). The AI is "the atelier guide".

---

## 9. Accessibility checklist

- [ ] Text contrast ≥ 4.5:1 (all pairs above pass)
- [ ] Real `<button>` / `<a href>` / `<label>`, never clickable `<div>`
- [ ] Icon-only buttons have `aria-label`
- [ ] Turntable works with arrow keys and a slider, not only drag
- [ ] Colour is never the only signal (slot dots have a legend)
- [ ] `prefers-reduced-motion` respected
- [ ] Every image has alt text; decorative SVG gets `aria-hidden="true"`

---

## 10. Tokens (copy-paste)

This repo uses **Tailwind CSS v4**: there is no `tailwind.config.ts`. Tokens live in CSS, inside `@theme`.

### `frontend/app/globals.css` (replace the whole file)
```css
@import "tailwindcss";

/* ---------- Raw palette ---------- */
@theme {
  /* Arte (day) */
  --color-arte-page: #F3EEE3;   --color-arte-paper: #FBF8F1;  --color-arte-wash: #E8E1D3;
  --color-arte-rule: #D9D1C1;   --color-arte-ink: #1B1A17;    --color-arte-sepia: #5E584D;
  --color-arte-accent: #8A4B2A;

  /* Scienza (night) */
  --color-scienza-page: #0E0F10;  --color-scienza-panel: #1A1C1E; --color-scienza-stage: #121416;
  --color-scienza-rule: #2C2F32;  --color-scienza-text: #ECEAE4;  --color-scienza-muted: #9A9C9F;
  --color-scienza-metal: #C8CBCF; --color-scienza-accent: #B88A5A;

  /* Type, layout, motion (corners: no rounded-* classes, except rounded-full on swatches and dots) */
  --tracking-kicker: 0.2em;
  --tracking-label: 0.14em;
  --container-site: 1280px;
  --ease-atelier: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ---------- Mode-aware tokens (follow .mode-arte / .mode-scienza) ---------- */
@theme inline {
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-rule: var(--rule);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);
  --color-panel: var(--panel);

  --font-display: var(--font-bodoni), serif;
  --font-sans: var(--font-manrope), system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), monospace;
}

.mode-arte {
  --bg: var(--color-arte-page);  --fg: var(--color-arte-ink);   --muted: var(--color-arte-sepia);
  --rule: var(--color-arte-rule); --accent: var(--color-arte-accent); --on-accent: var(--color-arte-page);
  --panel: var(--color-arte-paper);
}
.mode-scienza {
  --bg: var(--color-scienza-page);  --fg: var(--color-scienza-text);   --muted: var(--color-scienza-muted);
  --rule: var(--color-scienza-rule); --accent: var(--color-scienza-accent); --on-accent: var(--color-scienza-page);
  --panel: var(--color-scienza-panel);
}
.mode-arte, .mode-scienza {
  background: var(--bg);
  color: var(--fg);
  transition: background-color 900ms var(--ease-atelier), color 900ms var(--ease-atelier);
}

body { margin: 0; font-family: var(--font-sans); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

This gives you utilities like `bg-bg`, `text-fg`, `text-muted`, `border-rule`, `bg-accent`, `text-on-accent`, `bg-panel`, `font-display`, `font-mono`, `tracking-kicker`, `max-w-site`, plus the raw ones (`bg-arte-page`, `text-scienza-metal`, …) when you truly need a fixed colour.

### `frontend/app/fonts.ts`
```ts
import { Bodoni_Moda, Manrope, IBM_Plex_Mono } from "next/font/google";

export const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400"], variable: "--font-bodoni" });
export const manrope = Manrope({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-manrope" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });
```

### `frontend/app/layout.tsx` (swap Geist for these)
```tsx
import { bodoni, manrope, plexMono } from "./fonts";

<html lang="en" className={`${bodoni.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}>
```

### Usage example
```tsx
<section className="mode-scienza py-24">
  <div className="mx-auto max-w-site px-8">
    <p className="font-mono text-xs uppercase tracking-kicker text-accent">The collection · 130 made</p>
    <h2 className="font-display text-6xl">Utopia <em>Roadster</em></h2>
    <p className="mt-4 text-muted">A twelve-cylinder heart and a gated manual.</p>
    <a href="/atelier/utopia-roadster?slot=047"
       className="mt-8 inline-flex h-[52px] items-center bg-accent px-[26px] font-semibold text-on-accent">
      Begin your commission
    </a>
  </div>
</section>
```

---

## 11. Where each mode is used

| Route | Owner | Mode |
|---|---|---|
| `/` opening (ignition + sketch reveal) | Start experience | Arte → Scienza (the transition lives here) |
| `/legacy` | Cars + Legacy | Arte |
| `/collection`, `/collection/[model]` | Cars + Legacy | Scienza |
| `/atelier/[model]` | Customization | Scienza |
| `/reserve/[buildId]`, `/b/[buildId]` | Customization | Scienza |

Prototype reference (all screens): https://claude.ai/artifact/UgwZCnWG72s2H4tnGnWyVr