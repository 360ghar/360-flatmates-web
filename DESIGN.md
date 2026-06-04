# DESIGN.md - 360 Flatmates Web Design System

> **Single source of truth** for UI tokens, component specs, and interaction
> standards for the 360 Flatmates web app. Every visual change references this
> file, and every token/utility/component documented here exists in code
> (`src/styles/globals.css`, `src/components/ui/`). If the doc and the code ever
> disagree, that is a bug - fix it in the same change.

---

## 1. Principles

The product is a warm-editorial flatmate-matching app: approachable like a
well-made journal, trustworthy enough for rent and deposits, and human in a sea
of generic property portals. Core differentiator: **6-dimension lifestyle
compatibility**, not budget-only filtering.

**Physical scene.** A 26-year-old engineer browsing on laptop or phone in a
Bangalore co-working space at 3 PM, daylight from tall windows, half-distracted
by Slack. They need a flatmate in two weeks and are cautiously optimistic. The
UI should feel like a design-literate friend: good typography, warm surfaces,
editorial craft, zero clutter.

**Decision tenets** (use these when a spec is silent):

1. **Warmth over sterility.** Off-whites and warm ink, never pure `#000`/`#fff`
   for content. Shadows are warm-ink tinted, never cool black.
2. **One accent, used with intent.** Terracotta `#C96442` is the only brand
   accent. Categorical pastels are for data/labels, not decoration.
3. **Hierarchy by weight, color, and space - not raw size.** Restrained scale;
   let whitespace and the serif display do the work.
4. **Every interactive element earns four states minimum**: rest, hover, active,
   focus-visible. Data-bearing surfaces also earn loading, empty, and error.
5. **Motion is motivated.** It communicates hierarchy, feedback, or a state
   change, and always collapses under `prefers-reduced-motion`.
6. **Accessible by default.** WCAG AA for body, AAA target for hero copy; never
   convey meaning by color alone.
7. **Never use em dashes.** Use commas, colons, or parentheses instead. This is
   a hard rule across all copy, labels, and microcopy.

---

## 2. Token Architecture

Tokens live in `src/styles/globals.css`. There are three layers:

| Layer | What it is | Examples | When to use |
|-------|-----------|----------|-------------|
| **Primitive** | Raw palette/scale values | `--color-ink`, `--color-accent-500`, `--shadow-md` | Building new tokens |
| **Semantic role** | Intent-named aliases over primitives | `--color-content`, `--color-surface-raised`, `--color-interactive`, `--color-focus` | **Preferred** in new component code |
| **Component** | Local choices inside a component | Button variant classes | Inside one component only |

- Tailwind v4 generates utilities from the `@theme` block: every `--color-*`
  becomes `text-* / bg-* / border-*`, every `--ease-*` becomes an `ease-*`
  timing utility.
- Semantic role aliases hold `var()` references, so they **re-resolve
  automatically in dark mode** without separate dark overrides.
- Theme is applied via `[data-theme="dark"]` on `<html>`; accent palette via
  `[data-palette="ember" | "monsoon_teal"]`.

### Semantic role map

| Role utility | Resolves to | Use for |
|--------------|-------------|---------|
| `text-content` | `ink` | Primary text |
| `text-content-muted` | `ink-2` | Secondary text, body |
| `text-content-subtle` | `ink-3` | Hints, timestamps, placeholders |
| `text-content-faint` | `ink-4` | Disabled text, faint dividers |
| `border-stroke` | `line` | Default borders |
| `bg-surface-base` | `surface` | Card/input fill |
| `bg-surface-raised` | `surface-elevated` | Elevated surfaces (modals, elevated cards) |
| `text-interactive` / `bg-interactive` | `accent` | Interactive affordances |
| `outline-focus` | `accent` | Focus rings |

> New components should prefer the semantic roles. The appearance-named tokens
> (`ink`, `paper`, `surface`, `line`, `accent`) remain valid and are used widely;
> they are not deprecated.

---

## 3. Color

### 3.1 Primary (Accent) + tonal ramp

| Token | Light | Dark | Tailwind | Usage |
|-------|-------|------|----------|-------|
| **Accent** | `#C96442` | `#C96442` (unchanged) | `bg-accent` / `text-accent` | CTAs, active states, links, icons |
| **Accent Soft** | `rgba(201,100,66,.10)` | same | `bg-accent-soft` | Selected/tint backgrounds |
| **Accent Container** | `#F8D5C8` | `rgba(201,100,66,.22)` | `bg-accent-container` | Filled chips, hover fills |

