# DESIGN.md — 360 Flatmates Web Design System

> **Source of truth** for all UI tokens, component specifications, and visual
> implementation targets for the 360 Flatmates web application. Every visual
> change in this codebase should reference this file.

## Register

Product app. Ink on paper — editorial, craft, warm. The aesthetic is warm-editorial:
approachable like a well-designed journal, polished enough for financial transactions
(rent, deposits), and distinctive enough to feel human in a sea of generic property portals.

**Physical scene:** A 26-year-old software engineer browsing on their laptop or phone in a
Bangalore co-working space at 3 PM, natural daylight from floor-to-ceiling windows,
slightly distracted by Slack pings. They need to find a flatmate in the next two weeks
and are cautiously optimistic. The UI should feel like a helpful friend who works at a
design studio — someone who appreciates good typography, warm surfaces, and editorial craft.

**Desktop-specific goals:** Efficient keyboard navigation for power users, multi-column
layouts that use screen real estate wisely, hover affordances that reveal depth without
clutter, and responsive adaptation from wide desktop down to mobile.

---

## Color Tokens

### Primary Palette

| Token | Value | CSS Variable | Tailwind | Usage |
|-------|-------|-------------|----------|-------|
| **Primary (Accent)** | `#C96442` | `--color-accent` | `bg-accent` / `text-accent` | CTAs, active states, icons, progress bars, links |
| **Primary Soft** | `rgba(201,100,66,0.10)` | `--color-accent-soft` | `bg-accent-soft` | Light terracotta bg tints, selected states |
| **Primary Container** | `#F8D5C8` | `--color-accent-container` | `bg-accent-container` | Filled chip backgrounds, hover states |

### Paper Scale (Background Surfaces)

| Token | Value | CSS Variable | Tailwind | Usage |
|-------|-------|-------------|----------|-------|
| **Paper** | `#F4F3EE` | `--color-paper` | `bg-paper` | Page scaffold background (warm off-white) |
| **Paper 2** | `#EDEBE3` | `--color-paper-2` | `bg-paper-2` | Sidebar bg, elevated surface, chip bg |
| **Paper 3** | `#E4E1D7` | `--color-paper-3` | `bg-paper-3` | Deeper surface, muted pill backgrounds |
| **Paper 4** | `#D8D4C7` | `--color-paper-4` | `bg-paper-4` | Deepest paper shade, disabled fills |
| **Surface (Card)** | `#FFFDF8` | `--color-surface` | `bg-surface` | Card backgrounds, input fills, modal surfaces |

### Ink Scale (Text)

| Token | Value | CSS Variable | Tailwind | Usage |
|-------|-------|-------------|----------|-------|
| **Ink (Text Primary)** | `#1F1A14` | `--color-ink` | `text-ink` | Headlines, titles, important text, prices |
| **Ink 2 (Text Secondary)** | `#4A463E` | `--color-ink-2` | `text-ink-2` | Body text, descriptions, subtitles |
| **Ink 3 (Text Tertiary)** | `#756F65` | `--color-ink-3` | `text-ink-3` | Timestamps, hints, placeholders, disabled text |
| **Ink 4 (Text Quaternary)** | `#B5AFA3` | `--color-ink-4` | `text-ink-4` | Disabled outlines, faint dividers |

### Line Scale (Borders)

| Token | Value | CSS Variable | Tailwind | Usage |
|-------|-------|-------------|----------|-------|
| **Line** | `rgba(31,26,20,0.08)` | `--color-line` | `border-line` | Dividers, card borders, input borders |
| **Line 2** | `rgba(31,26,20,0.04)` | `--color-line-2` | `border-line-2` | Subtle borders, faint separators |
| **Line Low** | `rgba(31,26,20,0.04)` | `--color-line-low` | `border-line-low` | Disabled outlines, minimal contrast |

### Semantic Colors

| Token | Value | CSS Variable | Tailwind | Usage |
|-------|-------|-------------|----------|-------|
| **Success** | `#5B8C44` | `--color-success` | `text-success` | Match % rings, confirmed states, online indicators |
| **Success Soft** | `rgba(91,140,68,0.12)` | `--color-success-soft` | `bg-success-soft` | Success bg tints |
| **Error / Destructive** | `#B4452C` | `--color-error` | `text-error` | Logout, errors, delete actions, declined states |
| **Error Soft** | `rgba(180,69,44,0.10)` | `--color-error-soft` | `bg-error-soft` | Error bg tints |
| **Warning** | `#B57828` | `--color-warning` | `text-warning` | Pending states, reminders, expiring-soon badges |
| **Warning Soft** | `rgba(181,120,40,0.10)` | `--color-warning-soft` | `bg-warning-soft` | Warning bg tints |
| **Info** | `#C96442` (primary) | `--color-accent` | `text-accent` | Informational badges, tips, links |

### Compatibility Score Colors

| Threshold | Color | Value | Usage |
|-----------|-------|-------|-------|
| ≥ 70% | Green | `#5B8C44` | High compatibility ring fill |
| 40–69% | Amber | `#B57828` | Medium compatibility ring fill |
| < 40% | Red | `#B4452C` | Low compatibility ring fill |

### Categorical Pastel Palette

Eight categorical colors for data visualization, feature pills, profile badges, and
compatibility dimension labels. Each has three tiers: soft (background), mid (icon/accent),
and ink (text on soft).

