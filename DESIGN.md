# DESIGN.md - 360 Flatmates Web Design System

> **Single source of truth** for UI tokens, component specs, and interaction
> standards for the 360 Flatmates web app. Every visual change references this
> file, and every token/utility/component documented here exists in code
> (`src/styles/globals.css`, `src/components/ui/`). If the doc and the code ever
> disagree, that is a bug - fix it in the same change.

---

## 1. Principles

The product is a compatibility-first flatmate-matching app with a friendly,
illustration-led public face and a restrained task-focused application shell.
The core differentiator remains **6-dimension lifestyle compatibility**, not
budget-only filtering.

**Physical scene.** A 26-year-old renter browses on a laptop or phone between
work calls in Bangalore or Gurugram. They are under time pressure, but trust is
the deciding factor. The public site should feel optimistic and human; the app
should feel calm, scannable, and reliable enough for rent, visits, and chat.

**Decision tenets**:

1. **Friendly, not decorative.** Use original Flatmates illustrations on public
   and onboarding surfaces; keep authenticated workflows focused on the task.
2. **Violet is the primary product color.** `#6E57E8` owns links, active states,
   focus, selected surfaces, and primary CTAs.
3. **Yellow is an action highlight.** `#FFE85A` is reserved for hero search,
   black CTA banners, and high-emphasis public actions.
4. **Warm paper and ink carry trust.** Never use pure `#000` or pure `#fff` for
   page-level content surfaces.
5. **Hierarchy by weight, color, and space.** Product screens use restrained
   type scale; landing heroes may use the dedicated hero display class.
6. **Every interactive element earns states**: rest, hover, active,
   focus-visible, disabled, and loading where relevant.
7. **Motion is motivated.** It communicates hierarchy, feedback, or state
   change, and collapses under `prefers-reduced-motion`.
8. **Never use em dashes.** Use commas, colons, or parentheses instead.

---

## 2. Token Architecture

Tokens live in `src/styles/globals.css`. There are three layers:

| Layer | What it is | Examples | When to use |
|-------|-----------|----------|-------------|
| **Primitive** | Raw palette/scale values | `--color-primary`, `--color-action`, `--color-ink`, `--shadow-md` | Building new tokens |
| **Semantic role** | Intent-named aliases over primitives | `--color-content`, `--color-surface-raised`, `--color-interactive`, `--color-focus` | Preferred in new component code |
| **Component** | Local choices inside a component | Button variants, card variants, landing panels | Inside one component only |

- Tailwind v4 generates utilities from the `@theme` block: every `--color-*`
  becomes `text-* / bg-* / border-*`, every `--ease-*` becomes an `ease-*`
  timing utility.
- `primary` is the new brand token. Existing `accent` utilities intentionally
  alias the same violet value so legacy component code migrates safely.
- `action` is not a second primary. Use it only for yellow high-emphasis public
  actions and dark CTA banners.
- Theme is applied via `[data-theme="dark"]` on `<html>`. Palette overrides
  should be rare and must not break the violet brand read.

### Semantic role map

| Role utility | Resolves to | Use for |
|--------------|-------------|---------|
| `text-content` | `ink` | Primary text |
| `text-content-muted` | `ink-2` | Secondary text, body |
| `text-content-subtle` | `ink-3` | Hints, timestamps, placeholders |
| `text-content-faint` | `ink-4` | Disabled text, faint dividers |
| `border-stroke` | `line` | Default borders |
| `bg-surface-base` | `surface` | Card/input fill |
| `bg-surface-raised` | `surface-elevated` | Modals, raised cards, overlays |
| `text-interactive` / `bg-interactive` | `primary` | Interactive affordances |
| `outline-focus` | `primary` | Focus rings |

---

## 3. Color

### 3.1 Brand and action tokens

| Token | Light | Dark | Tailwind | Usage |
|-------|-------|------|----------|-------|
| **Primary** | `#6E57E8` | `#9B87FF` | `bg-primary` / `text-primary` | Brand color, selected states, focus, links |
| **Primary Soft** | `rgba(110,87,232,.12)` | `rgba(155,135,255,.18)` | `bg-primary-soft` | Selected/tint backgrounds |
| **Primary Container** | `#E9E5FF` | `rgba(155,135,255,.24)` | `bg-primary-container` | Filled chips, hover fills |
| **Accent** | same as primary | same as primary | `bg-accent` / `text-accent` | Backward-compatible alias |
| **Action** | `#FFE85A` | `#FFE85A` | `bg-action` | Hero search button, black CTA button |
| **Action Ink** | `#241D06` | `#241D06` | `text-action-ink` | Text/icons on yellow |
| **Lavender** | `#E9E5FF` | `#2D2649` | `bg-lavender` | Public panels, gentle product highlights |
| **Peach / Sky / Mint** | `#F6E1D8` / `#E1EBF3` / `#E4EDE0` | `#382722` / `#202B34` / `#212A22` | `bg-peach` / `bg-sky` / `bg-mint` | Pastel section backgrounds for alternating rhythm (calmer than categorical `-soft`); body stays `paper` |
| **Map Line** | `rgba(32,29,27,.07)` | `rgba(247,245,236,.08)` | `--color-map-line` | Landing/page map-grid background |