Full tonal ramp (`accent-50` … `accent-950`) exists for gradients and dark
surfaces. In **dark mode the ramp inverts** (50 = darkest, 950 = lightest) so
`accent-*` utilities keep their light→dark intent across themes.

| | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|--|--|--|--|--|--|--|--|--|--|--|--|
| Light | `#fdf5f1` | `#fae8de` | `#f8d5c8` | `#f0b49c` | `#e08e6e` | `#c96442` | `#b5533a` | `#964230` | `#7a352a` | `#642e26` | `#3a1810` |
| Dark | `#3a1810` | `#4a2218` | `rgba(..,.22)` | `rgba(..,.36)` | `rgba(..,.52)` | `#c96442` | `#d17847` | `#e08e6e` | `#f0b49c` | `#fae8de` | `#fdf5f1` |

### 3.2 Paper (backgrounds) & Surface

| Token | Light | Dark | Tailwind | Usage |
|-------|-------|------|----------|-------|
| **Paper** | `#F4F3EE` | `#1A1612` | `bg-paper` | Page scaffold |
| **Paper 2** | `#EDEBE3` | `#252018` | `bg-paper-2` | Sidebar, chip/track bg |
| **Paper 3** | `#E4E1D7` | `#342E28` | `bg-paper-3` | Deeper surface, pressed track |
| **Paper 4** | `#D8D4C7` | `#3A3430` | `bg-paper-4` | Deepest, disabled fills |
| **Surface** | `#FFFDF8` | `#2A2520` | `bg-surface` | Card/input fill (base) |
| **Surface Elevated** | `#FFFFFF` | `#342E28` | `bg-surface-elevated` | Raised surfaces - genuinely lighter than `surface` so elevation reads |

### 3.3 Ink (text)

| Token | Light | Dark | Tailwind | Contrast on surface (light) |
|-------|-------|------|----------|------|
| **Ink** | `#1F1A14` | `#F4F3EE` | `text-ink` | ~14:1 (AAA) |
| **Ink 2** | `#4A463E` | `#E4E1D7` | `text-ink-2` | ~8:1 (AAA) |
| **Ink 3** | `#756F65` | `#AAA397` | `text-ink-3` | ~4.7:1 (AA body) |
| **Ink 4** | `#B5AFA3` | `#6A645C` | `text-ink-4` | decorative/disabled only - not for body |

### 3.4 Line (borders)

| Token | Light | Dark | Tailwind |
|-------|-------|------|----------|
| **Line** | `rgba(31,26,20,.08)` | `rgba(244,243,238,.16)` | `border-line` |
| **Line 2** | `rgba(31,26,20,.04)` | `rgba(244,243,238,.08)` | `border-line-2` |
| **Line Low** | `rgba(31,26,20,.04)` | `rgba(244,243,238,.08)` | `border-line-low` |

> Dark-mode line uses the **warm-white ink hue** (`244,243,238`), not the
> dark-ink hue, so borders stay visible on dark surfaces.

### 3.5 Semantic status

| Token | Value | Soft | Usage |
|-------|-------|------|-------|
| **Success** | `#5B8C44` | `bg-success-soft` | Match rings ≥70%, confirmed, online |
| **Warning** | `#B57828` | `bg-warning-soft` | Pending, expiring, match 40-69% |
| **Error** | `#B4452C` | `bg-error-soft` | Errors, destructive, declined, match <40% |
| **Info** | `#C96442` (accent) | `bg-accent-soft` | Tips, informational badges |

### 3.6 Categorical palette (3 tiers)

Eight families for data viz, feature pills, profile/dimension labels. Each has
**soft** (background), **mid** (icon/accent on neutral bg), and **ink**
(accessible text *on* the soft background). Use `ink` for text on a `soft` fill;
use `mid` for icons or text on paper/surface.