| Category | Soft (bg) | Mid (accent) | Ink (text on bg) | Usage |
|----------|-----------|-------------|-------------------|-------|
| **Blue** | `#E1EAF4` | `#5B88B5` | `#2A4868` | Gender filter, blue accent |
| **Purple** | `#E7DDF1` | `#8B7BB8` | `#4A3E70` | Purple accent, lifestyle |
| **Green** | `#DCEAD4` | `#6A9068` | `#2D4A2E` | Food habits (veg), nature |
| **Yellow** | `#F5E8B8` | `#C49840` | `#5C4318` | Warning category, budget |
| **Orange** | `#FCE0C8` | `#D17847` | `#5E3318` | Primary accent family, warmth |
| **Teal** | `#CFE4DF` | `#5A9DA8` | `#1A4A52` | Location, explore, map |
| **Pink** | `#F6DDE3` | `#C28098` | `#6B3548` | Profile, likes, social |
| **Coral** | `#F8D5C8` | `#C96442` | `#5E3318` | Primary accent, CTAs |

### CSS Custom Properties

All color tokens are defined as CSS custom properties on `:root` (light mode) and overridden
via `[data-theme="dark"]` on `<html>` (dark mode):

```css
:root {
  --color-accent: #C96442;
  --color-accent-soft: rgba(201,100,66,0.10);
  --color-accent-container: #F8D5C8;
  --color-paper: #F4F3EE;
  --color-paper-2: #EDEBE3;
  --color-paper-3: #E4E1D7;
  --color-paper-4: #D8D4C7;
  --color-surface: #FFFDF8;
  --color-ink: #1F1A14;
  --color-ink-2: #4A463E;
  --color-ink-3: #756F65;
  --color-ink-4: #B5AFA3;
  --color-line: rgba(31,26,20,0.08);
  --color-line-2: rgba(31,26,20,0.04);
  --color-line-low: rgba(31,26,20,0.04);
  --color-success: #5B8C44;
  --color-success-soft: rgba(91,140,68,0.12);
  --color-error: #B4452C;
  --color-error-soft: rgba(180,69,44,0.10);
  --color-warning: #B57828;
  --color-warning-soft: rgba(181,120,40,0.10);
  --color-surface-elevated: #FFFFFF;
}
```

Dark mode overrides (see Dark Mode section for full palette details):

```css
[data-theme="dark"] {
  --color-paper: #1A1612;
  --color-surface: #2A2520;
  --color-surface-elevated: #342E28;
  --color-paper-2: #252018;
  --color-ink: #F4F3EE;
  --color-ink-2: #E4E1D7;
  --color-line: rgba(31,26,20,0.16);
  --color-accent: #C96442; /* unchanged */
}
```

---

## Typography

### Font Families

Loaded via Google Fonts CDN with `display: swap` and subset preload:

- **Display / Headlines:** Fraunces (variable) — variable optical-size serif, editorial, confident. Uses `opsz` and `SOFT` CSS font-variation-settings for typographic warmth. Weight 400.
- **Body / UI:** Inter — clean, readable, neutral workhorse sans-serif
- **Mono / Eyebrow:** JetBrains Mono — code, terminals, eyebrow labels, tabular data
- **Italic Serif:** Instrument Serif (italic) — italic emphasis, pull quotes, decorative text

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Font | CSS/Tailwind |
|------|------|--------|-------------|----------------|------|-------------|
| **Display** | 32px | Regular (400) | 1.05 | -0.035 | Fraunces | `text-display` |
| **H1** | 28px | Regular (400) | 1.05 | -0.035 | Fraunces | `text-h1` |
| **H2** | 24px | Regular (400) | 1.1 | -0.025 | Fraunces | `text-h2` |
| **H3** | 16px | SemiBold (600) | 1.25 | -0.012 | Inter | `text-h3` |
| **H4-H6** | 14px | SemiBold (600) | 1.3 | -0.01 | Inter | `text-h4` |
| **Body Large** | 16px | Medium (500) | 1.5 | 0 | Inter | `text-body-lg` |
| **Body Medium** | 14px | Medium (500) | 1.45 | 0 | Inter | `text-body-md` |
| **Label Large** | 14px | Bold (700) | 1.0 | 0.5 | Inter | `text-label-lg` |
| **Label Medium** | 12px | SemiBold (600) | 1.4 | 0.2 | Inter | `text-label-md` |
| **Caption** | 12px | Regular (400) | 1.4 | 0 | Inter | `text-caption` |
| **Eyebrow** | 10px | SemiBold (600) | 1.4 | 0.16em (uppercase) | JetBrains Mono | `text-eyebrow` |
| **Italic Serif** | inherit | Regular (400) | inherit | -0.01 | Instrument Serif (italic) | `text-serif-italic` |

### Fraunces Variable Settings

Headlines using Fraunces should set CSS `font-variation-settings` for optimal rendering:

- **Display** (32px): `font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 0;`
- **H1** (28px): `font-variation-settings: 'opsz' 112, 'SOFT' 40, 'WONK' 0;`
- **H2** (24px): `font-variation-settings: 'opsz' 96, 'SOFT' 30, 'WONK' 0;`

`WONK: 0` disables alternate character forms for consistent readability.

### Rules

- Cap body line length at ~65-70 characters (`max-width: 65ch` or ~520px)
- Headline-to-body scale ratio >= 1.25 (we use 28/16 = 1.75 for H1/body)
- Never use em dashes; use commas, colons, or parentheses
- Fraunces headlines should feel light and editorial — never bold the serif
- Use Instrument Serif italic for inline emphasis instead of bold
- Tabular/monospace text uses JetBrains Mono with `font-variant-numeric: tabular-nums`

