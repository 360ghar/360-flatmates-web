# Design system

**Active contributors:** Saksham

## Purpose

The 360 Flatmates interface is warm-editorial by design: approachable like a good journal, trustworthy enough for rent and deposits, and human in a sea of generic property portals. This page documents how that look is engineered, the three-tier token system that powers it, and how shared UI primitives compose into pages. For the full, canonical token values and every component spec, read [DESIGN.md](../../DESIGN.md), the single source of truth. This wiki page summarizes and points to it; it does not replace it.

If the doc and the code ever disagree, that is a bug. Fix both in the same change.

## Token architecture

Tokens live in `src/styles/globals.css` and are organized in three layers. Tailwind CSS v4 reads the `@theme` block and generates utilities from it: every `--color-*` becomes `text-*`, `bg-*`, `border-*`; every `--ease-*` becomes an `ease-*` timing utility. The three tiers are:

| Tier | What it is | Example | When to use |
| --- | --- | --- | --- |
| **Primitive** | Raw palette and scale values | `--color-ink`, `--color-accent-500`, `--shadow-md` | Building new tokens |
| **Semantic role** | Intent-named aliases over primitives | `--color-content`, `--color-surface-raised`, `--color-interactive` | **Preferred** in new component code |
| **Component** | Local choices inside one component | Button `variantClasses`, Card `variantClasses`, `toneClasses` | Inside one component only |

The semantic roles hold `var()` references to the primitives, so they **re-resolve automatically in dark mode** without separate dark overrides. This is the key reason the codebase stays maintainable: components consume semantic roles, and the theme swap happens one layer down.

### Semantic role map

| Role utility | Resolves to | Use for |
| --- | --- | --- |
| `text-content` | `ink` | Primary text |
| `text-content-muted` | `ink-2` | Secondary text, body |
| `text-content-subtle` | `ink-3` | Hints, timestamps, placeholders |
| `text-content-faint` | `ink-4` | Disabled text, faint dividers |
| `border-stroke` | `line` | Default borders |
| `bg-surface-base` | `surface` | Card and input fill |
| `bg-surface-raised` | `surface-elevated` | Elevated surfaces (modals, raised cards) |
| `text-interactive` / `bg-interactive` | `accent` | Interactive affordances |
| `outline-focus` | `accent` | Focus rings |

The appearance-named tokens (`ink`, `paper`, `surface`, `line`, `accent`) remain valid and are used widely; they are not deprecated. New code should prefer the semantic roles.

```mermaid
graph TD
    subgraph Primitive["Primitive tier (raw values in :root)"]
        P1["--color-ink #1F1A14"]
        P2["--color-accent-500 #C96442"]
        P3["--color-surface-elevated #FFFFFF"]
        P4["--shadow-md 0 6px 18px / .08"]
    end
    subgraph Semantic["Semantic role tier (var() aliases)"]
        S1["--color-content"]
        S2["--color-interactive / --color-focus"]
        S3["--color-surface-raised"]
    end
    subgraph Component["Component tier (local class maps)"]
        C1["Button variantClasses<br/>(primary uses bg-accent + shadow-cta)"]
        C2["Card variantClasses<br/>(elevated uses bg-surface-elevated + shadow-md)"]
        C3["toneClasses[tone]<br/>(soft + inkText + border)"]
    end
    S1 -->|var(--color-ink)| P1
    S2 -->|var(--color-accent)| P2
    S3 -->|var(--color-surface-elevated)| P3
    C1 --> S2
    C2 --> S3
    C3 --> S2
    Dark["[data-theme=dark] override"] -.->|re-points primitives| P1
    Dark -.-> P3
    Dark -.-> P4
```

Dark mode works by re-pointing the **primitive** tokens; the semantic `var()` chain follows automatically, so components rarely need a dark override.

## Color

Terracotta `#C96442` is the one brand accent. Used with intent for CTAs, active states, links, and icons. The full light and dark values for every ramp, paper, surface, ink, and line token live in [DESIGN.md](../../DESIGN.md) section 3. What matters here is how the system is structured.

**Accent ramp.** A full `accent-50` through `accent-950` ramp exists for gradients and dark surfaces. In **dark mode the ramp inverts** (50 becomes darkest, 950 becomes lightest) so `accent-*` utilities keep their light-to-dark intent across themes. `--color-accent-soft` (10% accent) is the selected and tint background; `--color-accent-container` (`#F8D5C8` light) is the filled chip and hover fill.