| Family | Soft (light/dark) | Mid | Ink (light/dark) |
|--------|------|-----|------|
| Blue | `#E1EAF4` / `#253447` | `#5B88B5` | `#2A4868` / `#B8CDE4` |
| Purple | `#E7DDF1` / `#33283F` | `#8B7BB8` | `#4A3E70` / `#CDBCE8` |
| Green | `#DCEAD4` / `#273521` | `#6A9068` | `#2D4A2E` / `#BCD9AC` |
| Yellow | `#F5E8B8` / `#43361C` | `#C49840` | `#5C4318` / `#E6CF8E` |
| Orange | `#FCE0C8` / `#432A1C` | `#D17847` | `#5E3318` / `#F0C19A` |
| Teal | `#CFE4DF` / `#203B38` | `#5A9DA8` | `#1A4A52` / `#A9D2CF` |
| Pink | `#F6DDE3` / `#432833` | `#C28098` | `#6B3548` / `#E8B8C6` |

Accessed in code via `toneClasses[tone]` (`src/components/ui/component-utils.ts`):
`{ soft, text, inkText, border, icon, dot }`. **Use `inkText` for text on the
matching soft background** (this is what gives chips/badges accessible contrast).

### 3.7 Compatibility score colors

`≥70%` → Success green · `40-69%` → Warning amber · `<40%` → Error red. Always
pair the color with the numeric value (never color alone).

### 3.8 Palette themes

`[data-palette]` swaps the accent only (paper/ink unchanged):

| Palette | Accent | Container |
|---------|--------|-----------|
| **Terracotta** (default) | `#C96442` | `#F8D5C8` |
| **Ember** | `#D17847` | `#FCE0C8` |
| **Monsoon Teal** | `#5A9DA8` | `#CFE4DF` |

---

## 4. Typography

### 4.1 Families (loaded via `<link>` in `index.html`, `display: swap`)

- **Display / Headlines:** Fraunces (variable optical-size serif) - editorial,
  confident; uses `opsz`/`SOFT` variation settings; never bold (weight 400).
- **Body / UI:** Inter.
- **Mono / Eyebrow / Tabular:** JetBrains Mono.
- **Italic emphasis:** Instrument Serif (italic) - for inline emphasis and pull
  quotes, in place of bold.

### 4.2 Scale (as implemented - display sizes are fluid)

| Class | Size | Weight | Line height | Tracking | Font |
|-------|------|--------|-------------|----------|------|
| `text-display` | `clamp(1.75rem, 4vw, 2.75rem)` | 400 | 1.0 | -0.02em | Fraunces |
| `text-h1` | `clamp(1.5rem, 3vw, 2.25rem)` | 400 | 1.1 | -0.01em | Fraunces |
| `text-h2` | `clamp(1.25rem, 2.5vw, 1.75rem)` | 400 | 1.2 | - | Fraunces |
| `text-h3` | 1rem (16px) | 600 | 1.25 | -0.012em | Inter |
| `text-h4` | 0.875rem (14px) | 600 | 1.3 | -0.01em | Inter |
| `text-h5` | 0.8125rem (13px) | 600 | 1.35 | -0.005em | Inter |
| `text-h6` | 0.75rem (12px) | 600 | 1.4 | 0 | Inter |
| `text-body-lg` | 1rem (16px) | 500 | 1.5 | - | Inter |
| `text-body-md` | 0.875rem (14px) | 500 | 1.45 | - | Inter |
| `text-label-lg` | 0.875rem (14px) | 600 | 1.0 | 0.04em, uppercase | Inter |
| `text-label-md` | 0.75rem (12px) | 600 | 1.4 | 0.02em | Inter |
| `text-caption` | 0.75rem (12px) | 400 | 1.5 | - | Inter (ink-3) |
| `text-eyebrow` | 0.6875rem (11px) | 600 | 1.4 | 0.2em, uppercase | JetBrains Mono (accent) |
| `text-serif-italic` | inherit | 400 italic | inherit | - | Instrument Serif |
| `.tabular` | - | - | - | `tabular-nums` | - |

Display headlines scale fluidly with the viewport via `clamp()` - there is no
separate per-breakpoint size override.

### 4.3 Fraunces variation settings

`Display`: `'opsz' 144, 'SOFT' 50, 'WONK' 0` · `H1`: `'opsz' 112, 'SOFT' 40,
'WONK' 0` · `H2`: `'opsz' 96, 'SOFT' 30, 'WONK' 0`. `WONK: 0` keeps letterforms
readable.

### 4.4 Rules

- Body line length ≈ 65-70ch (`max-w-[65ch]`).
- Emphasis = Instrument Serif italic of the **same headline**, never a random
  injected serif word. Audit italic words with descenders (`g j p q y`) for
  clearing (`leading-[1.1]` + a little bottom padding).