---

## Border Radius

| Element | Radius | CSS | Tailwind |
|---------|--------|-----|----------|
| **Cards (listing, notification, menu)** | 16px | `border-radius: 16px` | `rounded-2xl` |
| **Cards (flat, compact)** | 12px | `border-radius: 12px` | `rounded-xl` |
| **Buttons (filled CTA)** | 10px | `border-radius: 10px` | `rounded-[10px]` |
| **Buttons (outline/secondary)** | 10px | `border-radius: 10px` | `rounded-[10px]` |
| **Icon buttons** | 9px | `border-radius: 9px` | `rounded-[9px]` |
| **Inputs / Text Fields** | 9px | `border-radius: 9px` | `rounded-[9px]` |
| **Chips / Pills** | 999px | `border-radius: 9999px` | `rounded-full` |
| **Avatars (editorial)** | 12px | `border-radius: 12px` | `rounded-xl` |
| **Avatars (circular)** | 999px | `border-radius: 9999px` | `rounded-full` |
| **Icon containers** | 12px | `border-radius: 12px` | `rounded-xl` |
| **Nav items** | 9px | `border-radius: 9px` | `rounded-[9px]` |
| **Notification icon bg** | 999px | `border-radius: 9999px` | `rounded-full` |
| **Dialog** | 8px | `border-radius: 8px` | `rounded-lg` |
| **Snackbar / Toast** | 16px | `border-radius: 16px` | `rounded-2xl` |
| **FAB / floating action** | 16px | `border-radius: 16px` | `rounded-2xl` |
| **Toggle** | 999px | `border-radius: 9999px` | `rounded-full` |

---

## Spacing

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| **Screen edge padding** | 20-24px | `px-5` to `px-6` | Left/right margins for page content |
| **Section gap** | 24-28px | `gap-6` to `gap-7` | Vertical space between major sections |
| **Card internal padding** | 16px | `p-4` | Padding inside cards |
| **Element gap (tight)** | 8px | `gap-2` | Between icon and label in a row |
| **Element gap (normal)** | 12px | `gap-3` | Between form fields, list items |
| **Element gap (relaxed)** | 16px | `gap-4` | Between heading and content |
| **Element gap (section)** | 24px | `gap-6` | Between distinct content blocks |
| **List item vertical spacing** | 12-16px | `gap-3` to `gap-4` | Between items in a list |

---

## Shadows

All shadows use warm ink tints (`rgba(31,26,20,...)`) instead of cool black.
Primary-tinted shadows use terracotta (`rgba(201,100,66,...)`) instead of purple.

### Shadow Scale

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| **Shadow xs** | `0 1px 2px rgba(31,26,20,0.04)` | `shadow-xs` | Subtle nav items, flat cards |
| **Shadow sm** | `0 2px 6px rgba(31,26,20,0.06)` | `shadow-sm` | Standard content cards |
| **Shadow md** | `0 6px 18px rgba(31,26,20,0.08)` | `shadow-md` | Hover lift, elevated elements |
| **Shadow lg** | `0 18px 60px rgba(31,26,20,0.12), 0 4px 16px rgba(31,26,20,0.06)` | `shadow-lg` | Modals, drawers, overlays |

### Component Shadows

| Element | Value | Tailwind | Usage |
|---------|-------|----------|-------|
| **Cards** | `0 2px 6px rgba(31,26,20,0.06)` | `shadow-sm` | Subtle elevation for content cards |
| **Elevated (FAB, dropdown)** | `0 4px 12px rgba(31,26,20,0.10)` | custom | Floating elements |
| **Buttons (filled CTA)** | `0 2px 8px rgba(201,100,66,0.18)` | `shadow-cta` | Terracotta-tinted CTA shadow |
| **Modal / Overlay** | `0 18px 60px rgba(31,26,20,0.12), 0 4px 16px rgba(31,26,20,0.06)` | `shadow-lg` | Overlay surfaces |
| **Card hover glow** | `0 4px 16px rgba(201,100,66,0.08)` | `shadow-hover` | Terracotta-tinted ambient glow on hover |
| **Card pressed** | `0 4px 12px rgba(31,26,20,0.10)` | custom | Elevated shadow for pressed cards |
| **Bottom bar top** | `0 1px 2px rgba(31,26,20,0.04)` | `shadow-xs` | Top-edge shadow for bottom nav |
| **Input focus glow** | `0 2px 12px rgba(201,100,66,0.12)` | `shadow-focus` | Terracotta-tinted glow for focused inputs |

### Dark Mode Shadow Derivations

All shadow tokens have reduced-intensity warm dark mode variants:
- Card: `0 1px 2px rgba(31,26,20,0.04)` (xs only)
- Card hover: `0 2px 6px rgba(31,26,20,0.06)` (sm)
- Terracotta glow: `0 2px 6px rgba(201,100,66,0.04)` (minimal)
- Bottom bar: none (inherent dark-mode depth)
- Navigation bar: none

---

## Frost / Glassmorphism Tokens

| Token | CSS Value | Usage |
|-------|-----------|-------|
| **Frost blur** | `backdrop-filter: blur(9px)` | Frosted-glass surfaces (sigma 3.0 × 3 ≈ 9px pixel blur) |
| **Frost overlay (light)** | `rgba(244,243,238,0.88)` | Paper-tinted overlay behind frosted surfaces |
| **Frost overlay (dark)** | `rgba(26,22,18,0.88)` | Warm charcoal overlay on dark surfaces |