Full tonal ramp (`accent-50` … `accent-950`) remains available and now maps to
the violet family.

| | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|--|--|--|--|--|--|--|--|--|--|--|--|
| Light | `#F7F5FF` | `#EEEAFF` | `#DFD8FF` | `#C4B8FF` | `#9B87FF` | `#6E57E8` | `#5F46D8` | `#4F37BD` | `#412D98` | `#372875` | `#21164D` |
| Dark | `#21164D` | `#2B1F63` | `rgba(155,135,255,.18)` | `rgba(155,135,255,.30)` | `rgba(155,135,255,.46)` | `#9B87FF` | `#B3A5FF` | `#C4B8FF` | `#DFD8FF` | `#EEEAFF` | `#F7F5FF` |

### 3.2 Paper and surfaces

| Token | Light | Dark | Tailwind | Usage |
|-------|-------|------|----------|-------|
| **Paper** | `#F7F5EC` | `#17151F` | `bg-paper` | Page scaffold |
| **Paper 2** | `#EEEADF` | `#201D2D` | `bg-paper-2` | Sidebar, chip/track bg |
| **Paper 3** | `#E2DDD0` | `#2C263D` | `bg-paper-3` | Pressed track, dense panels |
| **Paper 4** | `#D3CBBB` | `#39334A` | `bg-paper-4` | Disabled fills |
| **Surface** | `#FFFEFA` | `#242130` | `bg-surface` | Card/input fill |
| **Surface Elevated** | `#FFFFFF` | `#302B40` | `bg-surface-elevated` | Modals, drawers, toasts |

### 3.3 Ink and lines

| Token | Light | Dark | Tailwind | Usage |
|-------|-------|------|----------|------|
| **Ink** | `#201D1B` | `#F7F5EC` | `text-ink` | Primary text |
| **Ink 2** | `#47413C` | `#E7E1D2` | `text-ink-2` | Secondary text |
| **Ink 3** | `#746C62` | `#B9B0A0` | `text-ink-3` | Hints, timestamps, placeholders |
| **Ink 4** | `#B8AFA0` | `#746C62` | `text-ink-4` | Disabled/decorative only |
| **Line** | `rgba(32,29,27,.10)` | `rgba(247,245,236,.16)` | `border-line` | Default borders |
| **Line Low** | `rgba(32,29,27,.05)` | `rgba(247,245,236,.08)` | `border-line-low` | Hairlines, section dividers |

### 3.4 Semantic status

| Token | Value | Soft | Usage |
|-------|-------|------|-------|
| **Success** | `#638F4C` | `bg-success-soft` | Match rings ≥70%, confirmed, online |
| **Warning** | `#A97822` | `bg-warning-soft` | Pending, expiring, match 40-69% |
| **Error** | `#B64A38` | `bg-error-soft` | Errors, destructive, declined, match <40% |
| **Info** | `primary` | `bg-accent-soft` | Tips, informational badges |

### 3.5 Categorical palette

Categorical colors remain soft and functional. Use them for compatibility
dimensions, profile labels, and data visualization only, not general decoration.

| Family | Soft (light/dark) | Mid | Ink (light/dark) |
|--------|------|-----|------|
| Blue | `#DFEAF7` / `#253447` | `#5D84B7` | `#28496D` / `#B8CDE4` |
| Purple | `#E9E5FF` / `#33283F` | `#6E57E8` | `#4630A7` / `#CDBCE8` |
| Green | `#E1EAD7` / `#273521` | `#6F9463` | `#314F2D` / `#BCD9AC` |
| Yellow | `#FFF4B8` / `#43361C` | `#B3921C` | `#574711` / `#E6CF8E` |
| Orange | `#F7DDC6` / `#432A1C` | `#C77A46` | `#5F371B` / `#F0C19A` |
| Teal | `#D7E9E5` / `#203B38` | `#559AA2` | `#184A50` / `#A9D2CF` |
| Pink | `#F4DEE9` / `#432833` | `#BC7898` | `#65354D` / `#E8B8C6` |

Accessed in code via `toneClasses[tone]` (`src/components/ui/component-utils.ts`):
`{ soft, text, inkText, border, icon, dot }`. Use `inkText` for text on the
matching soft background.

### 3.6 Brand partner palettes

These are the **fixed** brand colors for third-party identity surfaces; do not
palette-swap them. Each gets its own four-token set (`-bg`, `-text`, `-border`,
`-hover`) and overrides automatically in dark mode.

| Brand | Light bg | Light text | Light border | Light hover | Dark bg | Dark text | Dark border | Dark hover |
|-------|----------|------------|--------------|-------------|---------|-----------|-------------|------------|
| **Google** (Material 3) | `#FFFFFF` | `#3C4043` | `#DADCE0` | `#F8F9FA` | `#131314` | `#E3E3E3` | `#8E918F` | `#1E1F20` |

Accessed via Tailwind: `bg-google-bg`, `text-google-text`,
`border-google-border`, `hover:bg-google-hover`.