- Eyebrows are rationed: at most one small uppercase label per ~3 sections on a
  marketing surface.

---

## 5. Spacing & Layout

Base unit **4px**; the working rhythm is the **8px** grid. Use Tailwind spacing
utilities (`gap-*`, `p-*`, `space-*`) - all multiples of 4px.

| Purpose | Token | Value |
|---------|-------|-------|
| Tight (icon ↔ label) | `gap-2` | 8px |
| Normal (fields, list items) | `gap-3` | 12px |
| Relaxed (heading ↔ content) | `gap-4` | 16px |
| Block separation | `gap-6` | 24px |
| Card internal padding | `p-4` | 16px |
| Screen edge (mobile → desktop) | `px-5` → `px-12` | 20 → 48px |
| Marketing section rhythm | `py-20` → `py-28` | 80 → 112px |

**Containers:** content `max-w-7xl` (1280px) centered; full-bleed sections
`max-w-screen-2xl` (1536px). Use CSS Grid over flex percentage math.

---

## 6. Elevation

Elevation = **surface tier + shadow + (optional) 1px lift on interaction**.
Shadows use warm-ink tints (`rgba(31,26,20,…)`); terracotta-tinted shadows use
`rgba(201,100,66,…)`. Never pure-black shadows.

| Level | Helper (`elevation.*`) | Shadow (light) | Surface | Used for |
|-------|------------------------|----------------|---------|----------|
| **Flat** | `flat` | `shadow-xs` `0 1px 2px /.04` | `surface` | Nav items, compact cards |
| **Raised** | `raised` | `shadow-sm` `0 2px 6px /.06` | `surface` | Standard content cards |
| **Overlay** | `overlay` | `shadow-md` `0 6px 18px /.08` | `surface` / hover | Hover lift, dropdowns, FAB |
| **Modal** | `modal` | `shadow-lg` (layered) | `surface-elevated` | Modals, drawers, toasts |

Component-tinted shadows: `shadow-cta` (terracotta CTA), `shadow-hover` (ambient
glow), `shadow-focus` (input focus glow). **Dark mode** reduces all shadow
intensity (dark surfaces carry inherent depth) and relies more on the
`surface` → `surface-elevated` lightness step.

`elevation` and `controlHeight` helpers live in
`src/components/ui/component-utils.ts`.

---

## 7. Z-Index Scale

Single source of stacking order (`--z-*` in `:root`). Never invent ad-hoc
`z-50`/`z-[999]` values; use the scale.

| Token | Value | Layer |
|-------|-------|-------|
| `--z-base` | 0 | In-flow content |
| `--z-raised` | 10 | Pop-ups within a section, sticky cell headers |
| `--z-sticky` | 30 | Sticky bars, sticky nav |
| `--z-overlay` | 40 | Scroll-progress bar, non-modal overlays |
| (grain) | 50 | Global noise texture (`body::before`) |
| `--z-modal` | 100 | Modals, drawers, bottom sheets |
| `--z-toast` | 200 | Toasts (above modals) |
| `--z-max` | 9999 | Skip link, escape hatch |

Usage: `className="z-[var(--z-modal)]"`.

---

## 8. Radius & Shape

One radius system; do not mix.

| Element | Radius | Tailwind |
|---------|--------|----------|
| Cards (standard) | 16px | `rounded-2xl` |
| Cards (compact) / icon containers / avatars (editorial) | 12px | `rounded-xl` |
| Buttons | 10px | `rounded-[10px]` |
| Inputs / nav items / icon buttons | 9px | `rounded-[9px]` |
| Dialog (desktop) | 8px | `rounded-lg` |
| Chips, toggles, pills, circular avatars | full | `rounded-full` |

Rule of thumb: containers 12-16px, controls 9-10px, anything pill-shaped is
fully rounded. Radius vars: `--radius-card/compact/button/control`.

---

## 9. Motion

### 9.1 Tokens

| Durations (`--duration-*`) | Easings (`--ease-*`) |
|----------------------------|----------------------|
| `fast` 120ms · `normal` 200ms · `slow` 300ms · `slowest` 400ms | `standard` `cubic-bezier(0,0,.2,1)` · `emphasized` `cubic-bezier(.16,1,.3,1)` · `spring` `cubic-bezier(.34,1.56,.64,1)` |