**Paper, surface, line.** Four paper tiers (`paper` through `paper-4`) carry the page scaffold and progressively deeper surfaces. `surface` is the card and input fill; `surface-elevated` is genuinely lighter than `surface` so raised UI reads as depth. Lines use the warm-ink hue in light mode and the **warm-white ink hue** in dark mode, so borders stay visible on dark surfaces.

**Ink.** Four text tiers (`ink` through `ink-4`). `ink` hits ~14:1 contrast on surface (AAA). `ink-3` is the AA body minimum. `ink-4` is decorative and disabled only, never body text.

**Semantic status.** `success` (green, `#5B8C44`), `warning` (amber, `#B57828`), `error` (red, `#B4452C`). Each has a `-soft` variant. Info reuses the accent. Color is never the only signal: every status is paired with an icon or text. Compatibility scores map to these tiers: 70%+ success, 40 to 69% warning, below 40% error.

**Categorical palette.** Seven families (blue, purple, green, yellow, orange, teal, pink) for data viz, feature pills, and dimension labels. Each family ships three tiers, accessed in code via `toneClasses[tone]` in `src/components/ui/component-utils.ts`:

- `soft` (the background fill)
- `mid` / `text` (the icon or text on a plain paper or surface background)
- `inkText` (the **accessible** text color for use on the matching `soft` background)

> Use the `inkText` tier for text sitting on a `soft` fill, not the `text` tier. This is what gives chips and badges accessible contrast. For example, a teal badge uses `bg-teal-soft` with `text-teal-ink`, never `text-teal-mid`.

Palette themes (`[data-palette]`) swap the accent only. Default terracotta, optional Ember (`#D17847`) and Monsoon Teal (`#5A9DA8`); paper and ink are unchanged.

## Typography

Four families, all loaded via `<link>` in `index.html` with `display: swap`:

- **Fraunces** (variable optical-size serif) for display and headlines. Never bold; weight 400. Editorial and confident.
- **Inter** for body and UI.
- **JetBrains Mono** for eyebrows and tabular numbers.
- **Instrument Serif** (italic) for inline emphasis and pull quotes, in place of bold.

**Fraunces variation settings** are tuned per headline size: `text-display` uses `'opsz' 144, 'SOFT' 50, 'WONK' 0`; `text-h1` uses `'opsz' 112, 'SOFT' 40, 'WONK' 0`; `text-h2` uses `'opsz' 96, 'SOFT' 30, 'WONK' 0`. `WONK: 0` keeps letterforms readable.

The type scale is fluid: `text-display`, `text-h1`, and `text-h2` scale with the viewport via `clamp()`, so there is no per-breakpoint size override. Body line length targets roughly 65 to 70 characters (`max-w-[65ch]`). The full scale (sizes, weights, line heights, tracking per class) is in [DESIGN.md](../../DESIGN.md) section 4. Italic emphasis is always the Instrument Serif italic of the same headline, never a randomly injected serif word.

## Dark mode

Dual-mode by default. Every visual change is designed and tested in both light and dark. Theme is applied via `[data-theme="dark"]` on `<html>`, set pre-paint by an inline script in `index.html` that reads `localStorage` then `prefers-color-scheme`. State lives in `uiStore` (`src/lib/stores/ui-store.ts`) and the reusable toggle is `src/components/ui/ThemeToggle.tsx`.

What changes in dark mode: paper and surface darken to warm equivalents, ink lightens, shadows reduce, categorical soft tiers darken and pair with the light `inkText` tier, and the accent ramp inverts (while the accent itself stays `#C96442`). What stays: the accent value, the `var()` indirection of the semantic roles, and the warm hue family of the borders. Default theme is **light**, not system, unless the brand insists otherwise.

## Motion tokens and choreography

Motion is motivated: it communicates hierarchy, feedback, or a state change, and it always collapses under `prefers-reduced-motion` (already enforced globally in `src/styles/globals.css`).

**Durations** (`--duration-*`): `fast` 120ms, `normal` 200ms, `slow` 300ms, `slowest` 400ms. **Easings** (`--ease-*`): `standard` (general deceleration), `emphasized` (entrances and overlays), `spring` (chips, FAB, celebration overshoot only).

Shared helpers in `src/components/ui/component-utils.ts`:

