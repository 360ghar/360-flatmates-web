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
        P2["--color-accent-500 #A94A2B"]
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

The palette is "Paper Diorama": clay `#A94A2B` (primary), pine `#2E5B48` (secondary), marigold `#E0A034` (accent for art only). Pages are stacked paper layers: `sky` (page), `paper-1` (bands), `paper-2` (cards), `paper-3` (raised). Dark mode is night on pine-black, never blue-charcoal. Every value is in [DESIGN.md](../../DESIGN.md) section 1; `src/styles/__tests__/contrast.test.ts` enforces WCAG AA for every text pair.

Legacy names stay as aliases so older code keeps working: `paper` = sky, `surface-soft` = paper-1, `surface` = paper-2, `surface-elevated` = paper-3, `accent` / `primary` = clay. The categorical blue/purple/teal/pink families now resolve to neutral paper tones; do not use colour for labels unless it encodes meaning (status, compatibility tier).

## Typography

- **Gambarino** (Fontshare, one weight, self-hosted `public/fonts/Gambarino-Regular.woff2`) for display and headlines: `text-display`, `text-h1` to `text-h3`, the logo. Never bold or italic (`font-synthesis: none`).
- **system-ui** for body and UI text.

No mono or uppercase-tracked label voice. The scale is in [DESIGN.md](../../DESIGN.md) section 2.

## Dark mode

Theme is applied via `[data-theme="dark"]` on `<html>`, set before paint by an inline script in `index.html`. State lives in `uiStore` (`src/lib/stores/ui-store.ts`); the header control is `src/components/ui/ThemeToggle.tsx` (cycles Light, Dark, System) and the full choice is on `/settings/appearance`. Default theme is **light**.

## Motion tokens and choreography

Durations `fast` 120 ms, `base` 200 ms, `slow` 320 ms, `layer-stagger` 40 ms; curves `paper-out` and `paper-settle` ([DESIGN.md](../../DESIGN.md) section 7). Content is always visible: entrances only translate (never start at opacity 0). Buttons press down (`paper-press`), cards lift 1 px on hover (`paper-lift`), scene layers move with scroll (`PaperScene`). `<MotionConfig reducedMotion="user">` and a global `prefers-reduced-motion` block turn all of it off.

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