### Frosted-Glass Surfaces

| Surface | CSS | Usage |
|---------|-----|-------|
| **Bottom navigation bar** | `backdrop-blur-[9px]` + `bg-paper/88` | Semi-transparent paper surface over content |
| **Bottom sheet** | `backdrop-blur-[9px]` + `bg-paper/92` | Sheet backdrop with `border-radius` + `overflow: hidden` |
| **Sticky action bar** | `backdrop-blur-[9px]` + `bg-paper/88` | Sticky CTA bar with frosted-glass backdrop |

---

## Gradient Tokens

| Token | CSS Value | Usage |
|-------|-----------|-------|
| **Primary gradient** | `linear-gradient(to bottom, rgba(201,100,66,0.95), #C96442)` | Subtle CTA depth |
| **Surface gradient** | `linear-gradient(to bottom, rgba(244,243,238,0.5), #EDEBE3)` | Card depth wash |
| **Shimmer gradient** | `linear-gradient(90deg, #EDEBE3, #FFFFFF, #EDEBE3)` | Skeleton loading animation |
| **Success gradient** | `linear-gradient(135deg, #DCEAD4, #C2DAB2)` | Status banner wash |
| **Warning gradient** | `linear-gradient(135deg, #F5E8B8, #E8D5A0)` | Status banner wash |
| **Error gradient** | `linear-gradient(135deg, #F8D5C8, #F0C0B0)` | Status banner wash |
| **Nudge gradient** | `linear-gradient(135deg, rgba(201,100,66,0.08), rgba(201,100,66,0.03))` | Waitlist / promo cards |
| **Category gradients** | `linear-gradient(135deg, {pastel-soft}, #FFFFFF)` | Feature category cards |

---

## Component Specifications

### Primary Button (Filled CTA)

- Background: solid `#C96442` (terracotta, NOT gradient)
- Text: white, 14px bold (Label Large), center-aligned
- Padding: horizontal 24px, vertical 16px
- Border radius: 10px
- Height: 52px (standard), 56px (tall)
- Full-width variant: `w-full`
- Shadow: terracotta-tinted shadow (`shadow-cta`) when enabled
- **Pressed**: `transform: scale(0.97)` (150ms ease-out), shadow reduces
- **Hover** (desktop): background lightens 5%, shadow deepens to `shadow-hover`, 1px translateY
- **Focus**: `:focus-visible` — 2px solid accent outline, 2px offset
- **Disabled**: paper-4 bg, ink-3 text, no shadow, `cursor-not-allowed`

### Secondary Button (Outline)

- Border: 1.5px solid `#C96442` (or line for neutral)
- Text: `#C96442` (or ink for neutral)
- Same dimensions as filled button
- No shadow
- **Pressed**: `transform: scale(0.97)` (150ms ease-out), border animates to 0.7 alpha
- **Hover** (desktop): subtle accent-soft bg tint
- **Focus**: `:focus-visible` — 2px solid accent outline, 2px offset
- **Disabled**: line border, ink-3 text, `cursor-not-allowed`

### Tertiary Button (Text)

- Text only, `#C96442` color, 14px medium weight
- No border, no background, no shadow
- Used for Skip, "See all", links
- **Hover** (desktop): accent-soft bg tint, underline
- **Focus**: `:focus-visible` — 2px solid accent outline, 2px offset

### Listing Card (Home Feed)

- **Mobile (<768px)**: vertical layout, full-width
- **Desktop (≥768px)**: horizontal layout, image left (148px wide), content right
- Image: aspect ratio 0.82, radius 16px, `object-fit: cover`
- Image overlay: heart icon (top-right, 40px white circle bg)
- Price: 26px bold, ink color (NOT terracotta)
- Title: 16px semiBold (Fraunces for hero cards), below price
- Location: row with pin icon + ink-2 text
- Info pills: beds, baths, area as compact pills
- Feature pills: furnished, wifi, etc.
- Owner row: small avatar (34px) + name + interest count
- Description: 2-line max, `line-clamp-2`
- Footer: solid terracotta CTA button
- Compatibility ring: 32px SVG `<circle>` with `stroke-dashoffset` animation, positioned above title
- **Hover** (desktop): shadow deepens to `shadow-hover`, 1px translateY, subtle accent border glow
- **Pressed**: `transform: scale(0.97)` (150ms ease-out), terracotta glow shadow
- **Focus**: `:focus-visible` — 2px solid accent outline, 2px offset

### Profile Grid Card (Likes Tab — 2-Column Grid)