- `interactiveMotion` applies `--duration-fast` + `--ease-standard` and collapses to none under reduced motion.
- `focusRing` is the 2px accent outline, 2px offset, keyboard-only ring.
- `elevation` maps the four shadow tiers (`flat`, `raised`, `overlay`, `modal`).
- `controlHeight` maps the four canonical control heights (`sm` 42, `md` 48, `lg` 52, `xl` 56), all at or above the 44px `--touch-min`.

Choreography is CSS-driven: press is `:active { scale(0.97) }` (150ms), inputs gain `shadow-focus` + `scale(1.01)` on focus, chips spring `scale(1.03)` on select, and reveals use `.stagger-*` classes or `RevealSection` + `useInView` (IntersectionObserver), never `window` scroll listeners. Named keyframes include `page-fade`, `fade-slide-up`, `drawer-in`, `bottom-sheet-in`, `match-pop`, `shimmer`, `breathe`. See [DESIGN.md](../../DESIGN.md) section 9 for the full list and the reduced-motion contract.

## Shared primitives

Pages compose these instead of re-implementing chrome or state handling. All live in `src/components/ui/` and are re-exported from `src/components/ui/index.ts`. Every interactive primitive implements the full state matrix: rest, hover, active, focus-visible, disabled, loading, selected, error.

| Primitive | File | Purpose |
| --- | --- | --- |
| `Button` | `src/components/ui/Button.tsx` | primary, secondary, tertiary, icon, and google variants across compact, default, tall, and icon sizes; loading spinner; `shadow-cta` on primary |
| `Card` | `src/components/ui/Card.tsx` | default, compact, and elevated containers; `interactive` adds hover-lift, press, and focus; `selected` is accent border + soft fill |
| `Chip` | `src/components/ui/Chip.tsx` | filter, choice, info, and removable; selected spring; removable splits the remove button to avoid nested interactives |
| `Badge` | `src/components/ui/Badge.tsx` | default, mode, verified, status, and count; tone via `toneClasses`, **text uses `inkText`** for contrast on soft fill |
| `Input`, `TextArea`, `SelectField` | `src/components/ui/Input.tsx` | labeled fields built on the `FieldWrapper` pattern (label above, helper or error below) |
| `PhoneInput` | `src/components/ui/PhoneInput.tsx` | formatted phone field on shared field chrome |
| `PasswordInput` | `src/components/ui/PasswordInput.tsx` | show and hide password with an accessible toggle |
| `Toggle` | `src/components/ui/Toggle.tsx` | switch, `role="switch"`, `aria-checked`, 200ms knob slide |
| `SegmentedControl` | `src/components/ui/SegmentedControl.tsx` | tabbed selector, roving arrow-key focus, sliding `layoutId` pill |
| `StepProgress` | `src/components/ui/StepProgress.tsx` | multi-step indicator, accent fills for completed steps |
| `Modal`, `Drawer`, `BottomSheet` | `src/components/ui/Modal.tsx` | overlays at `--z-modal` on `surface-elevated`; focus trap with restore on close; Escape and overlay-click close |
| `Toast`, `ToastViewport` | `src/components/ui/Toast.tsx` | transient notifications at `--z-toast`, `aria-live` polite or assertive by type |
| `Skeleton` | `src/components/ui/Skeleton.tsx` | shimmer placeholders matching the real layout, one variant per major surface, `aria-hidden` |
| `Spinner` | `src/components/ui/Spinner.tsx` | indeterminate load, used sparingly (prefer skeletons for content) |
| `AsyncView`, `ErrorState`, `EmptyState` | `src/components/ui/StateViews.tsx` | load, error, empty wrappers; `ErrorState` offers retry when `refetch` exists |
| `Avatar` | `src/components/ui/Avatar.tsx` | profile and owner image with gradient initials fallback and optional animated ring |
| `NetworkImage` | `src/components/ui/NetworkImage.tsx` | image with blur and error fallback, replaces raw `<img>` |
| `ProgressRing` | `src/components/ui/ProgressRing.tsx` | animated `stroke-dashoffset` ring, tone by threshold, `role=progressbar` |
| `SearchBar` | `src/components/ui/SearchBar.tsx` | 48px search input with focus glow and scale |
| `ThemeToggle` | `src/components/ui/ThemeToggle.tsx` | light, dark, and system switch |
| `Logo` | `src/components/ui/Logo.tsx` | brand mark |
| `TrustBadge` | `src/components/ui/TrustBadge.tsx` | trust pill |
| `PriceText` | `src/components/ui/PriceText.tsx` | formatted price |
| `OrDivider` | `src/components/ui/OrDivider.tsx` | auth divider |
| `GoogleIcon` | `src/components/ui/GoogleIcon.tsx` | Google Material Symbols glyph for the nav |
| `Layout`, `FullPageMessage`, `PrefetchLink` | respective files in `src/components/ui/` | page scaffold, full-viewport message, prefetching link |
| `RevealSection`, `ScrollProgressBar` | respective files in `src/components/ui/` | IntersectionObserver-driven reveal and top reading-progress bar |