`ease-standard` general deceleration · `ease-emphasized` entrances/overlays ·
`ease-spring` chips/FAB/celebration overshoot. The shared `interactiveMotion`
class (`component-utils.ts`) applies `--duration-fast` + `--ease-standard` and
collapses to none under reduced motion.

### 9.2 Choreography (CSS utilities in `globals.css`)

- **Press:** `:active { scale(0.97) }` on buttons/cards/menu items (150ms).
- **Focus glow:** inputs gain `shadow-focus` + `scale(1.01)`.
- **Selection spring:** chips `scale(1.03)` with `--ease-spring`.
- **Staggered reveal:** `.stagger-1`…`.stagger-6` (80ms steps),
  `.hero-stagger-1`…`-5` (60ms), `.stagger-reveal > *` / `.stagger-cascade > *`
  using `--i` (60ms × index). Drive scroll reveals with `RevealSection` +
  `useInView` (IntersectionObserver) - never `window` scroll listeners.
- **SVG draw:** `.ring-draw` animates `stroke-dashoffset` (300-800ms) for
  compatibility/avatar rings.
- Named keyframes available: `page-fade`, `fade-slide-up`, `slide-up`,
  `drawer-in`, `bottom-sheet-in`, `scale-in`, `match-pop`, `shimmer`, `breathe`,
  `float-subtle`, `gradient-shift`, `cascade-in`, `spin-slow`.

### 9.3 Reduced motion (mandatory)

`@media (prefers-reduced-motion: reduce)` disables animations, transforms, and
infinite loops (already enforced globally in `globals.css`). Any motion above a
trivial hover must degrade gracefully. Keep ease-out curves only; no bounce
except the intentional `ease-spring` overshoot on chips/FAB.

---

## 10. Iconography

- **Primary:** `lucide-react` - the default icon set for UI. Standardize stroke
  at ~1.5-2; size at **16 / 20 / 24px** (`h-4`/`h-5`/`h-6`). Icons inherit
  `currentColor`; tint with `text-*` (use `mid` tier on neutral bg, `inkText`
  on soft fills).
- **Material glyphs:** `GoogleIcon` renders Google Material Symbols where the
  nav spec calls for them (`home`, `map`, `swap-horiz`, `chat-bubble`,
  `person`, `add-home`).
- One icon family per surface; never hand-roll SVG icon paths. Decorative icons
  get `aria-hidden="true"`; meaningful icons get an accessible label.

---

## 11. Component Library

All shared primitives live in `src/components/ui/`. Pages must compose these
rather than re-implement chrome/state handling.

### 11.1 System interaction states

Every interactive primitive implements these (the matrix referenced per
component below):

| State | Standard treatment |
|-------|--------------------|
| **Rest** | Token-defined fill/border/text |
| **Hover** (desktop) | Subtle bg/border shift, +shadow or 1px lift |
| **Active/Pressed** | `scale(0.97)` (150ms) |
| **Focus-visible** | `focusRing` = 2px accent outline, 2px offset (keyboard only) |
| **Disabled** | `paper-4` fill, `ink-3/4` text, no shadow, `cursor-not-allowed`, `pointer-events-none` |
| **Loading** | Spinner or skeleton matching final shape; `aria-busy` |
| **Selected** | `accent-container`/`accent-soft` fill + accent text/border |
| **Error** | `border-error`, error text below, `aria-invalid` |

Shared helpers: `focusRing`, `interactiveMotion`, `elevation`, `controlHeight`,
`toneClasses`, `cn` (all in `component-utils.ts`).

### 11.2 Control sizing

Heights are tokenized: `--control-h-sm` 42 · `--control-h-md` 48 ·
`--control-h-lg` 52 · `--control-h-xl` 56. **Touch target minimum `--touch-min`
44px.** Documented compact exceptions (paired with adequate spacing): chips
(36px), icon buttons (40px), switches.

### 11.3 Primitives