### 3.7 Compatibility score colors

`≥70%` → Success green · `40-69%` → Warning amber · `<40%` → Error red. Always
pair the color with the numeric value (never color alone).

### 3.8 Palette themes

`[data-palette]` is a user preference hook and should be used sparingly. New
work should keep the violet primary stable. Existing palette toggles swap
`accent`; they do not change `primary`, `action`, paper, or ink. Older stored
`terracotta` preferences are normalized to `violet` at boot.

| Palette | Accent | Container |
|---------|--------|-----------|
| **Violet** (`violet`) | `#6E57E8` | `#E9E5FF` |
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
| `text-hero-display` | `clamp(3rem, 7vw, 5.6rem)` | 400 | 1.03 | -0.025em | Fraunces |
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

`text-hero-display` is for the public landing hero only. Product screens use
the tighter `text-display` / `text-h*` scale.

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
Shadows use warm-ink tints (`rgba(32,29,27,…)`); primary-tinted shadows use
`rgba(110,87,232,…)`. Never pure-black shadows.

| Level | Helper (`elevation.*`) | Shadow (light) | Surface | Used for |
|-------|------------------------|----------------|---------|----------|
| **Flat** | `flat` | `shadow-xs` `0 1px 2px /.04` | `surface` | Nav items, compact cards |
| **Raised** | `raised` | `shadow-sm` `0 2px 6px /.06` | `surface` | Standard content cards |
| **Overlay** | `overlay` | `shadow-md` `0 6px 18px /.08` | `surface` / hover | Hover lift, dropdowns, FAB |
| **Modal** | `modal` | `shadow-lg` (layered) | `surface-elevated` | Modals, drawers, toasts |

Component-tinted shadows: `shadow-cta` (primary CTA), `shadow-hover` (ambient
lift), `shadow-focus` (input focus glow). **Dark mode** reduces all shadow
intensity (dark surfaces carry inherent depth) and relies more on the
`surface` → `surface-elevated` lightness step.

### 6.1 Neo-brutalist hard shadows (deliberate accent)

`shadow-hard` / `shadow-hard-sm` / `shadow-hard-lg` / `shadow-hard-accent` /
`shadow-hard-action` / `shadow-hard-paper` are **zero-blur colored offset
drops** (`0 6px 0 0 <color>`) used for the playful, confident register on
public/marketing surfaces (hero cards, comparison panels, CTAs, bento cells).

Rules:
- Pair with a **solid fill only** (or no border). Never combine a hard shadow
  with a `1px` border plus a blur shadow (the ghost-card tell).
- Use selectively for emphasis, not on every card (monotony kills the effect).
- Hover may `translateY(-2px to -3px)` to widen the perceived offset; collapse
  the transform under reduced motion.
- Dark mode re-tunes the ink/paper variants to dark drops (read as depth); the
  accent/action variants keep their color (reads as a colored edge).

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
| Promo panels (landing only) | 28px | `rounded-[var(--radius-promo)]` |
| Large panels | 24px | `rounded-[var(--radius-panel)]` |
| Buttons | 10px | `rounded-[10px]` |
| Inputs / nav items / icon buttons | 9px | `rounded-[9px]` |
| Dialog (desktop) | 8px | `rounded-lg` |
| Chips, toggles, pills, circular avatars | full | `rounded-full` |

Rule of thumb: product containers 12-16px, landing promo panels may use 28px,
controls 9-10px, anything pill-shaped is fully rounded. Radius vars:
`--radius-card/compact/button/control/panel/promo`.

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
| **Button** | `Button.tsx` | primary / **highlight** / secondary / tertiary / icon / google / destructive / inverted × compact/default/tall/icon | Full matrix; `highlight` = yellow `action` fill for hero search and black CTA banners only; loading spinner hides `trailingIcon`; `google` uses Material 3 brand tokens |
| **Card** | `Card.tsx` | default / compact / **elevated** / **flat** / **stacked** / **promo** / **illustration** containers | `promo` and `illustration` use `--radius-promo` for landing-only panels; product cards stay 12-16px; `interactive` adds hover-lift + press + focus; `selected` = accent border + soft fill |
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
| `.card-glow` | Primary radial sheen on hover/focus-within |
| `.accent-pill` | Mono uppercase accent pill (step numbers, tags) |
| `.frosted` | `backdrop-filter: blur(var(--frost-blur))` + paper color-mix |
| `.noise-texture` | SVG grain overlay (fixed, `pointer-events-none`) |
| `.scroll-progress-bar` | Top reading-progress bar (`--z-overlay`) |
| `.content-grid` | `auto-fit` responsive card grid |
| `.hairline` | 0.5px line border |
| Gradients | map grid, primary sheen, shimmer |

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
- **Trust bands:** use concrete product capabilities unless metrics are sourced
  from real analytics. Do not invent press logos, aggregate counts, or average
  match scores for credibility.

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

Rules: primary stays recognizably violet; ink lightens to warm equivalents;
**borders use the warm-white line hue**; shadows reduce; `surface` → `surface-elevated`
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