- Layout: Column within fixed-width cell (~48% of container width)
- Photo: top, 16px radius, 1:1 or 4:5 aspect ratio
- Match % circle: green ring, top-right corner of photo, 44px — animated arc-draw on mount (300ms via SVG `stroke-dashoffset`)
- Name: 15px bold, below photo
- Age + location: 12px ink-2, below name
- Profession: 12px ink-3, below location
- "Match" CTA: full-width, solid terracotta, 10px radius, 42px height — scale bounce 0.8→1.0 on appear (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Hover** (desktop): shadow lift, subtle accent glow
- **Focus**: `:focus-visible` on the card wrapper

### Menu Item Row (Profile / Settings)

- Height: 56px
- Layout: `flex` row — icon container (left), label (flex-1), chevron (right)
- Icon container: 40×40px, `border-radius: 12px`, pastel-tinted bg matching category
- Label: 15px medium weight, ink
- Chevron: 20px, ink-3 color
- Divider below each item (`border-b border-line`, except last in group)
- Group spacing: 24px between groups
- **Hover** (desktop): accent-soft bg tint on the row
- **Pressed**: `transform: scale(0.98)` (150ms ease-out), terracotta-tinted highlight
- **Focus**: `:focus-visible` — accent outline ring

### Notification Card

- Padding: 16px horizontal, 14px vertical
- Layout: `flex` row — icon container (left), content (center, flex-1), time+dot (right)
- Icon container: 48px circle, pastel bg per type:
  - Booking confirmed: teal-soft
  - New message: blue-soft
  - Visit reminder: yellow-soft
  - Listing approved: green-soft
- Title: 15px semiBold, ink
- Description: 13px regular, ink-2, 2 lines max (`line-clamp-2`)
- Timestamp: 12px, ink-3, right-aligned
- Unread indicator: 3px terracotta left accent border + 10px terracotta dot below timestamp
- Card bg: surface (white), 16px radius, `shadow-sm`
- **Hover** (desktop): paper-2 bg shift
- **Focus**: `:focus-visible` ring

### Search Bar

- Height: 48px
- Border radius: 9px
- Background: surface white (light mode) / dark surface (dark mode)
- Border: 1px solid line (`rgba(31,26,20,0.08)`)
- Leading icon: search, 20px, ink-3
- Placeholder: 14px regular, ink-3
- Trailing icon: optional (location pin, clear, mic)
- **Focus**: terracotta-tinted glow shadow (`shadow-focus`), `transform: scale(1.01)`, prefix icon turns terracotta, border color transitions to accent
- **Hover** (desktop): subtle border color shift

### Filter Chip

- Selected: accent-container bg (`#F8D5C8`), terracotta text, optional terracotta border
- Unselected: paper-2 bg, ink-2 text, line border
- Radius: 999px (pill-shaped)
- Padding: horizontal 14px, vertical 8px
- Avatar/icon support: 16px icon before label
- **Select**: `transform: scale(1.03)` with `cubic-bezier(0.34, 1.56, 0.64, 1)` (150ms), bg/text/border transition
- **Deselect**: scale returns to 1.0
- **Hover** (desktop): paper-2 → paper-3 bg for unselected
- **Pressed**: `transform: scale(0.97)` (150ms ease-out)
- **Focus**: `:focus-visible` ring
- **Disabled**: paper-4 bg, ink-3 text, `cursor-not-allowed`

### Avatar

- Default size: 52px
- Shape: 12px rounded square (editorial style); circular variant available for profile photos
- Fallback: CSS `background: linear-gradient(135deg, #C96442, rgba(201,100,66,0.72))`, white initials centered
- Shadow: `0 4px 10px rgba(31,26,20,0.08)`
- With image: `<img>` with blur placeholder data URL, `border-radius` + `overflow: hidden`
- Optional ring: animated terracotta arc-draw on mount (300ms, ease-out) via SVG `<circle>` + `stroke-dashoffset` animation

### Logo (36 FLATMATES)

- Compact mode: "36" at 28px extra-bold (Fraunces, `letter-spacing: -1.4px`) + rotate icon (30px) + "FLATMATES" at 13px (Inter, uppercase, `letter-spacing: 1.6px`)
- Full mode: "36" at 38px extra-bold (Fraunces) + rotate icon (38px) + "FLATMATES" at 15px (Inter, uppercase, `letter-spacing: 1.6px`)
- Color: terracotta (`#C96442`) for all elements

---

## Shared Component Library

All pages should use these shared React components instead of duplicating layout,
loading, and async-state patterns. Components live in `src/components/` (or a similar
shared directory).

| Component | Purpose | Tailwind / CSS |
|-----------|---------|-----------------|
| `<PageLayout>` | Unified page scaffold — paper bg, min-height screen, padding, 200ms fade-in entry | `bg-paper min-h-screen p-6 animate-fade-in` |
| `<AsyncView>` | Async state handler — renders loading/data/empty/error from TanStack Query | Suspense boundary + error boundary |
| `<NetworkImage>` | Network image with placeholder/error fallback (replaces raw `<img>`) | `<img>` with blurDataURL |
| `<Card>` | Content card container (interactive hover/press glow, optional gradient/border-glow) | `bg-surface rounded-2xl shadow-sm` |
| `<Chip>` | Filter/tag chip with choice variant (selection spring animation) | `rounded-full px-3.5 py-2` |
| `<PageHeader>` | Page header with optional back button and actions | `flex items-center gap-3` |
| `<Skeleton>` | Shimmer loading placeholder (card, list, feed, profile variants) | `animate-shimmer bg-gradient-to-r` |
| `<ErrorState>` | Error display with retry action (200ms fade-in + slide-up entry) | `animate-fade-slide-up` |
| `<EmptyState>` | Empty state with illustration and message (200ms fade-in + breathing icon) | `animate-fade-in` + breathing keyframe |
| `<BottomActionBar>` | Sticky bottom action bar for CTAs (frosted-glass backdrop) | `sticky bottom-0 backdrop-blur-[9px]` |
| `<BottomSheet>` | Styled bottom sheet / drawer container (frosted-glass backdrop) | Radix Dialog or custom overlay |
| `<SearchBar>` | Search input with leading/trailing icons (focus glow + scale lift) | `h-12 rounded-[9px] border-line` |
| `<SegmentedControl>` | Tab-style segmented selector (sliding pill indicator) | Framer Motion `layoutId` for pill |
| `<StepProgress>` | Multi-step progress indicator | `flex gap-1` with accent fills |
| `<PriceText>` | Formatted price display | Fraunces + tabular-nums |
| `<TrustBadge>` | Verified/trust indicator badge | icon + label pill |
| `<ProfileMiniCard>` | Compact profile row (avatar + name + subtitle) | `flex items-center gap-3` |
| `<ListingMiniCard>` | Compact listing row (thumbnail + title + price) | `flex items-center gap-3` |

---

## Navigation Structure

### Responsive Navigation Strategy

The web app uses device-adaptive navigation — no single layout for all viewports.

| Breakpoint | Min-width | Navigation | Width |
|-----------|-----------|------------|-------|
| Mobile | 0 | Bottom nav (5 tabs) | Full-width, fixed bottom |
| Tablet | 768px | Collapsed sidebar (icons only) | 64px fixed left |
| Desktop | 1024px | Expanded sidebar (icons + labels) | 240px fixed left |
| Wide | 1440px | Wider sidebar (icons + labels) | 280px fixed left |

### Mode-Dependent Tabs

Every user has exactly one mode. Mode determines which navigation tabs they see.

| Tab | Room Poster | Co-Hunter | Open to Both |
|-----|------------|-----------|-------------|
| **1** | Home (Feed) | Home (Feed) | Home (Feed) |
| **2** | Post / Manage Property | Properties (Map View) | Properties (Map View) |
| **3** | Swipe | Swipe | Swipe |
| **4** | Chats | Chats | Chats |
| **5** | Profile | Profile | Profile |

### Tab Icons & Labels

| Tab | Icon (default / active) | Label |
|-----|------------------------|-------|
| Home | `home` outlined / filled | Home |
| Post (Room Poster) | `add-home` outlined / filled | Post |
| Explore (Co-Hunter/Open) | `map` outlined / filled | Explore |
| Swipe | `swap-horiz` | Swipe |
| Chats | `chat-bubble` outlined / filled | Chats |
| Profile | `person` outlined / filled | Profile |

### Desktop Sidebar

Desktop sidebar adds items beyond the 5 mobile tabs:

| Item | Icon | Route |
|------|------|-------|
| Home | `home` | `/` |
| Explore | `map` | `/explore` |
| Swipe | `swap-horiz` | `/swipe` |
| Chats | `chat-bubble` | `/chats` |
| Bookings | `calendar` | `/bookings` |
| Post Property | `add-home` | `/listings/new` |
| My Listings | `building` | `/listings/manage` |
| Profile | `person` | `/profile` |

Sidebar styling:
- Background: paper-2 (light), dark-paper-2 (dark)
- Active item: accent-soft bg, accent text, 9px radius
- Inactive item: ink-3 text, transparent bg
- Hover: subtle paper-3 bg shift
- Collapsed state: icons centered, labels hidden, tooltip on hover

### Top Bar (Desktop/Tablet)

- Position: fixed top, full-width (minus sidebar on desktop)
- Height: 64px
- Left: 36 FLATMATES logo (compact) — hidden on desktop when sidebar shows logo
- Center: Search bar (desktop)
- Right: Notification bell icon + user avatar (52px)
- Background: paper with subtle bottom border-line
- Mobile: Logo left, search + bell + avatar right

---

## Page Inventory

Detailed page layouts, modals, and micro-interactions are specified in
`plans/ui_ux.md` Sections 5-7. This section provides a route summary only.

| Route | Page Name |
|-------|-----------|
| `/` | Home / Discover |
| `/onboarding` | Onboarding |
| `/choose-role` | Mode Selection |
| `/location` | Location Selection |
| `/auth/login` | Login |
| `/auth/signup` | Sign Up |
| `/explore` | Explore / Map View |
| `/search` | Search & Filters |
| `/swipe` | Swipe Deck |
| `/likes` | Likes (incoming) |
| `/matches` | Matches |
| `/chats` | Chats (with Matches bar) |
| `/chats/:id` | Chat Conversation |
| `/listing/:id` | Listing Details |
| `/listings/new` | Create Listing |
| `/listings/manage` | Manage Listings |
| `/profile` | Profile |
| `/profile/edit` | Edit Profile |
| `/bookings` | Bookings |
| `/bookings/:id` | Booking Detail |
| `/notifications` | Notifications |
| `/settings` | Settings |
| `/help` | Help & Support |
| `/verify` | Verification |

---

## Animation Guidelines

### Animation Tokens

| Animation | Duration | Curve | CSS / Framer Motion |
|-----------|----------|-------|---------------------|
| Page transition | 250ms | ease-out | `transition-opacity duration-250 ease-out` |
| Tab switch | 200ms | ease-out | `duration-200 ease-out` |
| Button press | 150ms | ease-out | `:active { transform: scale(0.97) } transition-transform duration-150 ease-out` |
| Card appear (staggered) | 300ms | ease-out | `duration-300 ease-out` with 50ms stagger |
| Page entry fade-in | 200ms | ease-out | `duration-200 ease-out` |
| Stagger item delay | 50ms (cards), 100ms (menu groups) | — | `animation-delay` |
| Breathing icon pulse | 2000ms | linear | `animation: breathe 2s linear infinite alternate` |
| Swipe card rotation | varies | spring | Max 15° rotation, Framer Motion `spring` |
| Compatibility ring fill | 300ms | ease-out | SVG `stroke-dashoffset` transition |
| Avatar ring draw | 300ms | ease-out | SVG `stroke-dashoffset` transition |
| Match celebration | <600ms | ease-out-expo | Framer Motion `animate` with `cubic-bezier(0.16,1,0.3,1)` |
| Filter chip select | 150ms | ease-out-back | `transform: scale(1.03)` with `cubic-bezier(0.34,1.56,0.64,1)` |
| Bottom sheet show/dismiss | 280ms | ease-out | `duration-280 ease-out` |
| FAB expand | 250ms | ease-out-back | `cubic-bezier(0.34,1.56,0.64,1)` |
| Skeleton shimmer | 1200ms | linear | `animation: shimmer 1200ms linear infinite` |
| Segmented pill slide | 220ms | ease-out | Framer Motion `layoutId` for pill indicator |
| Hover lift | 150ms | ease-out | `duration-150 ease-out` |

### Easing Curves (CSS)

| Name | CSS cubic-bezier | Notes |
|------|-------------------|-------|
| ease-out | `cubic-bezier(0, 0, 0.2, 1)` | General deceleration |
| ease-out-quart | `cubic-bezier(0.25, 1, 0.5, 1)` | Page transitions, overlays |
| ease-out-back | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot for chips, FAB |
| ease-out-expo | `cubic-bezier(0.16, 1, 0.3, 1)` | Match celebration, dramatic exits |

### Motion Rules

- Ease-out curves only (exponential: quart/quint/expo)
- No bounce, no elastic (except intentional FAB/chip overshoot via ease-out-back)
- Keep animations under 400ms for micro-interactions
- Respect `prefers-reduced-motion` — see Accessibility section
- Don't animate layout properties that trigger reflow (use `transform` and `opacity` instead)

### Premium Motion Behaviors

- **Press feedback**: All interactive cards, buttons, and menu items use `:active { transform: scale(0.97) }` via CSS transition (150ms ease-out). Return to 1.0 on release.
- **Focus glow**: Search bar and focused inputs gain terracotta-tinted `box-shadow` glow (`shadow-focus`) + subtle `transform: scale(1.01)` on focus.
- **Selection spring**: Chips scale to 1.03 with `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoot on selection, returning to 1.0 on deselect.
- **Staggered appear**: Feed cards fade in + slide up with 50ms stagger between items. Profile menu groups stagger with 100ms delay between groups.
- **Animated ring**: Compatibility rings and avatar rings draw their SVG arc on mount (300ms, ease-out) via `stroke-dashoffset` transition.
- **Frosted glass**: Bottom nav, bottom sheets, and bottom action bars use `backdrop-filter: blur(9px)` + semi-transparent paper surface (0.88-0.92 alpha). Apply `border-radius` + `overflow: hidden` to constrain blur bounds.
- **Page entry**: `<PageLayout>` wraps body in 200ms opacity + translateY transition for silky page entry. Use Framer Motion `AnimatePresence` for route transitions.
- **Sliding pill**: `<SegmentedControl>` uses Framer Motion `layoutId` for a sliding selection indicator (220ms, ease-out).
- **Entry animations**: `<EmptyState>` and `<ErrorState>` fade in + slide up on mount (200ms). Empty-state icons have a subtle 2s breathing (pulse) animation.

---

## Hover & Focus States

Web requires hover and focus affordances that the mobile app does not have.

### Hover Patterns

| Component | Hover Effect |
|-----------|-------------|
| Primary Button | bg lightens 5%, shadow deepens to `shadow-hover`, 1px translateY |
| Secondary Button | subtle accent-soft bg tint |
| Tertiary Button | accent-soft bg tint, underline |
| Listing Card | shadow deepens to `shadow-hover`, 1px translateY, subtle accent border glow |
| Profile Card | shadow lift, subtle accent glow |
| Menu Item Row | accent-soft bg tint on the row |
| Notification Card | paper-2 bg shift |
| Filter Chip (unselected) | paper-2 → paper-3 bg |
| Search Bar | subtle border color shift |
| Sidebar nav item | subtle paper-3 bg shift |
| Avatar (clickable) | subtle scale 1.02, shadow lift |

### Focus Patterns

All interactive elements must have a visible `:focus-visible` indicator for keyboard users.
Mouse clicks should NOT show the focus ring (use `:focus-visible`, not `:focus`).

| Component | Focus Ring |
|-----------|-----------|
| Buttons | 2px solid accent outline, 2px offset, `border-radius` matches button |
| Cards | 2px solid accent outline, 2px offset |
| Inputs / Search Bar | border transitions to accent, `shadow-focus` glow |
| Chips | 2px solid accent outline, 2px offset |
| Menu Items | accent outline ring on the row |
| Links | 2px solid accent underline-offset |
| Sidebar nav item | accent outline ring inside the item |

CSS utility: `focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`

---

## Dark Mode

All tokens above apply to both light and dark modes. Dark mode specifics:

### Dark Mode Token Map

| Token | Light | Dark | CSS Variable |
|-------|-------|------|-------------|
| Scaffold (paper) | `#F4F3EE` | `#1A1612` | `--color-paper` |
| Surface | `#FFFFFF` | `#2A2520` | `--color-surface` |
| Surface Elevated | `#FFFFFF` | `#342E28` | `--color-surface-elevated` |
| Paper 2 | `#EDEBE3` | `#252018` | `--color-paper-2` |
| Ink (primary) | `#1F1A14` | `#F4F3EE` | `--color-ink` |
| Ink 2 (secondary) | `#4A463E` | `#E4E1D7` | `--color-ink-2` |
| Ink 3 (tertiary) | `#756F65` | `#AAA397` | `--color-ink-3` |
| Line | `rgba(31,26,20,0.08)` | `rgba(31,26,20,0.16)` | `--color-line` |
| Accent | `#C96442` | `#C96442` (unchanged) | `--color-accent` |

Key dark mode rules:
- Primary accent stays `#C96442` (terracotta works well on dark)
- Ink text → lightened warm equivalents
- Shadows reduce significantly (dark mode has inherent depth)
- Line/border alpha increases from 0.08 to 0.16 for visibility
- Categorical pastel soft tiers darken to maintain contrast
- All pages must be tested in dark mode after any light-mode changes

### Dark Mode Implementation

Dark mode uses CSS custom properties toggled via `[data-theme]` attribute on `<html>`:

```css
:root { /* light tokens — see CSS Custom Properties section above */ }

[data-theme="dark"] {
  --color-paper: #1A1612;
  --color-surface: #2A2520;
  --color-surface-elevated: #342E28;
  --color-paper-2: #252018;
  --color-ink: #F4F3EE;
  --color-ink-2: #E4E1D7;
  --color-line: rgba(31,26,20,0.16);
}
```

**Theme switching mechanism:**
1. Default: check `prefers-color-scheme: dark` media query on initial load
2. User override: toggle sets `[data-theme="dark"]` on `<html>` and persists to `localStorage`
3. SPA theme init: set theme via inline `<script>` in `index.html` `<head>` (before paint) to avoid flash:
   ```html
   <script>
     const t = localStorage.getItem('theme');
     if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
       document.documentElement.dataset.theme = 'dark';
     }
   </script>
   ```
4. Tailwind v4: dark mode uses `[data-theme="dark"]` selector defined in `globals.css` `@theme` directive

### Dark Mode Palettes

Three accent palette options for dark mode:

| Palette | Accent | Soft | Container | Notes |
|---------|--------|------|-----------|-------|
| **Terracotta** (default) | `#C96442` | `rgba(201,100,66,0.10)` | `#F8D5C8` | Warm, matches brand |
| **Ember** | `#D17847` | `rgba(209,120,71,0.10)` | `#FCE0C8` | Slightly warmer, orange-shifted |
| **Monsoon Teal** | `#5A9DA8` | `rgba(90,157,168,0.10)` | `#CFE4DF` | Cool accent for contrast |

---

## Responsive Breakpoints

| Breakpoint | Min-width | Layout | Tailwind |
|-----------|-----------|--------|----------|
| Mobile | 0 | Single column, bottom nav, full-width cards | default (no prefix) |
| Tablet | 768px | Collapsed sidebar (64px), 2-column where applicable | `md:` |
| Desktop | 1024px | Full sidebar (240px), multi-column, horizontal cards | `lg:` |
| Wide | 1440px | Wider sidebar (280px), max-width containers | `xl:` |

Tailwind config:

```ts
screens: {
  md: '768px',  // tablet
  lg: '1024px', // desktop
  xl: '1440px', // wide
}
```

Container max-widths:
- Content area: `max-w-7xl` (1280px) centered within the viewport
- Sidebar + content: sidebar width + `max-w-7xl` content
- Full-bleed sections: `max-w-screen-2xl` (1536px)

---

## Accessibility

### Core Rules

- Minimum touch/click target: 44×44px for all interactive elements
- Color contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text
- Don't convey information by color alone (always pair with icons/text)
- ARIA labels, roles, and live regions on all interactive elements
- Visible focus indicators for keyboard users (see Focus Patterns above)

### Keyboard Navigation

| Action | Key |
|--------|-----|
| Move focus forward | Tab |
| Move focus backward | Shift+Tab |
| Activate button/link | Enter or Space |
| Dismiss modal / bottom sheet | Escape |
| Navigate sidebar items | Arrow Up / Arrow Down |
| Navigate tabs in segmented control | Arrow Left / Arrow Right |
| Navigate swipe deck | Arrow Left (pass) / Arrow Right (like) |
| Scroll within modals | Arrow keys (trapped focus) |
| Skip to main content | Skip navigation link (first Tab press) |

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Disable scale transforms on press
- Simplify transitions to opacity-only
- Remove confetti and celebration animations
- Disable breathing pulse
- Swipe deck uses instant card swap instead of spring animation

### High Contrast

`prefers-contrast: more` increases border and text contrast:

```css
@media (prefers-contrast: more) {
  :root {
    --color-line: rgba(31,26,20,0.20);
    --color-ink-3: #6A645A;
  }
}
```

### Skip Navigation

A visually-hidden skip link is the first focusable element on every page:

```html
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:px-4 focus:py-2 focus:rounded">
  Skip to main content
</a>
```

---

## Performance Budget

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Total JS bundle (gzipped) | < 200KB |
| Time to Interactive | < 3.0s |

---

## Image Strategy

- **Responsive images** with `srcset` and `sizes` attribute:
  ```jsx
  <img
    src={url}
    srcSet={`${url}?w=400 400w, ${url}?w=800 800w, ${url}?w=1200 1200w`}
    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
    loading="lazy"
  />
  ```
- **Blur placeholder**: Generate base64 data URLs at build time for above-fold images
- **Format negotiation**: Serve WebP/AVIF variants via CDN or `<picture>` element
- **Lazy loading**: Below-fold images use `loading="lazy"`
- **Error fallback**: Gray placeholder with icon for failed image loads