| Component | File | Purpose | Key states / notes |
|-----------|------|---------|--------------------|
| **Button** | `Button.tsx` | primary / secondary / tertiary / icon × compact/default/tall/icon | Full matrix; heights from `--control-h-*`; loading spinner; `shadow-cta` on primary |
| **Card** | `Card.tsx` | default / compact / **elevated** containers | `elevated` uses `surface-elevated` + `shadow-md`; `interactive` adds hover-lift + press + focus; `selected` = accent border + soft fill |
| **Chip** | `Chip.tsx` | filter / choice / info / removable | `role` radio/checkbox; selected spring `scale(1.03)`; removable splits remove button to avoid nested interactives |
| **Badge** | `Badge.tsx` | default / mode / verified / status / count | Tone via `toneClasses`; **text uses `inkText`** for contrast on soft fill |
| **Input / TextArea / SelectField** | `Input.tsx` | labeled fields via `FieldWrapper` | Label above (mono), helper/error below, leading/trailing icons, focus glow + `scale(1.01)`, `aria-invalid`/`aria-describedby`; min-h `--control-h-md` |
| **PhoneInput / PasswordInput** | `PhoneInput.tsx` / `PasswordInput.tsx` | formatted phone / show-hide password | Build on field chrome; password toggle has accessible label |
| **Toggle** | `Toggle.tsx` | switch | `role="switch"`, `aria-checked`; knob slides 200ms; disabled opacity |
| **SegmentedControl** | `SegmentedControl.tsx` | tabbed selector | `role="tablist"`, arrow-key roving focus, sliding `layoutId` pill (Framer Motion spring) |
| **StepProgress** | `StepProgress.tsx` | multi-step indicator | Accent fills for completed steps |
| **Modal / Drawer / BottomSheet** | `Modal.tsx` | overlays | `--z-modal`; `surface-elevated` panel; focus trap **+ focus restore on close**; Escape + overlay-click close; `aria-modal` |
| **Toast / ToastViewport** | `Toast.tsx` | transient notifications | `--z-toast` (above modals); `role=status`/`alert` + `aria-live` polite/assertive by type |
| **Skeleton** | `Skeleton.tsx` | shimmer placeholder | Match final layout; `aria-hidden`; `motion-reduce` safe |
| **Spinner** | `Spinner.tsx` | indeterminate load | Use sparingly; prefer skeletons for content |
| **StateViews** (`AsyncView`/`ErrorState`/`EmptyState`) | `StateViews.tsx` | load/empty/error wrappers | `ErrorState` always offers retry when `refetch` exists |
| **Avatar** | `Avatar.tsx` | profile/owner image | Gradient initials fallback; editorial 12px or circular; optional animated ring |
| **NetworkImage** | `NetworkImage.tsx` | image with blur/error fallback | Replaces raw `<img>`; graceful failed-load state |
| **ProgressRing** | `ProgressRing.tsx` | compatibility/score ring | Animated `stroke-dashoffset`; tone by threshold; `role=progressbar` |
| **SearchBar** | `SearchBar.tsx` | search input | 48px, focus glow + scale, leading/trailing icons |
| **Logo / ThemeToggle / TrustBadge / PriceText / OrDivider / Layout / FullPageMessage / PrefetchLink** | respective files | brand, theme switch, trust pill, formatted price, auth divider, page scaffold, full-viewport message, prefetching link | See file; all consume tokens + `focusRing` where interactive |

### 11.4 Utility classes (CSS, in `globals.css`)

| Class | Purpose |
|-------|---------|
| `.bento-card` | Bento tile: `surface` bg, 16px radius, hover lift. **Sets `background` shorthand - to layer a gradient inside, paint it on an absolute child, not the same element.** |
| `.card-glow` | Terracotta radial sheen on hover/focus-within |
| `.accent-pill` | Mono uppercase accent pill (step numbers, tags) |
| `.frosted` | `backdrop-filter: blur(var(--frost-blur))` + paper color-mix |
| `.noise-texture` | SVG grain overlay (fixed, `pointer-events-none`) |
| `.scroll-progress-bar` | Top reading-progress bar (`--z-overlay`) |
| `.content-grid` | `auto-fit` responsive card grid |
| `.hairline` | 0.5px line border |
| Gradients | hero-glow (radial trio), nudge (terracotta waitlist wash), shimmer |

---

## 12. Patterns

### 12.1 Async state (mandatory on every data page)

Handle **loading, error, empty** for all API-backed UI:

- **Loading:** content-shaped `<Skeleton>` matching the real layout (never a
  bare spinner where a skeleton fits). `aria-hidden` + `motion-reduce` safe.
- **Error:** never a full-page error on pages with non-API chrome. Render the
  page shell + an inline `<ErrorState>` (with retry) for the API-dependent
  section. Pages that *are* entirely the API response (maps, chat threads) may
  use a full-page error.
- **Empty:** composed `<EmptyState>` that shows how to populate.