### The `FieldWrapper` pattern

Form fields share one chrome via `FieldWrapper` in `src/components/ui/Input.tsx`. It renders a label above, the control in the middle, and helper or error text below, and it generates stable `controlId`, `helperId`, and `errorId` values that the control wires into `aria-describedby` and `aria-invalid`. Never use placeholder-as-label. Keep `gap-2` within a field block.

### The async-state contract

Every page that fetches data must handle loading, error, and empty. Loading is a content-shaped `<Skeleton>` matching the real layout (never a bare spinner where a skeleton fits). Error is never a full-page `<ErrorState>` early return on pages that have non-API chrome; render the page shell and show an inline `<ErrorState>` inside a `<Card>` for the API-dependent section, with `onRetry={refetch}`. Empty is an `<EmptyState>` that says what goes here and how to add it. `<AsyncView>` handles the simple flow. The full pattern is in [Patterns and conventions](../how-to-contribute/patterns-and-conventions.md) and [CLAUDE.md](../../CLAUDE.md).

## Utility CSS classes

Beyond the Tailwind-generated utilities, `src/styles/globals.css` defines these reusable classes:

| Class | Purpose |
| --- | --- |
| `.page-fade` | 600ms page entrance |
| `.fade-slide-up` | 300ms content entrance |
| `.shimmer` | skeleton sweep, sets `background-size: 220%` for the animation |
| `.frosted` | `backdrop-filter: blur(var(--frost-blur))` plus paper color-mix |
| `.content-grid` | responsive `auto-fit` card grid |
| `.hairline` | 0.5px line border |
| `.breathing` | slow `breathe` pulse for empty-state icons |
| `.scrollbar-thin` | thin scrollbar styling |
| `.sr-only` / `.skip-link` | screen-reader-only and focusable skip link |
| `.reveal` | scroll-triggered fade and rise, paired with `RevealSection` |

[DESIGN.md](../../DESIGN.md) section 11.4 documents the full utility inventory, including the bento, card-glow, accent-pill, noise-texture, and scroll-progress classes.

## Key source files

| File | Role |
| --- | --- |
| `DESIGN.md` | Canonical source of truth for all tokens, component specs, and visual targets |
| `src/styles/globals.css` | The token definitions, type scale, keyframes, and utility classes |
| `src/components/ui/component-utils.ts` | `cn`, `focusRing`, `interactiveMotion`, `elevation`, `controlHeight`, `toneClasses`, `Tone` |
| `src/components/ui/index.ts` | Barrel export for every shared primitive |
| `src/components/ui/Button.tsx` | Button variants and the `buttonClasses` helper for link styling |
| `src/components/ui/Card.tsx` | Card variants and the interactive and selected states |
| `src/components/ui/Chip.tsx` | Chip variants and the selected spring |
| `src/components/ui/Badge.tsx` | Badge variants resolving mode and status to tones |
| `src/components/ui/Input.tsx` | `FieldWrapper`, `Input`, `TextArea`, `SelectField` |
| `src/components/ui/Modal.tsx` | `Modal`, `Drawer`, `BottomSheet`, focus-trap hook |
| `src/components/ui/Skeleton.tsx` | Layout-accurate skeleton variants |
| `src/components/ui/StateViews.tsx` | `AsyncView`, `ErrorState`, `EmptyState` |
| `CLAUDE.md` | Async-state and state-management guidelines |
| `AGENTS.md` | Conventions mirrored for agents |

## See also

- [DESIGN.md](../../DESIGN.md) - the canonical design system
- [Compatibility matching](../features/compatibility-matching/index.md) - composes `ProgressRing` and `toneClasses` for the 6-dimension lifestyle score
- [Patterns and conventions](../how-to-contribute/patterns-and-conventions.md) - the contributor rules summarized from CLAUDE.md, AGENTS.md, and DESIGN.md