Use `<AsyncView>` for simple load/error/empty/render flows. Server state is
owned by TanStack Query hooks (`src/hooks/queries/`); never mirror it into
Zustand.

### 12.2 Forms

Label **above** input; helper text optional but present in markup; error text
**below**. Never placeholder-as-label. `gap-2` within a field block. All field
chrome lives in `FieldWrapper` (`Input.tsx`).

### 12.3 Navigation (device-adaptive)

| Breakpoint | Min | Navigation |
|-----------|-----|-----------|
| Mobile | 0 | Bottom nav (5 tabs) |
| Tablet | 768px (`md`) | Collapsed icon sidebar (64px) |
| Desktop | 1024px (`lg`) | Full sidebar (240px) |
| Wide | 1440px (`xl`) | Wider sidebar (280px) |

Tabs are mode-dependent (Room Poster / Co-Hunter / Open to Both). Top bar 64px.
Theme toggle on: public header, app top bar, profile, `/settings/appearance`.

### 12.4 Density

Default density is documented above. A **compact** density (tighter paddings,
`--control-h-sm`, `gap-2`) is available for data-dense surfaces; apply at the
container level, never mix densities within one component.

---

## 13. Content & Voice

- **Tone:** warm, direct, confident. Gen-Z-natural but trustworthy enough for
  money. Concrete verbs over filler ("Find", "Book", "Match" - not "Elevate",
  "Seamless", "Unleash").
- **One label per intent.** Pick a single CTA label per action and reuse it
  (e.g. one "Start matching", not "Join"/"Get started"/"Start swiping" mixed).
- **No em dashes** anywhere (§1). Use commas, colons, parentheses.
- **Errors:** plain, actionable, no blame ("We couldn't load your matches.
  Retry?"). **Empty states:** say what goes here and how to add it.
- **Names/numbers** in mock UI: realistic and locale-appropriate; never
  "John Doe" / fake-precise stats presented as real.

---

## 14. Accessibility

- **Contrast:** WCAG AA min for text (4.5:1 body, 3:1 large), AAA target for
  hero copy. `ink-4` is decorative only. Categorical text on soft fills uses the
  `inkText` tier.
- **Targets:** 44px minimum (`--touch-min`); documented compact exceptions in
  §11.2.
- **Focus:** visible `:focus-visible` ring on every interactive element
  (`focusRing`); mouse clicks don't show it. Modals trap focus and **restore it
  on close**.
- **Keyboard:** Tab/Shift-Tab, Enter/Space activate, Escape dismisses,
  arrow-key roving in segmented/sidebar, skip link first in tab order.
- **Color isn't the only signal** (icons/text accompany status color).
- **Reduced motion / high contrast:** honored globally (§9.3;
  `prefers-contrast: more` raises line + ink-3 contrast).

---

## 15. Dark Mode

Dual-mode by default; design and test both. Theme via `[data-theme="dark"]` on
`<html>`, set pre-paint by an inline script in `index.html` (reads
`localStorage` then `prefers-color-scheme`). State lives in `uiStore`
(`src/lib/stores/ui-store.ts`); reusable `<ThemeToggle>`.

Rules: accent stays `#C96442`; ink lightens to warm equivalents; **borders use
the warm-white line hue**; shadows reduce; `surface` → `surface-elevated`
lightness step carries elevation; categorical soft tiers darken and pair with
the light `inkText` tier. Full token values are in §3 (light/dark columns) and
mirror `globals.css` exactly. Default to system preference unless the brand
insists.

---

## 16. Performance Budget

| Metric | Target |
|--------|--------|
| FCP | < 1.5s |
| LCP | < 2.5s (hero image preloaded/`priority`) |
| CLS | < 0.1 (reserve space for images/fonts) |
| INP | < 200ms |
| JS bundle (gzip) | < 200KB |

Apply grain/noise only to fixed `pointer-events-none` layers; lazy-load
below-fold and heavy deps; animate only `transform`/`opacity`.

---

## 17. Maintenance

- This file is the source of truth. Any token/utility/component change updates
  it **in the same commit**; nothing documented here may be fictional.
- Keep `globals.css`, `component-utils.ts`, and this doc in lockstep (values
  must match exactly).
- `AGENTS.md` and `CLAUDE.md` mirror conventions referenced here - update them
  when structure, tokens, or architecture change.
- Visual PRs: reference the tokens used, include light **and** dark screenshots,
  and verify the reduced-motion path.
