# 360 Flatmates Web -- UI/UX Design Specification

## Context

This document specifies the complete visual design, interaction patterns, and user experience for every page, component, modal, and micro-interaction in the 360 Flatmates web application. It translates the mobile Flutter app's "ink on paper" design system to web, adapting desktop-specific interactions while preserving the warm editorial aesthetic. A developer should be able to implement any screen or component from this spec with zero ambiguity.

Source references:
- Web design system: `DESIGN.md` (color tokens, typography, spacing, shadows, components, animations, dark mode, accessibility)
- Mobile design system: `360-flatmates/DESIGN.md` (mobile-specific reference)
- Mobile Flutter screens: `360-flatmates/lib/features/*/presentation/`
- PRD and technical spec: `plans/prd.md`
- OpenAPI spec: `docs/flatmates-openapi.yaml`

---

## 1. Design System Foundation

All design tokens (color, typography, spacing, border radius, shadows, gradients, frost/glassmorphism, animation tokens, dark mode, hover/focus states, responsive breakpoints, and accessibility) are defined in **`DESIGN.md`** at the project root. That file is the canonical source of truth for the web design system.

This document references those tokens by name (e.g., `bg-accent`, `text-ink-2`, `shadow-sm`, `rounded-2xl`) in all component and page specifications below. When implementing, refer to `DESIGN.md` for exact values, CSS custom property names, and Tailwind utility mappings.

---

## 2. Component Catalog -- Atoms

### 2.1 Button

**Variants**: Primary (filled), Secondary (outline), Tertiary (text), Icon-only

| Property | Primary | Secondary | Tertiary | Icon-only |
|----------|---------|-----------|----------|-----------|
| Background | `#C96442` | transparent | transparent | transparent |
| Text color | white | `#C96442` | `#C96442` | `#C96442` |
| Border | none | 1.5px solid accent | none | none |
| Shadow | `shadow-cta` | none | none | none |
| Height | 52px (standard), 56px (tall) | 52px | auto | 40px |
| Padding | 24px horizontal, 16px vertical | 24px/16px | 8px/4px | 8px |
| Border radius | 10px | 10px | -- | 9px |
| Font | Label Large (14px, 700) | Label Large | 14px, 500 | -- |
| Full-width | optional | optional | -- | -- |

**States**:
- **Default**: As above
- **Hover** (desktop): bg lightens 5%, shadow deepens to `shadow-hover`, 1px translateY
- **Pressed**: scale 0.97 (150ms ease-out), shadow reduces. CSS: `:active { transform: scale(0.97) }`
- **Focused**: 2px solid accent outline, 2px offset
- **Disabled**: paper-4 bg, ink-3 text, no shadow, cursor-not-allowed
- **Loading**: spinner replaces text, bg at 80% opacity

**Icon support**: Leading icon (20px, gap 8px) or trailing icon. Icon-only: 40x40px circle/square.

**Long-press** (mobile): Long-press (>500ms): fires context menu if applicable (e.g., share, copy link on listing cards).

### 2.2 Card

| Property | Default | Compact | Elevated |
|----------|---------|---------|----------|
| Background | surface (white) | surface | surface |
| Border radius | 16px | 12px | 16px |
| Shadow | shadow-sm | shadow-xs | shadow-md |
| Padding | 16px | 12px | 16px |
| Border | 1px solid line | 1px solid line | 1px solid line |

**States**:
- **Hover** (desktop): shadow deepens to `shadow-hover`, 1px translateY, border-glow (subtle accent at 0.04 alpha)
- **Pressed**: scale 0.97 (150ms ease-out), shadow `shadow-md`, terracotta glow `0 4px 12px rgba(201,100,66,0.06)`
- **Selected**: accent border 1.5px, accent-soft bg tint

### 2.3 Chip

**Variants**: Filter, Choice, Info, Removable

| Property | Filter/Choice | Info | Removable |
|----------|--------------|------|-----------|
| Selected bg | accent-container (`#F8D5C8`) | accent-soft | accent-container |
| Selected text | accent | accent | accent |
| Unselected bg | paper-2 | paper-2 | paper-2 |
| Unselected text | ink-2 | ink-2 | ink-2 |
| Border | 1px line (unselected), 1px accent (selected) | 1px line | 1px line |
| Radius | 999px | 999px | 999px |
| Padding | 14px horizontal, 8px vertical | 10px/6px | 14px/8px |
| Font | Label Medium (12px, 600) | Caption (12px, 400) | Label Medium |

**States**:
- **Select**: scale 1.03 spring (cubic-bezier(0.34,1.56,0.64,1), 150ms), bg/text/border transition
- **Deselect**: scale returns to 1.0
- **Hover** (desktop): subtle bg shift (paper-2 -> paper-3 for unselected)
- **Pressed**: scale 0.97 (150ms)
- **Removable**: trailing X icon (16px), click X fires onRemove

**Choice variant**: Single-select within a group (radio behavior). One chip selected at a time per group.

### 2.4 SearchBar

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 9px |
| Background | surface (light) / dark-surface (dark) |
| Border | 1px solid line |
| Leading icon | search, 20px, ink-3 |
| Placeholder | 14px regular, ink-3 |
| Trailing icon | optional (location pin, clear X, mic) |
| Padding | 12px horizontal |

**States**:
- **Focused**: accent-tinted focus glow shadow, 1.01 scale lift, leading icon turns accent, border transitions to accent at 0.3 alpha
- **Hover** (desktop): subtle border darken
- **Has value**: trailing clear X icon appears
- **Disabled**: paper-4 bg, ink-3 text, cursor-not-allowed
- **Recent searches**: Dropdown shows 5 recent searches (from localStorage), clearable with "Clear history" link at bottom

### 2.5 Avatar

| Property | Value |
|----------|-------|
| Size | 52px (default), 40px (small), 34px (compact) |
| Shape | 12px rounded square (editorial default), 999px circle (profile variant) |
| Shadow | subtle (blur 10, offset Y 4, ink 8%) |
| Fallback | gradient accent to accent/72, white initials (Inter, 18px, 600) |

**Optional ring**: Animated accent arc drawn on mount (300ms ease-out, starts from -90deg). `stroke-dasharray` + `stroke-dashoffset` transition on SVG circle.

**Edit overlay**: FAB at bottom-right (24px circle, accent bg, pencil icon 14px white), positioned overlapping edge. Shown only when `editable` prop is true.

### 2.6 Badge

**Variants**: Mode, Verified, Status, Count

| Variant | Style |
|---------|-------|
| Mode | Pill-shaped, pastel bg (teal-soft for co-hunter, coral-soft for room-poster, purple-soft for open-to-both), mid-color icon + text |
| Verified | Checkmark icon + "Verified" text, success-soft bg, success text |
| Status | Status dot (8px circle) + text. Colors: success (confirmed), warning (pending), error (rejected) |
| Count | 20px circle, accent bg, white text (12px bold), positioned at top-right of parent with -4px offset |

### 2.7 Input

**Types**: Text, Select/Dropdown, Textarea

| Property | Text/Select | Textarea |
|----------|-------------|----------|
| Height | 48px | auto (min 120px, max 240px) |
| Border radius | 9px | 9px |
| Background | surface | surface |
| Border | 1px solid line | 1px solid line |
| Label | Eyebrow (10px, 600, uppercase, 0.16em tracking, ink-3) above | Same |
| Placeholder | 14px regular, ink-3 | Same |
| Helper/Hint | Caption (12px, ink-3) below | Same |
| Error | 14px, error color, error icon prefix | Same |

**States**:
- **Focused**: accent border at 0.5 alpha, focus glow shadow, 1.01 scale lift
- **Error**: error border, error text below with icon
- **Disabled**: paper-4 bg, ink-4 text, cursor-not-allowed
- **Filled**: ink text, label floats to top (if using floating label pattern)
- **Autofill**: Browser autofill: accent-soft bg flash (200ms), then normal

**Select**: Same as text input with trailing chevron-down icon. Opens dropdown below with paper-3 bg, 8px radius, shadow-md. Options: 14px Inter, ink text, hover: accent-soft bg, selected: accent-container bg + accent text.

### 2.8 ProgressRing

| Property | Value |
|----------|-------|
| Size | 32px (small), 44px (medium), 56px (large) |
| Stroke | 3px (small), 4px (medium), 5px (large) |
| Track | line color (rgba ink 8%) |
| Fill | compatibility color (success/warning/error) |
| Animation | 300ms ease-out arc draw from -90deg |
| Center text | Percentage in Inter 14px bold |
| ARIA | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` |

### 2.9 Skeleton

**Variants**: Card, ListItem, Feed, Profile

| Variant | Layout |
|---------|--------|
| Card | 16px radius rectangle (full width), shimmer gradient sweep |
| ListItem | Circle (40px) + rounded bar (60% width) + thin bar (40%) |
| Feed | Card variant x3, stacked with 12px gap |
| Profile | Large circle (80px) + 2 bars (50%, 30% width) |

**Animation**: Shimmer gradient (paper-2 -> surface -> paper-2) sweeps left-to-right, 1200ms linear infinite.

### 2.10 Toast

| Property | Value |
|----------|-------|
| Background | surface (light) / surface-elevated (dark) |
| Border radius | 16px |
| Shadow | shadow-lg |
| Max width | 400px |
| Padding | 16px |
| Duration | 5s default, 8s for errors, no auto-dismiss for persistent |
| Position | Bottom-right (desktop), bottom-center (mobile) |

**Structure**: Icon (24px, left) + title (14px semibold) + description (13px regular) + optional action button. Stack vertically: icon + title row, description below.

**Types**: Success (success icon + green tint), Error (error icon + red tint), Info (accent icon), Warning (warning icon + amber tint).

**Entry animation**: Slide up 20px + fade in (200ms ease-out). Exit: fade out (150ms).

**Stacking**: Multiple toasts stack vertically, max 3 visible. Oldest dismissed first when limit exceeded.

**ARIA**: `role="status"`, `aria-live="polite"`.

### 2.11 Modal

| Property | Value |
|----------|-------|
| Background | surface |
| Border radius | 8px |
| Shadow | shadow-lg |
| Max width | 480px (default), 600px (wide) |
| Backdrop | frosted glass (blur 3px) + paper/88 overlay |
| Padding | 24px |

**Structure**: Optional close X (top-right, 20px icon button), title (H3), content, action buttons (stacked or row).

**Entry animation**: Scale 0.95 -> 1.0 + fade in (200ms ease-out).
**Exit animation**: Scale 1.0 -> 0.95 + fade out (150ms ease-out).

**Focus trap**: Tab/Shift+Tab cycles within modal. Escape closes.
**ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title.

### 2.12 Drawer

**Direction**: Right (desktop default), Bottom (mobile default)

| Property | Right Drawer | Bottom Drawer |
|----------|-------------|---------------|
| Width | 400px (standard), 480px (wide) | 100% |
| Max height | 100vh | 85vh |
| Border radius | 0 (left edge: 0, right: flush) | 16px top corners |
| Shadow | shadow-lg (left side) | shadow-lg (top) |
| Backdrop | Same as Modal | Same as Modal |

**Entry**: Slide in from right (280ms ease-out) / slide up from bottom (280ms ease-out).
**Exit**: Slide out (200ms ease-out).

**Drag handle** (bottom drawer only): 40px wide, 4px tall, ink-4 rounded pill, centered at top, 12px from top edge. Draggable to dismiss.

**Focus trap**: Same as Modal.

### 2.13 BottomSheet (mobile)

Web equivalent of mobile bottom sheet. On desktop, renders as Drawer (right side). On mobile (<768px), renders as bottom-draggable sheet.

Same specs as Drawer Bottom variant. Responsive component that switches behavior based on viewport.

### 2.14 SegmentedControl

| Property | Value |
|----------|-------|
| Height | 44px |
| Background | paper-2 |
| Border radius | 999px |
| Padding | 4px |
| Sliding pill | surface bg, shadow-xs, 220ms ease-out slide animation |
| Active text | ink, 14px semibold |
| Inactive text | ink-3, 14px medium |

**ARIA**: `role="tablist"`, segments as `role="tab"`, content as `role="tabpanel"`.

### 2.15 StepProgress

**Variants**: Dots, Segments, Linear

| Variant | Style |
|---------|-------|
| Dots | N circles (8px), connected by 2px lines (ink-4), completed: accent fill, current: accent ring, future: ink-4 |
| Segments | N rectangles (40px wide, 4px tall), completed: accent, current: accent at 50%, future: ink-4 |
| Linear | Single bar, accent fill proportion, 4px tall, paper-3 track |

Step label below (Caption, ink-3). Current step label in ink-2.

### 2.16 PriceText

**Variants**: Hero (26px), Card (18px), Inline (14px)

| Variant | Size | Weight | Color |
|---------|------|--------|-------|
| Hero | 26px | 700 | ink (NOT accent) |
| Card | 18px | 700 | ink |
| Inline | 14px | 600 | ink-2 |

Format: Indian numbering with rupee symbol. E.g., "₹24,000/mo". Lakhs: "₹1.2L/mo".

### 2.17 TrustBadge

**Variants**: Verified, Reviewed, Safe, Privacy

| Variant | Icon | Bg | Text |
|---------|------|----|------|
| Verified | checkmark | success-soft | success |
| Reviewed | shield-check | accent-soft | accent |
| Safe | shield | teal-soft | teal-mid |
| Privacy | lock | accent-soft | accent |

Pill shape (999px radius), icon (16px) + text (12px semibold).

### 2.18 OfflineBanner

**Composition**: Full-width banner with warning icon + text

**Layout**: Fixed top of viewport, full-width, z-50

- Background: paper-3 (light) / surface-elevated (dark)
- Warning icon (20px, ink-3) + "You are offline" text (14px medium, ink-2)
- Height: 40px, content centered
- Appears on network loss, disappears on reconnect (no dismiss button)
- Pushes content below it down by 40px when visible

---

## 3. Component Catalog -- Molecules

### 3.1 ListingCard

**Composition**: Card + Avatar + Chip + ProgressRing + PriceText

**Layout (Desktop -- Horizontal)**:
- Width: 300px fixed (in horizontal scroll) or flex (in grid)
- Image: Left, 148px wide, 16px radius, cover fit
- Heart icon: Top-right, 40px white circle bg
- Content: Right side, padded 12px
  - PriceText (hero): "₹24,000/mo"
  - Title: H3, 16px, below price
  - Location: Row with pin icon (16px, accent) + ink-2 text
  - Info pills: beds, baths, area as compact chips (paper-2 bg)
  - Feature pills: furnished, wifi, etc.
  - Owner row: Avatar (34px) + name + interest count
  - Description: 2-line max, ink-2, truncated with ellipsis
  - Compatibility ring: 32px, top-right of image area
- Footer: Button primary (full-width, "Contact" or "View Details")

**Layout (Mobile -- Vertical)**:
- Full width, image top (aspect 16:10), content below
- Same content structure, stacked vertically

**States**:
- Hover: shadow deepens, 1px translateY, terracotta glow border
- Pressed: scale 0.97, shadow-md
- Skeleton: Card variant with image placeholder

### 3.2 ProfileGridCard

**Composition**: Avatar + ProgressRing + Button

**Layout**: Column, ~48% width in 2-column grid

- Photo: Top, 16px radius, 1:1 or 4:5 aspect
- Match % ring: 44px, top-right corner of photo, animated arc-draw on mount
- Name: 15px bold, ink, below photo
- Age + location: 12px, ink-2
- Profession: 12px, ink-3
- "Match" CTA: Full-width Button primary, 10px radius, 42px height
  - Scale bounce 0.8 -> 1.0 on appear (ease-out-back)

### 3.3 ConversationRow

**Composition**: Avatar + text + Badge + timestamp

**Layout**: Row, full width, 72px height

- Avatar: 52px (editorial square), left. Blur effect if highlighted/unmatched.
- Content: Middle, flex-1
  - Name: 15px semibold, ink
  - Mode badge: Pill (8px height) after name
  - Preview: 13px, ink-2, 1-line truncated
  - Property preview: 12px, ink-3, optional
- Right column:
  - Timestamp: 11px, ink-3, top-right
  - Unread badge: Count badge (if unread)
  - CTA: optional (narrow button)

### 3.4 NotificationCard

**Composition**: Icon container + text + timestamp + unread dot

**Layout**: Row, full width, padding 16px horizontal, 14px vertical

- Icon container: 48px circle, pastel bg per type
  - new_match: pink-soft, heart icon
  - new_message: blue-soft, chat icon
  - listing_approved: green-soft, verified icon
  - listing_rejected: error-soft, close-circle icon
  - visit_scheduled/confirmed: teal-soft, calendar icon
  - general: accent-soft, bell icon
- Content: Flex-1
  - Title: 15px semibold, ink
  - Description: 13px regular, ink-2, 2-line max
- Right:
  - Timestamp: 12px, ink-3
  - Unread dot: 10px accent circle (if unread)
  - Unread left border: 3px accent left accent

### 3.5 MenuItemRow

**Composition**: Icon container + label + chevron

**Layout**: Row, 56px height, full width

- Icon container: 40x40px, 12px radius, pastel-tinted bg per category
  - Uses categorical palette mapping (e.g., bookings=teal, chats=pink, settings=purple)
- Label: 15px medium, ink, flex-1
- Chevron: 20px, ink-3, right
- Divider: 1px line, below each item (except last in group)
- Group spacing: 24px between groups

**Press feedback**: scale 0.98 + icon container opacity 0.8 -> 1.0, terracotta splash.

### 3.6 FilterPanel

**Composition**: SearchBar + Chip groups + range sliders + toggle groups

**Layout**: Vertical, scrollable, 280px wide (desktop sidebar) or full-width bottom sheet (mobile)

- SearchBar at top
- Collapsible filter sections, each with:
  - Section header: Label (14px semibold, ink) + expand/collapse chevron
  - Active filter chips (if any): Row of selected chips with X
  - Hint text: 13px, ink-3
  - Chip groups: Horizontal/vertical wrap of Choice/Filter chips
  - Budget: Range slider (5k-100k INR), dual thumb
  - Move-in: Date picker trigger
  - "More filters" expandable section

**Sections** (in order):
1. Location (city, locality chips)
2. Budget (range slider)
3. Room Type (Any / Private Room / Shared Room / Master Bedroom / Entire Flat)
4. Furnishing (Any / Furnished / Semi / Unfurnished)
5. Gender (Any / Male Only / Female Only)
6. Move-in Timeline (Immediate / This Month / Next Month / Flexible)
7. Amenities (multi-select: WiFi, AC, Parking, Lift, Security, etc.)
8. Society Type (Gated Community / Standalone Building / Co-Living / PG)
9. Society Vibe Tags (multi-select)

### 3.7 SwipeActionBar

**Composition**: Three buttons (Pass / Super Like / Like)

**Layout**: Row, centered, gap 20px

- **Pass**: 60px circle, error-soft bg, error border (2px, 0.3 alpha), X icon (24px, error color)
- **Super Like**: 50px circle, yellow-soft bg, yellow-mid border (2px, 0.3 alpha), star icon (20px, yellow-mid color)
- **Like**: 60px circle, success-soft bg, success border (2px, 0.3 alpha), heart icon (24px, success color)

**Press**: scale 0.9 (150ms ease-out), respective bg deepens.
**Keyboard**: Left=Pass, Up=Super Like, Right=Like.

**Super Like rate limit UI**:
- Badge on Super Like button shows "N/3" remaining
- Disabled state (0 remaining): ink-4 bg + border, star icon ink-4, no press feedback
- Tooltip (0 remaining): "3 super-likes per day. Resets at midnight."

### 3.8 ChatMessageBubble

**Sent** (current user):
- Background: accent (`#C96442`)
- Text: white, 14px medium
- Border radius: 16px (top-left, top-right, bottom-right), 4px bottom-left
- Max width: 290px
- Alignment: right
- Timestamp: 11px, white/60, below bubble right
- Read receipt: double checkmarks (white/60), right of timestamp

**Received** (other user):
- Background: paper-3 (light) / surface-elevated (dark)
- Text: ink, 14px medium
- Border radius: 16px (top-left, top-right, bottom-left), 4px bottom-right
- Max width: 290px
- Alignment: left
- Avatar: 28px, left of bubble (first message in group only)
- Timestamp: 11px, ink-3, below bubble left

**Image message**: 18px radius, max 220px width, placeholder while loading. Sending: thumbnail with circular progress ring overlay. Failed: red error badge + "Retry" tap.

**Visit request message**: Left border 3px colored by status (pending=warning, confirmed=success, cancelled=error), with action buttons (Confirm / Reschedule / Cancel) inside bubble.

**Failed state** (sent message that failed to deliver):
- Background: accent at 0.6 opacity
- Exclamation icon (16px, error color) right of bubble
- Tooltip: "Tap to retry"
- On tap: re-send message

**System message**: Centered, 12px ink-3, no bubble (e.g., "You matched on Jun 5").

### 3.9 VisitCard

**Composition**: Property thumbnail + date/time + status badge + action buttons

**Layout**: Card, full width, padding 16px

- Property thumbnail: 56px, 12px radius, left
- Content: Middle, flex-1
  - Property title: 14px semibold, ink
  - Visit type pill: "Property Tour" (teal-soft bg) or "Flatmate Meet" (purple-soft bg), shown after property title
  - Date/time: 13px, ink-2, with calendar icon
  - Status badge: Pill (confirmed=success, pending=warning, cancelled=error, completed=ink-3)
- Action buttons: Row, right side
  - Confirmed: Reschedule (tertiary) + Cancel (tertiary, error text)
  - Pending (receiver): Confirm (primary, compact) + Reschedule (tertiary) + Cancel (tertiary)
  - Pending (sender): pending status, Cancel (tertiary)
  - Completed: Rate (tertiary)
  - Cancelled: no actions

### 3.10 MatchContextCard

**Composition**: Thumbnail + mode badge + locality + rent

**Layout**: Card, full width, padding 12px, expandable (click to expand/collapse)

- Thumbnail: 88px wide, 12px radius, left
- Content: Middle
  - Title: 14px semibold, ink
  - Price: PriceText (inline)
  - Mode badge: Pill after title
  - Locality: 12px, ink-3, pin icon
- Chevron: 20px, ink-3, right (rotates 90deg on expand, 250ms)
- Expandable section: Shows "View Listing" button, additional details

### 3.11 QnACard

**Composition**: Question + answers from both parties + banner

**Layout**: Card, full width, padding 16px

- Banner: "Both answered" or "Waiting for their answers" (12px, accent-soft bg, accent text)
- Question rows (3):
  - Question text: 13px semibold, ink-2
  - Their answer: 14px, ink, left-aligned, with small avatar
  - Your answer: 14px, ink, right-aligned, with small avatar
  - Match indicator: green check or neutral dash between answers

### 3.12 SocietyTagVoteRow

**Composition**: Tag label + vote buttons + dispute badge

**Layout**: Row, full width, 44px height

- Tag label: 14px, ink, flex-1
- Upvote: 32px circle button, ink-3 icon, voted=accent
- Vote count: 12px, ink-2, between buttons
- Downvote: 32px circle button, ink-3 icon, voted=error
- Dispute badge: 8px warning dot (if disputed)

---

## 4. Component Catalog -- Organisms

### 4.1 AppShell

**Composition**: Sidebar + top bar + content area + bottom nav (responsive)

**Desktop (>= 1024px)**:
- Sidebar: 240px wide (desktop), 280px (wide), collapsible to 64px (icon-only)
  - Logo: "360 FLATMATES" at top (full: 38px "36" + icon + 15px "FLATMATES"; collapsed: icon only)
  - Nav items: Vertical list per mode (see Section 7.3)
  - Active: accent text + icon, accent/14 bg pill
  - Inactive: ink-3 text + icon, transparent bg
  - Hover: paper-2 bg
  - Collapse toggle: Button at bottom of sidebar
  - User section: Avatar (40px) + name + mode badge, bottom, links to /profile
- Top bar: 56px, paper bg, shadow-xs bottom
  - Page title: H3, left
  - Right: notification bell (with count badge) + user avatar dropdown
- Content area: Flex-1, paper bg, overflow-y auto, padding 24px

**Tablet (768-1023px)**:
- Collapsed sidebar (64px icons only)
- Content area: Full remaining width

**Mobile (< 768px)**:
- No sidebar
- Bottom nav: 76px height, frosted-glass paper/88 bg
  - 5 tabs, mode-dependent (see Section 7.3)
  - Active: accent icon + label, accent/14 bg indicator
  - Inactive: ink-3 icon + label
  - Labels always visible
- Top bar: Same as desktop but simpler (logo + bell only)
- Content area: Full width, 20px edge padding

### 4.2 SwipeDeck

**Composition**: Card stack + SwipeActionBar + expanded drawer + quota header

**Desktop layout**:
- Centered panel (max-width 480px) on paper bg
- Quota header: Logo (compact) + swipe counter + super-like cap, top
- Card stack: Centered, max-width 400px, card height ~520px
  - Current card: Full opacity, z-10
  - Background card: 8px down offset, 0.5 opacity, 0.92 scale, z-0
- SwipeActionBar: Below card stack, centered
- Card count: "3 of 12 remaining", centered, Caption ink-3

**Card content (collapsed)**:
- Full-bleed photo with 3-stop gradient overlay (transparent top -> accent/40 bottom)
- Mode chip: Top-left, paper/80 bg
- Compatibility ring: 56px, top-right
- Verified badge: Below compat ring
- Name + age: H2, white (over gradient), bottom-left
- Location: 13px, white/80, pin icon
- Top match chips: 2-3 lifestyle chips, bottom
- Move-in countdown: "Available in 12 days", bottom-right

**Card drag interaction**:
- Drag: translate + rotate (max 15deg, proportional to horizontal offset)
- Threshold: 20% card width for decision
- LIKE overlay: Green pill at 0.15rad, "LIKE" text, appears when drag right > threshold
- NOPE overlay: Red pill at -0.15rad, "NOPE" text, appears when drag left > threshold
- Directional tint: Green/red overlay at 0.12 alpha based on drag direction
- Snap back: 300ms ease-out if released below threshold
- Fly off: 200ms ease-out if released above threshold

**Expanded view**: Right-side drawer (400px) on desktop, full-screen overlay on mobile
- Avatar (52px) + name + compatibility ring header row
- Scrollable sections:
  1. Video Tour (if available)
  2. About Me (bio text + non-negotiable chips if any + pet status icon "Has pets"/"No pets" + party habit tag)
  3. Compatibility Breakdown (6 dimension rows with ProgressRings)
  4. The Society (location, amenities chips, vibe tags)
  5. Location Map (mini embedded map)
  6. The Room (type, furnishing, features, photos)
  7. The Flat & Flatmates (config, floor, amenities)
  8. Costs Breakdown (rent, deposit, maintenance, electricity, cook/maid, total)
  9. Budget range + move-in timeline

**Empty deck state**: Illustrated empty state, breathing icon, "Check back later for new profiles"

### 4.3 ChatThread

**Composition**: Message list + input bar + MatchContextCard + visit cards + QnA

**Desktop layout (split view)**:
- Left panel: 320px, conversation list (see `/chats`)
- Right panel: Flex-1
  - **Header** (56px): Back (mobile only) + avatar (40px) + name + verified dot + mode badge pill + compatibility score dot + realtime status icon (20px, right of mode badge: cloud-off icon ink-3 when disconnected, tooltip "Messages may be delayed") + schedule visit icon + overflow menu (3-dot: "Archive Conversation", "Block User", "Report")
  - **MatchContextCard**: Pinned at top, expandable (AnimatedSize 250ms)
  - **QnA section**: Collapsible, shows answers or "Waiting" banner
  - **Pre-message area**: Shown if no messages sent yet
    - QnA nudge card: accent-soft bg, "Answer 3 questions to break the ice" + "Start" button
    - Icebreaker chips: 3 suggestion chips (e.g., "What's your typical weekend?", "How do you feel about pets?")
  - **Message list**: Flex-1, overflow-y auto, scroll-to-bottom on new message
    - Date divider: "Today" / "Jun 5, 2025", centered, 12px ink-3
    - Message bubbles (see 3.8)
    - Auto-scroll: On new message, scroll to bottom if already at bottom
  - **Input bar** (56px + 16px padding): Frosted-glass bg
    - TrustBadge.privacy: Left of input
    - Emoji button: 24px, ink-3
    - TextField: 24px radius, flex-1, "Type a message..." placeholder
    - Attachment button: 24px, ink-3, opens file picker (images)
    - Send button: 48px circle, accent bg, send icon (white), disabled state: ink-4 bg
    - Enter = send, Shift+Enter = new line

**Mobile layout**: Full screen, same structure, header has back arrow.

### 4.4 ListingBuilder

**Composition**: Multi-step form with step indicator + navigation

**Layout**: Full height, centered max-width 640px

- **Header** (56px): Back arrow + "360" logo (compact, centered)
- **Step progress**: Segments variant, shows current step out of 8
- **Form area**: Flex-1, overflow-y auto, padding 24px
  - Each step: Grouped fields with 16px gap
  - Field type specifics (see Section 6)
- **CTA bar** (sticky bottom): Frosted-glass bg
  - "Back" (tertiary, left) + "Next" (primary, right) or "Publish Listing" on final step
  - "Save as Draft" (tertiary, centered) on final step

### 4.5 FeedSection

**Composition**: Section header + horizontal card scroll

- Section header: H3 (16px, 600, ink) + optional action link ("See all >" or "Explore >", tertiary button)
- Card scroll: Horizontal overflow-x auto, snap scroll, gap 16px
  - ListingCards or ProfileGridCards depending on section type
- "Picked for You": Compatibility-ordered listing cards
- "New in [City]": Recency-ordered listing cards

### 4.6 MapExplorer

**Composition**: Map + filter bar + cluster/pin sheets

**Desktop layout**: Full viewport height, map fills content area

- **Filter bar** (56px, top): Horizontal scroll of filter chips (budget, room type, gender, move-in, verified) + "Filters" button (opens full FilterPanel as right drawer)
- **Map**: Google Maps, fills remaining area
  - Cluster markers: 48px circle, purple bg, count text, click to zoom
  - Single markers: 40px circle, orange (room available) / blue (co-hunter), home icon
  - Info window (on pin click): Mini card with photo (56px), title, rent, compatibility %, "View" CTA
- **Cluster sheet** (on cluster click): Bottom sheet listing mini-cards for all items in cluster
- **Control buttons** (bottom-right): Zoom in/out + locate-me, 40px circles, surface bg, shadow-md

### 4.7 SearchResults

**Composition**: Filter sidebar + result grid + pagination + saved-search CTA

**Desktop layout (three-panel)**:
- **Left sidebar** (280px): FilterPanel (see 3.6)
- **Center**: Result grid
  - 2 columns (desktop), 1 column (mobile)
  - ListingCards in vertical grid, gap 16px
  - Result count: "128 results" eyebrow label
  - Sort dropdown: "Sort by: Relevance / Newest / Price Low-High / Price High-Low / Distance / Popular / Match %"
  - Pagination: Page numbers (1 2 3 ... 12) + prev/next arrows
  - "No results" empty state if filters yield nothing
- **Right** (optional, toggleable): Map preview panel (320px), mini MapExplorer
- **Saved search CTA**: Sticky bottom bar or floating button: "Save this search" -> opens SaveSearchModal

**Mobile layout**: FilterPanel as bottom sheet, single-column results, no map preview.

### 4.8 DashboardPanel

**Composition**: Metric cards + trend chart + listing performance table

**Layout**: Max-width 1200px, centered

- **Summary row**: 4 metric cards in a row (desktop) or 2x2 grid (mobile)
  - Each: Card, padding 20px, 12px radius
  - Value: H2 (24px, ink) + label: Caption (ink-3) + trend arrow (success up / error down)
  - Metrics: Total Listings, Total Views, Total Likes, Total Conversations
- **Trend chart**: Card, 300px height, line chart (views/likes over 30 days)
  - X-axis: dates, Y-axis: count
  - Accent line for views, success line for likes
- **Listing performance table**: Card, full width
  - Columns: Listing Title, Views, Likes, Conversations, Visits, Boost Status, Actions
  - Rows: One per active listing
  - Boost status: Pill (active=success, inactive=ink-3, expired=warning)
  - Actions: View Analytics / Boost / Edit

---

## 5. Component Catalog -- Templates

### 5.1 PublicPage

**Layout**: Nav bar + hero + content + footer

- **Nav bar** (64px): Fixed top, surface bg, shadow-xs
  - Left: "360 FLATMATES" logo (clickable -> `/`)
  - Center: Nav links (Discover, Search, Stats) -- H4 text
  - Right: "Login" button (secondary) + "Sign Up" button (primary)
  - Mobile: Logo + hamburger menu (opens mobile nav drawer)
- **Hero**: Optional, full-width, paper bg, centered content
  - Headline: Display (32px, Fraunces)
  - Subtitle: Body Large (16px, Inter, ink-2)
  - CTA: Button primary
- **Content**: Max-width 1200px, centered, padding 24px
- **Footer**: Paper-2 bg, 80px height, links + copyright

### 5.2 AuthenticatedPage

**Layout**: AppShell wrapper (sidebar + top bar + content + bottom nav)

Content area scrolls independently. Sidebar persistent on desktop.

### 5.3 FormPage

**Layout**: Step progress + form area + CTA bar

- Max-width 640px, centered
- Step progress at top
- Form content scrollable
- CTA bar sticky at bottom, frosted-glass bg

### 5.4 ChatPage

**Layout**: Full-height split view (desktop) or separate routes (mobile)

- Desktop: 320px left panel (conversation list) + flex-1 right panel (chat thread)
- Mobile: Conversation list route + chat thread route

### 5.5 DashboardPage

**Layout**: Sidebar nav + metric cards + detail panels

Same as AuthenticatedPage with DashboardPanel in content area.

---

## 6. Page-by-Page Design Specifications

### 6.1 PUBLIC PAGES

#### Page 1: `/` -- Landing Page (SSG)

**Template**: PublicPage

**Layout**:
- **Hero section** (80vh): Paper bg
  - Headline: Display (32px, Fraunces), "Find Your Flatmate, Find Your Vibe"
  - Subtitle: Body Large, ink-2, "Verified homes. Compatible flatmates. Better living, together."
  - Key words in Instrument Serif italic: "Flatmate", "Vibe"
  - CTA: Button primary, "Get Started" -> `/discover`
  - Secondary CTA: Button tertiary, "Browse Listings" -> `/search`
  - Background: Subtle living room line art illustration
- **Features section**: 3 feature cards in a row (desktop) or stacked (mobile)
  - "6-Dimension Compatibility" with ProgressRing icon
  - "Verified Listings" with TrustBadge icon
  - "Schedule Visits" with calendar icon
- **Stats bar**: "2,500+ Flatmates | 1,200+ Listings | 6 Cities"
- **CTA section**: "Ready to find your perfect flatmate?" + Button primary
- **Footer**: Links, copyright

**Responsive**:
- Desktop: Hero text left-aligned, illustration right
- Mobile: Hero centered, stacked, illustration below text

**SEO**:
- Title: "360 Flatmates -- Find Your Flatmate, Find Your Vibe"
- Description: "Find compatible flatmates and verified rooms across India. 6-dimension matching, schedule visits, and move in with confidence."
- JSON-LD: FAQPage schema
- OG image: Hero illustration

#### Page 2: `/discover` -- Public Listing Browse (SSR + ISR 5min)

**Template**: PublicPage

**Layout**:
- **Header**: "Browse Listings" (H1) + city dropdown + search trigger
- **Filter chips**: Horizontal scroll (Nearby, 1BHK, Furnished, Budget+) -- on click, show auth wall if not authenticated
- **Listing grid**: 2 columns (desktop), 1 column (mobile), ListingCards
- **Infinite scroll**: Load more on scroll intersection
- **Auth wall**: Click on any "Contact" or "Like" -> Login modal (not redirect)

**Responsive**:
- Desktop: 2-3 column grid
- Mobile: Single column, compact card variant

**SEO**:
- Title: "Browse Flatmate Listings in [City] -- 360 Flatmates"
- JSON-LD: BreadcrumbList
- ISR: 5 minutes

#### Page 3: `/discover/[id]` -- Listing Detail (SSR)

**Template**: PublicPage

**Layout**:
- **Image carousel**: Full-width (desktop: 480px max-height), back/share/heart icon overlays
  - Desktop: Large main image + thumbnail strip below
  - Mobile: Swipeable carousel with page indicators (animated width: 20px active / 7px inactive)
- **Title section**:
  - Title: H2 (24px, Fraunces), "Modern 2BHK Flat"
  - Price: PriceText hero, "₹24,000/mo"
  - Location: Pin icon (16px, accent) + "HSR Layout, Bangalore" (Body Medium, ink-2)
- **Info chips row**: Beds(2), Furnished, WiFi, High-Speed, 24/7 Security, Parking, Lift
- **About section**: "About this Flat" (H3) + description paragraph (Body Medium, capped 65ch)
- **Availability grid**: 2 columns -- Available from (date) | Posted on (date)
- **Cost breakdown** (expandable): Monthly rent, security deposit, maintenance, electricity, cook/maid, setup costs, total monthly outflow
- **Video tour** (if available): Inline player, looping muted default, mute/unmute pill overlay
- **Mini map**: 220px height embedded map, "Get Directions" button
- **Trust badges row**: Verified, Reviewed, etc.
- **Action bar** (sticky bottom): "Save" (secondary, left) + "Contact" (primary, right)
  - Unauthenticated: "Contact" shows auth wall

**Responsive**:
- Desktop: Image left (480px), details right (flex-1)
- Mobile: Image top (full-width), details below, stacked

**SEO**:
- Title: "[Title] in [Locality], [City] -- ₹[Rent]/mo -- 360 Flatmates"
- JSON-LD: RealEstateListing schema
- OG image: First listing photo

#### Page 4: `/search` -- Advanced Search (SSR)

**Template**: PublicPage (authenticated users see FilterPanel sidebar)

**Layout**: See SearchResults organism (4.7)

**URL state**: All filters synced to URL via nuqs:
`/search?q=&city=&price_min=&price_max=&sharing_type=&move_in=&amenities=&sort_by=&page=`

**Save search flow**: "Save this search" -> SaveSearchModal

**SEO**:
- Title: "Search Flatmates & Rooms in [City] -- 360 Flatmates"
- Canonical URL with normalized query params

#### Page 5: `/search/semantic` -- Semantic Search (SSR)

**Template**: PublicPage

**Layout**:
- **Search bar**: Large (56px), centered, "Describe your ideal flatmate or flat..." placeholder
- **Example queries**: 4-6 suggestion chips ("Quiet flatshare near Bandra station under 30k with pet-friendly society")
- **Results**: Same grid as `/search` but with match_percentage sort

#### Page 6: `/stats` -- City Statistics (ISR 15min)

**Template**: PublicPage

**Layout**:
- **City selector**: Chip group of 6 cities
- **Stats grid**: 2x3 (desktop) or 2x2 (mobile) metric cards
  - Active seekers count, Active listings, Avg rent, Most popular locality, Avg compatibility score, New members this month
- **Trend chart**: Line chart of seeker growth over 6 months

**SEO**:
- Title: "[City] Flatmate Market: [X] Active Seekers -- 360 Flatmates"
- ISR: 15 minutes

#### Page 7: `/share/[id]` -- Share Card Redirect (SSR)

Server-rendered OG image target. Redirects to `/discover/[id]` for browser visits. Serves OG meta tags for social media crawlers.

#### Page 33: `/terms` -- Terms & Conditions (SSG)

**Template**: PublicPage

**Layout**: Max-width 720px, centered, prose typography
- **Header**: "Terms & Conditions" (H1, Fraunces) + last updated date (12px, ink-3)
- **Body**: Rich text content, sections with H2 headings
- Minimal custom design, standard legal page layout

#### Page 34: `/privacy` -- Privacy Policy (SSG)

**Template**: PublicPage

**Layout**: Same as /terms, content-specific to privacy policy
- **Header**: "Privacy Policy" (H1, Fraunces) + last updated date

#### Page 35: `/about` -- About 360 Flatmates (SSG)

**Template**: PublicPage

**Layout**:
- **Hero**: Logo (64px) + "360 Flatmates" (H1, Fraunces)
- **Mission statement**: Body Large, centered
- **Features**: 3-column grid of feature cards (Find Flatmates, List Your Space, Match on Lifestyle)
- **Team section**: Optional, avatars + names
- **Download CTA**: App store links (if applicable)
- **Footer**: Links to /terms, /privacy, contact email

#### Page 36: `/not-found` -- 404 Page (Static)

**Layout**: Full viewport, centered content
- **Illustration**: Search/magnifying glass illustration (120px)
- **Title**: "Page not found" (H1, Fraunces)
- **Body**: "The page you're looking for doesn't exist or has been moved." (Body Medium, ink-2)
- **CTA**: "Go Home" button (primary) -> navigates to `/home`

#### Page 37: `/error` -- 500 Page (Static)

**Layout**: Full viewport, centered content
- **Illustration**: Alert/warning illustration (120px)
- **Title**: "Something went wrong" (H1, Fraunces)
- **Body**: "We're having trouble loading this page. Please try again." (Body Medium, ink-2)
- **CTA**: "Try Again" button (primary) -> reloads page

#### Page 38: `/maintenance` -- Maintenance Page (Static)

**Layout**: Full viewport, centered content
- **Illustration**: Wrench/tool illustration (120px)
- **Title**: "We'll be back soon" (H1, Fraunces)
- **Body**: "We're making some improvements. Estimated downtime: [time]." (Body Medium, ink-2)
- **CTA**: "Check Status" link (tertiary) -> links to status page if available

---

### 6.2 AUTH PAGES

#### Page 8: `/login` -- Phone OTP + Password (CSR)

**Template**: AuthPage (centered card on paper bg, max-width 400px)

**Layout**:
- **Logo**: "360 FLATMATES" full size, centered top
- **Tab switch**: SegmentedControl -- "OTP" / "Password"
- **OTP tab**:
  - Phone input: +91 prefix (56px accent-soft bg pill) + 10-digit field (48px height)
  - "Continue with OTP" Button primary, full width
  - OTP input: 6 individual digit boxes (48px each, 9px radius, center-aligned text 24px)
  - Auto-submit on 6th digit
  - Resend countdown: "Resend OTP in 00:54" (Caption, ink-3) -> "Resend OTP" (tertiary button)
  - Back to phone: "Change number" tertiary
- **Password tab**:
  - Phone input (same as OTP)
  - Password input: with eye toggle icon (48px height)
  - "Sign In" Button primary, full width
- **Signup link**: "Don't have an account? Sign up" (tertiary)
- **Forgot Password**: "Forgot Password?" link (tertiary, below Password tab sign-in button)
- **Footer**: TrustBadge.privacy "Your data is safe with us"

**States**:
- Loading: Button shows spinner
- Error: Error toast, field-level error below input
- Success: Redirect to `/onboarding` (if new) or `/home` (if returning)

**Responsive**: Same layout, wider padding on desktop.

#### Page 8b: `/forgot-password` -- Password Reset (CSR)

**Template**: AuthPage (centered card on paper bg, max-width 400px)

**Layout**:
- **Logo**: "360 FLATMATES" full size, centered top
- **Step 1 -- Phone**: Phone input: +91 prefix + 10-digit field + "Send Reset Code" (primary)
- **Step 2 -- OTP**: 6-digit OTP boxes (same as login) + "Verify" (primary)
- **Step 3 -- New Password**: New password input with eye toggle + rule checklist + Confirm password + "Reset Password" (primary)
- **Back**: "Back to Login" (tertiary) at bottom

**States**: Same as login (loading spinner, error toast, field-level errors)

#### Page 9: `/onboarding/*` -- Multi-Step Onboarding (CSR)

**Template**: FormPage

**Step 0 -- Splash (3 slides)**:
- PageView with 3 slides
- Each: Illustration (centered) + headline (H1, Fraunces) + subtitle (Body Medium)
- Slide 1: Welcome illustration + "Find your vibe"
- Slide 2: Compatibility illustration + "Match on what matters"
- Slide 3: Trust illustration + "Move in with confidence"
- Page dots: Outline style, active = filled accent circle
- Bottom: Skip (tertiary, left) + Next (primary, right)

**Step 1 -- Mode Selection**:
- Progress: 1 of 7 dots connected
- Heading: "I am looking to" (H1)
- Subtitle: "Select the option that best describes you" (Body Medium, ink-2)
- 3 option cards (vertical, 16px radius, white bg, shadow-sm):
  - Each: 56px accent-soft circle icon (left) + title (H3) + description (14px, ink-2) + chevron (right)
  - Card 1: home icon + "Find a Flat / Flatmate" + "I want to find a place or a flatmate"
  - Card 2: group icon + "List My Flat / Find Flatmate" + "I want to list my flat or find a flatmate"
  - Card 3: swap icon + "Open to Both" + "I'm flexible"
  - Selected: accent border + accent-soft bg tint
- CTA: "Continue" primary, full width

**Step 2 -- Location**:
- Search bar: "Search location" placeholder
- "Use my current location" row: location icon (accent) + accent text + chevron
- "POPULAR CITIES" eyebrow label
- City rows: Pin icon (accent) + city name + chevron, paper-2 bg, 12px radius
- Selected city: accent border + accent-soft bg
- CTA: "Continue" primary, full width

**Step 3 -- Basic Info**:
- Full name: Input
- Age: Number input (18-100) or slider
- Profession: Input with dropdown suggestions
- Gender: Choice chips (Male / Female / Non-binary / Prefer not to say)
- CTA: "Continue" primary, full width

**Step 4 -- Profile Photo**:
- Large circle preview (120px) with edit FAB overlay
- Photo grid (2x3) showing uploaded photos
- "+ Add Photo" button (secondary) with camera icon
- On image selection: Client-side compress to max 2MB, auto-crop to 1:1 aspect ratio. Preview before upload.
- Max 5 photos, minimum 1 required
- CTA: "Continue" primary, full width

**Step 5 -- Lifestyle Quiz**:
- 6 dimension cards, each:
  - Dimension label (Eyebrow, uppercase)
  - Question text (H3)
  - 3-4 choice chips in a wrap row
  - Dimensions: Sleep Schedule, Cleanliness, Food Habits, Smoking/Drinking, Guests Policy, Work Style
- CTA: "Continue" primary, full width

**Step 6 -- Budget & Timeline**:
- Budget range: Range slider (₹5,000 - ₹100,000), dual thumb, with displayed values
- Move-in timeline: Choice chips (Immediate / This Month / Next Month / Flexible)
- CTA: "Continue" primary, full width

**Step 7 -- Preferences & Non-Negotiables**:
- Gender preference: Choice chips (Any / Male Only / Female Only)
- Non-negotiables: Multi-select chips (max 3 from 10 options):
  - food_veg_only, no_smoking, no_drinking, no_overnight_guests, no_pets, gender_female_only, gender_male_only, no_parties, min_tidy, early_riser
  - Each with icon + label
- CTA: "Complete Setup" primary, full width

**Room Poster only -- Additional Step: Listing Builder** (redirect to `/post`)

**Completion**: Loading spinner -> redirect to `/home`

---

### 6.3 AUTHENTICATED PAGES

#### Page 10: `/home` -- Personalized Feed (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header row**:
  - Left: Greeting "Hi, [Name]!" (H2 bold, Fraunces)
  - Below: Location with dropdown chevron (Body Medium, ink-2)
  - Right: Notification bell (with count badge) + user avatar (52px, links to /profile)
- **Search bar**: "Search by location, name or landmark" (20px radius on web)
- **Filter chips**: Horizontal scroll (Nearby, 1BHK, Furnished, Budget+)
- **Feed sections** (vertical stack):
  - "Picked for You" FeedSection -> horizontal scroll of ListingCards (compatibility-ordered)
  - "New in Bangalore" FeedSection -> horizontal scroll of ListingCards (recency-ordered)
  - "Near You" FeedSection -> horizontal scroll of ListingCards (distance-ordered)
- **Pull to refresh** (mobile) / refresh button (desktop)

**Empty state**: "No listings yet" illustration + "Browse all listings" CTA

#### Page 11: `/swipe` -- Swipe Deck (CSR)

See SwipeDeck organism (4.2) for full specification.

**Additional elements**:
- **City/budget filter**: Top filter chips to narrow deck
- **Undo button**: Appears briefly after swipe (5s timeout), reverses last action
- **Match celebration modal**: On mutual match
  - Confetti animation (explosive blast)
  - Gradient background (accent/20)
  - Scale transition 0.8 -> 1.0 (600ms ease-out-back)
  - Paired avatars with heart icon between
  - "It's a Match!" (H1, Fraunces)
  - Compatibility percentage
  - "Send a Message" (primary) -> opens chat
  - "Keep Swiping" (tertiary)

#### Page 12: `/likes` -- Incoming Likes (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Likes" (H1)
- **SegmentedControl**: "Likes" (filled) / "Matches" (outline)
- **Likes tab**: "People who liked you" section header + heart icon
  - 2-column grid of ProfileGridCards
  - Each card: "Match" CTA -> fires match, then moves to Matches
- **Matches tab**: Grid of matched ProfileGridCards
  - Each: "Chat" CTA -> navigates to /chats/[id]
- **Safety banner**: Shield icon + "Safety first" + privacy note + chevron
- **Empty states**: "No likes yet" / "No matches yet"

#### Page 13: `/chats` -- Conversation List (SSR)

**Template**: AuthenticatedPage (split layout on desktop)

**Desktop layout**:
- Left panel (320px): Conversation list
  - "360 FLATMATES" logo (compact) at top
  - SegmentedControl: "Likes" / "Chats"
  - Search bar (compact, 40px height)
  - Likes tab: 2-column grid of ProfileGridCards (blurred if not matched)
  - Chats tab: List of ConversationRows
    - Archived conversations: Collapsible section at bottom, "Archived (N)" label (ink-3), expand to view. Blocked conversations hidden (unblock from Settings). Closed conversations in archived section.
  - Safety banner at bottom
- Right panel: Empty state "Select a conversation" or auto-loads last active chat

**Mobile layout**: Full-screen conversation list, tapping a conversation navigates to `/chats/[id]`

#### Page 14: `/chats/[id]` -- Chat Thread (CSR, real-time Supabase Broadcast)

See ChatThread organism (4.3) for full specification.

#### Page 15: `/explore` -- Map View (Authenticated) (CSR)

See MapExplorer organism (4.6) for full specification.

**Additional authenticated features**:
- Compatibility % shown on pin info windows
- Click "View Profile" -> profile drawer

#### Page 16: `/post` -- New Listing Builder (CSR)

See ListingBuilder organism (4.4) for framework. Step-by-step form details:

**Step 0 -- Location**:
- Society name: Input + autocomplete from Google Places
- Address: Input (auto-filled from society)
- City: Dropdown (from catalog)
- Locality: Input (auto-filled from society)

**Step 1 -- Society**:
- Society type: Choice chips (Gated Community / Standalone Building / Co-Living / PG)
- Amenities: Multi-select chips (Swimming Pool, Gym, Park, Security, Parking, Lift, Power Backup, Intercom, Clubhouse, CCTV)
- Vibe tags: Multi-select chips (Quiet, Family-friendly, Young Professionals, Pet-friendly, Party-friendly, Green/Nature, Luxury, Budget-friendly)

**Step 2 -- Room**:
- Room type: Choice chips (Private Room / Shared Room / Master Bedroom / Entire Flat)
- Furnishing: Choice chips (Fully Furnished / Semi Furnished / Unfurnished)
- Features: Multi-select chips (AC, Attached Bathroom, Balcony, Window, Cupboard, Study Table, TV, Heater)
- Photos: Upload grid (2-10 photos, drag-and-drop, preview with delete)
  - On image selection: Client-side compress to max 2MB, auto-crop to 4:5 aspect ratio. Preview before upload. Max 10 photos.
  - Uploading: 48px thumbnail + circular progress ring overlay
  - Failed: 48px thumbnail + red error badge + "Retry" tap
- Video tour URL: Input (optional YouTube link)

**Step 3 -- Room (continued)**:
- Additional room details if shared: Number of sharing mates
- Room size: Input (sq ft, optional)

**Step 4 -- Flat**:
- Configuration: Choice chips (1BHK / 2BHK / 3BHK / 4BHK)
- Floor: Number input
- Total floors: Number input
- Flat amenities: Multi-select chips (WiFi, Washing Machine, Fridge, Microwave, RO Water, DTH, Maid, Cook)

**Step 5 -- Costs**:
- Monthly rent: Input (₹ prefix)
- Security deposit: Input (₹ prefix)
- Maintenance: Input (₹ prefix, monthly)
- Electricity: SegmentedControl (Included / Separate) + if separate: Input (₹ prefix, monthly avg)
- Cook/maid costs: Input (₹ prefix, monthly)
- Setup costs: Input (₹ prefix, one-time)
- **Total monthly outflow**: Auto-calculated, displayed as PriceText hero, accent bg card

**Step 6 -- About & Preferred Flatmate**:
- Typical day description: Textarea (max 500 chars)
- Gender preference: SegmentedControl (Any / Male Only / Female Only)
- Age range: Dual slider (18-40)
- Non-negotiables: Multi-select chips (max 3)
- Available from: Date picker
- About the flatmate: Textarea (max 300 chars)

**Step 7 -- Review**:
- Summary card of all data
- Each section: Editable, with edit button (pencil icon) that jumps back to that step
- Review notice: Shield icon + "We'll review your listing within 24 hours"
- CTAs: "Publish Listing" (primary) + "Save as Draft" (tertiary)

**Post-submit**: Redirect to Listing Under Review page

#### Page 17: `/manage` -- Listing Management (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Post & Manage" (H1) + "New Listing" button (primary, with grid icon)
- **SegmentedControl**: "Active (N)" / "Pending (N)" / "Drafts (N)" / "Paused" / "Expired (N)"
- **Active tab**: List of manage cards
  - Each: Listing image (88px) + title + price + quick stats chips
  - Stats row: Views (eye icon) | Likes (heart) | Chats (chat) | Visits (calendar) -- each as compact metric
  - Action row: Pause/Resume | Edit | Boost | Share | View Stats
- **Pending tab**: Listings awaiting admin review
  - Each: Listing image + title + "Pending Review" status badge (warning color)
  - Action row: Edit | Cancel
- **Drafts tab**: Similar but with "Continue Editing" + "Delete" actions
- **Paused tab**: Paused listings, similar to Active but with "Resume" primary action
- **Expired tab**: Similar but with "Renew" + "Delete" actions. Rejected listings shown with "Rejected" badge (error color) + reason text + "Edit & Resubmit" action

#### Page 18: `/dashboard` -- Room Poster Analytics (SSR)

**Template**: AuthenticatedPage

See DashboardPanel organism (4.8) for layout.

**Additional elements**:
- **Time range selector**: SegmentedControl (7d / 30d / 90d)
- **Listing analytics**: Click "View Stats" on a listing -> detailed analytics
  - View count trend (line chart)
  - Engagement funnel (views -> likes -> chats -> visits)
  - Boost status + "Boost Now" CTA

#### Page 19: `/visits` -- Visits List (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "My Visits" (H1)
- **Timeline sections** (vertical stack):
  - **Confirmed** (green left border accent): List of VisitCards with confirmed status
  - **Requested** (amber left border): List of VisitCards with pending actions
  - **Completed** (ink-3, muted): List of VisitCards with completed status
  - **Cancelled** (error, muted): List of cancelled VisitCards (collapsible)
- **Empty state**: "No visits scheduled" + "Start chatting" CTA

#### Page 20: `/visits/[id]` -- Visit Detail (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Property card**: MatchContextCard
- **Visit info**: Date, time slot, status, notes
- **Counterparty info**: Avatar + name + mode badge
- **Actions**: Confirm / Reschedule / Cancel / Complete (per status)
- **Reschedule modal**: Calendar + time slot chips (same as Schedule Visit)

#### Page 21: `/profile` -- Profile View/Edit (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Profile" (H1, left) + settings gear icon (top-right)
- **Avatar section**: Large circular photo (120px) with edit FAB (24px circle, accent bg, pencil icon)
- **Info**: Name (H2, centered), mode badge (pill, centered), location (Body Medium, ink-2, centered), TrustBadge (centered)
- **Menu groups** (staggered entry, 100ms delay between groups):
  - **Activity**: My Visits (calendar icon) | Saved (heart icon) | My Chats (chat icon)
  - **Account**: Edit Profile (person icon) | Change Password (lock icon) | Privacy (shield icon)
  - **App**: Notifications (bell icon) | Blocked Users (person-off icon) | Preferences (tune icon)
  - **Legal**: About (info icon) | Terms (document icon) | Privacy Policy (shield-check icon)
  - **Danger**: Delete Account (trash icon, error text + error icon)
  - **Logout**: Logout (logout icon, error text + error icon)

#### Page 22: `/profile/[id]` -- Public Profile View (SSR)

**Template**: AuthenticatedPage (no edit capabilities)

**Layout**:
- Avatar (80px, no edit FAB) + name + mode badge + location + TrustBadge
- Compatibility ring (large, 80px) + percentage
- Compatibility breakdown: 6 dimension ProgressRings
- Lifestyle tags: Chip group
- Non-negotiable chips (if any): accent-soft bg
- Pet status icon: "Has pets" / "No pets" (12px, ink-2)
- Party habit tag (if shared)
- Bio text
- "Chat" CTA button (primary) -> opens chat if matched, prompts match if not
- Back arrow to return to previous page

#### Page 23: `/settings` -- Settings (CSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Settings" (H1, centered)
- **Menu groups** (same pattern as Profile page):
  - **Account**: Edit Profile | Change Password | Privacy & Security
  - **App**: Notification Settings | Blocked Users
  - **Legal**: About | Terms & Conditions
  - **Logout**: Logout (error styling)

**Preferences sheet** (triggered by "Preferences" in settings or profile):
- Bottom sheet (mobile) / right drawer (desktop)
- **Theme**: SegmentedControl (Light / Dark / System)
- **Palette**: 3 color swatches (Default Terracotta, Ember, Monsoon Teal)
- **Language**: SegmentedControl (English / Hindi)
- **Privacy toggles**: Hide last name (switch), Hide exact location (switch)

#### Page 24: `/notifications` -- Notification Center (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Notifications" (H1, left) + "Mark all read" icon button (top-right, checkmark)
- **Filter tabs**: SegmentedControl (All / Unread)
- **Notification list**: Vertical list of NotificationCards
  - Unread: accent left border + accent dot
  - Tap: mark as read + navigate (route field determines destination)
- **Empty state**: "All caught up" illustration

#### Page 25: `/saved-searches` -- Saved Searches (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Saved Searches" (H1)
- **Search cards**: List of saved search cards
  - Each: Search name (H4) + filter summary (Caption, ink-3) + created date
  - Actions: Re-run (primary compact) | Edit (tertiary) | Delete (tertiary, error text)
  - Alert toggle: Switch (on/off) + frequency badge (instant/daily/weekly)
- **Empty state**: "No saved searches" + "Search listings" CTA

#### Page 26: `/alerts` -- Search Alerts (SSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Search Alerts" (H1) + "Create Alert" button (primary)
- **Alert cards**: List of alert cards
  - Each: Alert name + frequency (pill) + channels (icon row: email/push/in-app) + filter summary
  - Actions: Edit (tertiary) | Delete (tertiary, error text)
  - Toggle: Switch (on/off)
- **Empty state**: "No alerts set up" + "Create Alert" CTA

#### Page 30: `/post/review` -- Listing Under Review (CSR)

**Template**: AuthenticatedPage

**Layout**:
- **Status card**: Large centered card (max-width 480px)
  - Status icon: hourglass (pending) / check-circle (approved) / x-circle (rejected)
  - Title: "Under Review" / "Approved!" / "Listing Rejected" (H2, Fraunces)
  - Body: Status-specific explanation text
- **3-step progress indicator**: Submitted -> Under Review -> Published
  - Current step highlighted in accent, future steps in ink-4
- **"What happens next" section**: Numbered steps explaining review process (12px, ink-2)
- **Action**: "Edit Listing" button (primary, for rejected listings) -> navigates to `/post?id={id}`
- **CTA**: "Back to Dashboard" (tertiary) -> navigates to `/manage`

#### Page 31: `/settings/blocked-users` -- Blocked Users (CSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Blocked Users" (H1) + back arrow
- **Blocked user list**: Vertical list of blocked user rows
  - Each: Avatar (40px) + name + mode badge + "Unblock" button (tertiary, error text)
  - Tap "Unblock": Confirmation dialog -> removes from blocked list
- **Empty state**: "You haven't blocked anyone" illustration + text

#### Page 32: `/settings/notifications` -- Notification Settings (CSR)

**Template**: AuthenticatedPage

**Layout**:
- **Header**: "Notification Settings" (H1) + back arrow
- **Push notifications**: Toggle switch (master enable/disable)
- **Per-type preferences** (each with toggle switch):
  - New matches (default: on)
  - Messages (default: on)
  - Visit reminders (default: on)
  - Listing updates (default: on)
  - Promotional (default: off)
- **Quiet hours**: Time range picker (start - end), toggle to enable
  - Default: 10:00 PM - 8:00 AM
  - During quiet hours: notifications silenced

---

### 6.4 ADMIN PAGES

#### Page 27: `/admin/moderation/listings` -- Listing Review Queue (SSR)

**Template**: AdminPage (simple sidebar with moderation links)

**Layout**:
- **Header**: "Listing Review Queue" (H1) + count badge
- **Filter**: SegmentedControl (Pending / Approved / Rejected / All)
- **Queue list**: Vertical list of moderation cards
  - Each: Listing thumbnail (64px) + title + price + locality + submitted date + status badge
  - AI pre-screen badges: Pass/Fail for each check (photos, required fields, pricing, spam)
  - Actions: Approve (success) | Reject (error) | Request Edit (warning)
- **Bulk actions**: Select multiple + Approve All / Reject All

#### Page 28: `/admin/moderation/reports` -- Report Review Queue (SSR)

**Layout**:
- **Header**: "Report Review Queue" (H1) + count badge
- **Report cards**: List of report cards
  - Each: Reporter avatar + target avatar + report reason + timestamp + status
  - Actions: Dismiss (tertiary) | Warn (warning) | Suspend (error) | Escalate (accent)

#### Page 29: `/admin/moderation/prescreen/[id]` -- AI Pre-Screen (CSR)

**Layout**:
- **Listing preview**: Full listing details
- **AI check results**: Grid of check cards
  - Photo quality: Pass/Fail + details
  - Required fields: Pass/Fail + missing fields list
  - Pricing anomaly: Pass/Fail + comparison data
  - Spam detection: Pass/Fail + confidence score
- **Action**: "Approve" (success) | "Request Edit" (warning)

---

## 7. Modal, Dialog, and Bottom Sheet Catalog

### 7.1 Auth Wall Modal

**Trigger**: Unauthenticated user clicks "Contact" or "Like" on public pages
**Type**: Modal (480px)
**Contents**:
- "Sign in to continue" (H2)
- "Create an account or sign in to connect with flatmates" (Body Medium, ink-2)
- Phone OTP login form (same as `/login`)
- "Sign up" link
**Close**: X button, click backdrop, Escape

### 7.2 Match Celebration Modal

**Trigger**: Mutual match detected after swipe
**Type**: Full-screen modal overlay
**Contents**:
- Confetti animation (explosive blast, 2s duration)
- Gradient background (accent/20)
- Paired avatars (80px each) with heart icon between
- "It's a Match!" (H1, Fraunces)
- "[Name] also liked you!" (Body Medium, ink-2)
- Compatibility ring (56px) + percentage
- "Send a Message" (primary, full width) -> opens chat
- "Keep Swiping" (tertiary)
**Animation**: Scale 0.8 -> 1.0 (600ms ease-out-back) + confetti

### 7.3 Save Search Modal

**Trigger**: "Save this search" button on `/search` page
**Type**: Modal (480px)
**Contents**:
- "Save this Search" (H3)
- Search name: Input ("My Koramangala Search")
- Alert settings section:
  - Toggle: "Get alerts for new matches" (Switch)
  - Frequency: SegmentedControl (Instant / Daily / Weekly)
  - Channels: Checkbox group (Email / Push / In-App)
- "Save" (primary) + "Cancel" (tertiary)

### 7.4 Schedule Visit Modal

**Trigger**: Calendar icon in chat header or "Schedule Visit" button
**Type**: Bottom sheet (mobile) / right drawer (desktop, 400px)
**Contents**:
- Property card: MatchContextCard
- "Schedule Visit" (H2)
- Calendar: Date picker grid, 90-day range from today, past dates disabled
- Time slots: Choice chips (Morning 9-12 / Afternoon 12-5 / Evening 5-8)
- "Add a Note (Optional)": Textarea (max 200 chars, character count)
- Privacy note: Shield icon + "Your visit request will be shared with [Name]."
- "Send Request" (primary, full width, paper-plane icon)

### 7.5 Share Sheet

**Trigger**: Share button on listing detail
**Type**: Bottom sheet (mobile) / Modal (desktop)
**Contents**:
- "Share this Listing" (H3)
- Template selector: SegmentedControl (Standard / WhatsApp / Instagram)
- Preview card: Rendered share card image
- Share actions: "Copy Link" | "Share on WhatsApp" | "Share on Instagram" | "Download Image"
- QR code: 120px, centered (standard template only)

### 7.6 Report Dialog

**Trigger**: Report option in chat overflow menu
**Type**: Modal (480px)
**Contents**:
- "Report [Name]" (H3)
- Reason selection: Radio group (Inappropriate messages / Harassment / Spam / Fake profile / Other)
- Optional notes: Textarea
- "Submit Report" (error variant, primary)
- "Cancel" (tertiary)

### 7.7 Block/Unmatch Dialog

**Trigger**: Block/Unmatch option in chat overflow menu
**Type**: Modal (480px)
**Contents**:
- "Block [Name]?" or "Unmatch [Name]?" (H3)
- "You won't be able to message or see each other's profiles." (Body Medium, ink-2)
- "Block" / "Unmatch" (error variant, primary)
- "Cancel" (tertiary)

### 7.8 Cancel Visit Dialog

**Trigger**: Cancel button on VisitCard
**Type**: Modal (400px)
**Contents**:
- "Cancel this Visit?" (H3)
- "This will cancel your visit with [Name] on [date]." (Body Medium, ink-2)
- "Yes, Cancel" (error variant, primary)
- "Keep Visit" (tertiary)

### 7.9 Q&A Nudge Bottom Sheet

**Trigger**: Q&A nudge card in chat pre-message area
**Type**: Bottom sheet (mobile) / right drawer (desktop)
**Contents**:
- "Break the Ice" (H3)
- "Answer 3 quick questions to see if you're a match" (Body Medium, ink-2)
- 3 questions with text/scale inputs
- "Submit Answers" (primary) + "Maybe Later" (tertiary)

### 7.10 Emoji Picker

**Trigger**: Emoji button in chat input
**Type**: Bottom sheet (mobile) / small popup above input (desktop)
**Contents**:
- Emoji grid (8 columns), scrollable
- Category tabs at bottom
- Search bar at top
**Select**: Inserts emoji into chat input field

### 7.11 Preferences Sheet

**Trigger**: "Preferences" menu item in settings/profile
**Type**: Bottom sheet (mobile, 65% initial height) / right drawer (desktop, 400px)
**Contents**:
- **Theme**: SegmentedControl (Light / Dark / System)
- **Palette**: 3 color swatch circles (Default Terracotta, Ember, Monsoon Teal), selected with accent ring
- **Language**: SegmentedControl (English / Hindi)
- **Hide last name**: Toggle switch
- **Hide exact location**: Toggle switch
- "Done" (primary)

### 7.12 Budget Filter Dialog

**Trigger**: Budget chip on map filter bar
**Type**: Modal (400px)
**Contents**:
- "Budget Range" (H3)
- Range slider: ₹5,000 - ₹100,000, dual thumb
- Selected range display: "₹8,000 - ₹25,000"
- "Apply" (primary) + "Clear" (tertiary)

### 7.13 Boost Sheet

**Trigger**: "Boost" action on manage listing card
**Type**: Bottom sheet (mobile) / Modal (desktop, 480px)
**Contents**:
- "Boost Your Listing" (H3)
- "Get more visibility for your listing" (Body Medium, ink-2)
- Boost options: 3 cards
  - 24hr Boost (free, first time only)
  - 7-day Boost (premium, indicated)
  - 30-day Boost (premium, indicated)
- "Boost Now" (primary)

### 7.14 Stats Dialog

**Trigger**: "View Stats" on manage listing card
**Type**: Modal (600px, wide)
**Contents**:
- Listing title + image
- Stats grid (2x3): Views | Likes | Chats | Visits | Match % | Avg Response Time
- Trend chart: Views over 30 days (mini line chart)

### 7.15 Change Password Dialog

**Trigger**: "Change Password" in settings
**Type**: Full page (mobile) / Modal (desktop, 480px)
**Contents**:
- Lock icon (48px, accent-soft circle bg)
- New password: Input with eye toggle + rule checklist:
  - Min 8 chars (check/cross icon)
  - 1 uppercase (check/cross)
  - 1 number (check/cross)
  - 1 special char (check/cross)
- Confirm password: Input
- "Update Password" (primary) + "Cancel" (tertiary)

### 7.16 Location Picker Modal

**Trigger**: Location tap on Discover header or map filter
**Type**: Bottom sheet (mobile) / Modal (desktop, 480px)
**Contents**:
- Search bar: "Search location"
- "Use my current location" row
- Popular cities list
- Radius slider (1km - 20km) if applicable
- "Apply" (primary)

### 7.17 Cluster Sheet (Map)

**Trigger**: Cluster marker tap on map
**Type**: Bottom sheet (mobile, 50% initial) / right drawer (desktop, 400px)
**Contents**:
- "X listings in this area" (H4)
- List of FlatmatesListingMiniCards
- Each: thumbnail (56px) + title + price + locality + "View" CTA

### 7.18 Forgot Password Modal

**Trigger**: "Forgot Password?" link on `/login` Password tab
**Type**: Modal (480px)
**Contents**:
- "Reset Password" (H2, Fraunces)
- "Enter your phone number to receive a verification code" (Body Medium, ink-2)
- Phone input: +91 prefix + 10-digit field
- "Send Reset Code" (primary, full width)
- On code sent: OTP input (6 digit boxes, same style as login OTP)
- New password input: with eye toggle + rule checklist (min 8 chars, 1 uppercase, 1 number, 1 special)
- Confirm new password: Input
- "Reset Password" (primary, full width)
- "Back to Login" (tertiary)
**Close**: X button, click backdrop, Escape

### 7.19 Delete Account Modal

**Trigger**: "Delete Account" in Settings under Account group (error text styling)
**Type**: Modal (480px)
**Contents**:
- Warning icon (48px, error-soft circle bg)
- "Delete Your Account" (H2, Fraunces, error color)
- "This action is permanent and cannot be undone. All your data, matches, and listings will be permanently deleted." (Body Medium, ink-2)
- Confirmation input: "Type 'DELETE' to confirm" (Input, error border when focused)
- "Delete Account" (error variant, primary, disabled until "DELETE" typed exactly)
- "Cancel" (tertiary)
**Close**: X button, click backdrop, Escape

---

## 8. Responsive Behavior Matrix

### 8.1 Layout Strategy by Breakpoint

| Component | Mobile (<768px) | Tablet (768-1023px) | Desktop (1024-1439px) | Wide (>=1440px) |
|-----------|-----------------|---------------------|----------------------|-----------------|
| Navigation | Bottom nav (5 tabs) | Collapsed sidebar (64px icons) | Sidebar (240px) | Sidebar (280px) |
| Page content | Full width, 20px padding | Full width, 24px padding | Flex-1, 24px padding | Max-width 1200px, centered |
| Cards | Single column | 2-column grid | 2-3 column grid | 3-4 column grid |
| Search filters | Bottom sheet | Right drawer | Left sidebar (280px) | Left sidebar (280px) |
| Chat | Separate routes | Split view (280px + flex) | Split view (320px + flex) | Split view (320px + flex) |
| Swipe deck | Full screen, gesture | Centered 480px | Centered 480px | Centered 480px |
| Expanded profile | Full-screen overlay | Right drawer | Right drawer (400px) | Right drawer (480px) |
| Map | Full screen | Full screen | Full content area | Full content area |
| Modals | Full-screen bottom sheet | Centered modal | Centered modal (480px) | Centered modal (480px) |
| Dashboard metrics | 2x2 grid | 2x2 grid | 4-in-a-row | 4-in-a-row |
| Listing detail | Stacked (image -> content) | Stacked | Side-by-side (image 480px + content) | Side-by-side |
| Listing Builder | Full-width form | Centered 480px form, sidebar collapsed | Centered 640px form | Centered 640px form |
| Dashboard | Metric cards 2x2, chart below, table as stacked cards | Metric cards 2x2, chart below, table as stacked cards | Metric cards 4-in-a-row, chart + table side-by-side | Same as Desktop |
| Saved Searches | Full-width cards, stacked | Full-width cards, stacked | 2-column grid | 2-column grid |
| Alerts | Full-width cards, stacked | Full-width cards, stacked | 2-column grid | 2-column grid |

### 8.2 Touch vs Mouse Interactions

| Interaction | Touch (mobile/tablet) | Mouse (desktop) |
|-------------|----------------------|------------------|
| Card actions | Tap | Click + hover preview |
| Swipe deck | Swipe gesture + action bar buttons | Keyboard arrows + drag + action bar |
| Expanded profile | Tap card -> full overlay | Click card -> right drawer, Space key |
| Filters | Bottom sheet | Sidebar panel |
| Map pins | Tap for info | Hover for preview, click for full info |
| Context menus | Long-press (stretch) | Right-click (stretch) |
| Tooltips | Tap to reveal | Hover tooltip |
| Navigation | Bottom tab bar | Persistent sidebar |
| Chat | Separate screens | Split view |

### 8.3 Bottom Navigation (Mobile)

| Tab | Icon | Label | Room Poster | Co-Hunter / Open |
|-----|------|-------|-------------|-------------------|
| Home | home | Home | Yes | Yes |
| Tab 2 | add_home / map | Post / Explore | Post | Explore |
| Swipe | swap-horiz | Swipe | Yes | Yes |
| Chats | favorite | Likes & Chat | Yes | Yes |
| Profile | person | Profile | Yes | Yes |

**Frosted glass**: paper/88 bg + backdrop-blur 3px, 76px height.
**Active**: accent icon + label, accent/14 bg pill.
**Inactive**: ink-3 icon + label.

### 8.4 Desktop Sidebar Navigation

| Nav Item | Icon | Room Poster | Co-Hunter / Open |
|----------|------|-------------|-------------------|
| Home | home | Yes | Yes |
| Post & Manage | add-home | Yes | -- |
| Explore | map | -- | Yes |
| Swipe | swap-horiz | Yes | Yes |
| Likes | favorite | Yes | Yes |
| Chats | chat | Yes | Yes |
| Dashboard | bar-chart | Yes | -- |
| Profile | person | Yes | Yes |

**Collapsed state** (64px): Icons only with tooltip on hover.
**Expanded state** (240px/280px): Icons + labels.

---

## 9. Dark Mode Specifications

### 9.1 Global Token Overrides

All CSS custom properties swap via `[data-theme="dark"]` on `<html>`:

| Token | Light | Dark |
|-------|-------|------|
| --color-paper | `#F4F3EE` | `#1A1612` |
| --color-paper-2 | `#EDEBE3` | `#252018` |
| --color-paper-3 | `#E4E1D7` | `#342E28` |
| --color-paper-4 | `#D8D4C7` | `#3A3430` |
| --color-surface | `#FFFFFF` | `#2A2520` |
| --color-surface-elevated | -- | `#342E28` |
| --color-ink | `#1F1A14` | `#F4F3EE` |
| --color-ink-2 | `#4A463E` | `#E4E1D7` |
| --color-ink-3 | `#8A847A` | `#8A847A` (unchanged) |
| --color-ink-4 | `#B5AFA3` | `#6A645C` |
| --color-line | `rgba(31,26,20,0.08)` | `rgba(31,26,20,0.16)` |
| --color-accent | `#C96442` | `#C96442` (unchanged) |

### 9.2 Component-Specific Dark Mode

| Component | Dark Mode Adjustment |
|-----------|---------------------|
| Cards | surface bg (`#2A2520`), reduced shadow (xs only) |
| Card hover | shadow-sm, subtle accent glow |
| Bottom nav | surface-elevated bg, no top shadow |
| Sidebar | paper-2 bg (`#252018`) |
| Inputs | surface bg, ink text, line border at 0.16 |
| Modals/Drawers | surface bg, shadow-lg |
| Chat sent bubble | accent (unchanged) |
| Chat received bubble | surface-elevated bg |
| Skeleton shimmer | paper-2 -> surface-elevated -> paper-2 gradient |
| Categorical pastels | Each soft tier darkens 15-20% for contrast on dark bg |
| Gradient overlays | Increase opacity 10% for readability |
| Toast | surface-elevated bg, shadow-lg, ink text |
| Modal (standalone) | surface bg, shadow-lg |
| Drawer (standalone) | surface bg, shadow-lg |
| SegmentedControl | paper-2 bg, surface sliding pill, ink active text |
| VisitCard | surface bg, ink-2 text |
| MatchContextCard | surface bg, ink-2 text |
| NotificationCard | surface bg, ink-2 text, pastel icons at 80% opacity |
| OfflineBanner | surface-elevated bg, ink-2 text |

### 9.3 Theme Switching Mechanism

- `useUIStore` Zustand store holds: `theme` (light/dark/system), `palette` (default/ember/monsoon_teal)
- System preference: `window.matchMedia('(prefers-color-scheme: dark)')`
- Apply: Set `data-theme="dark"` on `<html>`, set `data-palette="ember"` etc.
- Persist: localStorage key `360-flatmates-theme`
- Transition: 200ms ease-out on all color properties (`transition: background-color 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out`)

---

## 10. Animation and Micro-Interaction Catalog

### 10.1 Page-Level Animations

| Animation | Trigger | Details |
|-----------|---------|---------|
| Page fade-in | Route change | Opacity 0 -> 1 (200ms ease-out) |
| Staggered card appear | Feed/list load | Fade-in + slide-up 16px (300ms ease-out, 50ms stagger per card) |
| Staggered menu group | Profile/Settings load | Fade-in + slide-up (200ms ease-out, 100ms delay between groups) |
| Hero section | Landing page load | Headline fade-in (400ms), subtitle fade-in (600ms), CTA fade-in (800ms) |

### 10.2 Component Animations

| Animation | Component | Trigger | Details |
|-----------|-----------|---------|---------|
| Press scale | Button, Card, MenuItem | pointerdown | scale 0.97, 150ms ease-out, returns on pointerup |
| Chip select spring | Chip | selection | scale 1.03, cubic-bezier(0.34,1.56,0.64,1), 150ms |
| Focus lift | SearchBar, Input | focus | scale 1.01, focus glow shadow, 150ms |
| Compatibility arc | ProgressRing | mount | stroke-dashoffset transition, 300ms ease-out |
| Skeleton shimmer | Skeleton | loading | gradient sweep, 1200ms linear infinite |
| Breathing pulse | EmptyState icon | visible | scale 1.0 -> 1.05, 2000ms linear infinite alternate |
| Segmented pill slide | SegmentedControl | tab change | translateX, 220ms ease-out |
| Card hover lift | ListingCard, ProfileGridCard | hover (desktop) | translateY -1px, shadow deepens, 150ms |
| Card press glow | Interactive Card | pressed | terracotta glow border + shadow, 150ms |
| FAB overshoot | Avatar edit FAB | appear | scale 0 -> 1.05 -> 1.0, 250ms ease-out-back |
| Match CTA bounce | ProfileGridCard | appear | scale 0.8 -> 1.0, ease-out-back |
| Swipe card fly-off | SwipeCard | swipe past threshold | translate off-screen + rotate, 200ms ease-out |
| Swipe card snap-back | SwipeCard | release below threshold | return to origin, 300ms ease-out |
| Directional tint | SwipeCard | drag | green/red overlay 0.12 alpha, proportional |
| Like/Nope overlay | SwipeCard | drag past threshold | Rotated label pill, fade in, proportional |
| Match confetti | MatchCelebration | match detected | Explosive blast, 2s, multi-color particles |
| Match scale | MatchCelebration | mount | scale 0.8 -> 1.0, 600ms ease-out-expo |
| Toast slide-in | Toast | triggered | slide up 20px + fade in, 200ms |
| Toast fade-out | Toast | auto-dismiss | fade out, 150ms |
| Modal scale | Modal | open | scale 0.95 -> 1.0 + fade in, 200ms |
| Drawer slide | Drawer | open | translate from off-screen, 280ms ease-out |
| Bottom sheet slide | BottomSheet | open | translate from bottom, 280ms ease-out |
| Expand/collapse | MatchContextCard | toggle | height transition, 250ms ease-out |
| Chevron rotate | MatchContextCard | expand | 0deg -> 90deg, 250ms |
| Carousel indicator | Image carousel | slide | width 7px -> 20px, 200ms |

### 10.3 Loading States

| State | Component | Animation |
|-------|-----------|-----------|
| Page loading (SSR) | Full page | Skeleton variant matching content type |
| Feed loading | FeedSection | Skeleton feed variant (3 cards) |
| Profile loading | Profile | Skeleton profile variant |
| Chat loading | ChatThread | Skeleton list variant |
| Button loading | Button | Spinner replaces text, bg 80% opacity |
| Image loading | NetworkImage | Blur-up placeholder, 200ms fade-in |
| Infinite scroll | Scroll bottom | Skeleton card appended, new items fade in |
| Optimistic message | ChatMessageBubble | Temp message with subtle pulse until confirmed |

**loading.tsx**: Each SSR route directory has a `loading.tsx` that renders the appropriate skeleton variant matching the page content structure:
- `/discover` → Feed skeleton (3 cards)
- `/discover/[id]` → Listing detail skeleton
- `/search` → Search results skeleton
- `/home` → Feed skeleton
- `/chats/[id]` → Chat skeleton (conversation list + message area)
- `/profile` → Profile skeleton
- `/manage` → Card list skeleton
- `/dashboard` → Metric cards + chart skeleton
- `/explore` → Map skeleton with filter bar

### 10.4 Empty States

| Context | Illustration | Message | CTA |
|---------|-------------|---------|-----|
| Empty swipe deck | No profiles illustration | "Check back later for new profiles" | "Explore Listings" |
| No conversations | No chats illustration | "No conversations yet" | "Browse Flatmates" |
| No notifications | Bell illustration | "All caught up!" | -- |
| No search results | Search illustration | "No listings match your filters" | "Clear Filters" |
| No saved searches | Bookmark illustration | "No saved searches yet" | "Search Listings" |
| No visits | Calendar illustration | "No visits scheduled" | "Start Chatting" |
| No likes | Heart illustration | "No likes yet" | "Browse Profiles" |
| No matches | Handshake illustration | "No matches yet. Keep swiping!" | "Start Swiping" |

All empty states: 200ms fade-in + slide-up entry, breathing icon animation (2s pulse).

### 10.5 Error States

| Context | Icon | Message | Action |
|---------|------|---------|--------|
| Network error | cloud-off | "Something went wrong" | "Try Again" button |
| Auth expired | lock | "Session expired" | "Sign In" button |
| 404 page | search | "Page not found" | "Go Home" button |
| API error | alert-triangle | Context-specific | "Retry" button |
| Form validation | alert-circle | Per-field error text | Highlight first error field |

All error states: 200ms fade-in + slide-up entry. Never display raw error messages.

---

## 11. Accessibility Per-Component Notes

### 11.1 ARIA Patterns

| Component | ARIA | Notes |
|-----------|------|-------|
| Swipe deck | `role="region"`, `aria-label="Profile cards. Use ArrowLeft to pass, ArrowRight to like, ArrowUp to super-like. Press Space to expand profile."`, `aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp Space"` | Arrow key instructions in screen reader |
| Chat thread | `role="log"`, `aria-live="polite"` | New messages announced |
| Filter chips group | `role="group"`, `aria-label="Filter by [name]"`, each chip `role="checkbox"`, `aria-checked` | |
| Modal/Drawer | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap | Escape closes |
| SegmentedControl | `role="tablist"`, segments `role="tab"`, panels `role="tabpanel"`, `aria-selected` | |
| Toast | `role="status"`, `aria-live="polite"` | Auto-announced |
| ProgressRing | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` | |
| Bottom nav | `<nav>`, `<a>` elements | |
| Sidebar nav | `<nav>`, `<a>` elements, `aria-current="page"` | |
| Swipe action buttons | `aria-label="Pass"`, `aria-label="Like"`, `aria-label="Super Like"` | |
| Image carousel | `role="region"`, `aria-label="Listing photos"`, `aria-roledescription="carousel"` | |
| Infinite scroll | `aria-label="Load more"`, sentinel observed | |

### 11.2 Focus Management

- **Route change**: Focus moves to page main content (`<main>`)
- **Modal open**: Focus moves to first focusable element inside modal
- **Modal close**: Focus returns to trigger element
- **Drawer open/close**: Same as modal
- **Tab navigation**: Logical tab order (top-bar -> sidebar -> content -> bottom-nav on mobile)
- **Focus visible**: 2px solid accent outline with 2px offset on all interactive elements
- **Focus trap**: In modals, drawers, bottom sheets -- Tab cycles within, Escape closes

### 11.3 Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| Tab / Shift+Tab | Global | Move focus between interactive elements |
| Enter / Space | Buttons, links | Activate |
| ArrowLeft / ArrowRight | Swipe deck | Pass / Like |
| ArrowUp | Swipe deck | Super Like |
| Space | Swipe deck | Expand card |
| Escape | Modal/Drawer/Overlay | Close |
| / | Any page | Focus search bar |
| Enter | Chat input | Send message |
| Shift+Enter | Chat input | New line |
| Arrow keys | MapExplorer (focused) | Pan map |
| +/- | MapExplorer (focused) | Zoom in/out |
| Tab | MapExplorer (focused) | Cycle between map markers |

**MapExplorer keyboard navigation**: Arrow keys pan map when map container focused. +/- zoom. Tab cycles between markers (info window opens on focus).

**FilterPanel announcements**: `aria-live="polite"` region announcing "X filters active" when filters change.

**Listing Carousel auto-pause**: Auto-advance pauses on hover and focus. Resumes on blur after 2s delay.

### 11.4 Color Contrast Verification

All text/background combinations must meet WCAG 2.1 AA:
- Normal text (< 18px): minimum 4.5:1 contrast ratio
- Large text (>= 18px or 14px bold): minimum 3:1 contrast ratio
- UI components: minimum 3:1 against adjacent colors

Verified pairs:
- ink on paper: 12.4:1 (pass)
- ink-2 on paper: 6.2:1 (pass)
- ink-3 on paper: 3.1:1 (pass for large text, fail for normal -- use only for large/decorative)
- white on accent: 4.7:1 (pass)
- ink on surface: 14.2:1 (pass)

### 11.5 Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Disable all scale transforms (press, chip select, focus lift)
- Disable confetti animation
- Disable breathing pulse
- Simplify page transitions to opacity-only (200ms)
- Disable card hover lift
- Disable swipe card rotation (use opacity only for direction indicator)
- Keep skeleton shimmer (functional, not decorative)
- Keep compatibility ring arc draw (functional information)

---

## 12. Verification Checklist

1. **Visual regression**: Compare each page against mobile DESIGN.md screenshots
2. **Responsive**: Test every page at 375px, 768px, 1280px, 1440px, 1920px
3. **Dark mode**: Toggle dark mode on every page, verify all tokens swap correctly
4. **Keyboard**: Navigate every page using only keyboard, verify focus indicators
5. **Screen reader**: Run VoiceOver/NVDA on critical flows (login, onboarding, swipe, chat)
6. **Animations**: Verify all animation durations match spec, test reduced motion
7. **Color contrast**: Run axe-core audit on all pages
8. **Touch targets**: Verify all interactive elements >= 44x44px
9. **Modal focus trap**: Tab through modals, verify no focus escapes
10. **Empty/error states**: Trigger every empty and error state, verify messaging and CTAs
11. **Loading states**: Verify skeleton patterns match content layout
12. **RTL prep**: While Hindi is LTR, verify no absolute positioning breaks if future RTL needed
13. **Enum consistency**: Every chip/choice group in UI maps to an OpenAPI enum value
14. **Page routes**: Every page spec matches a route in PRD Section 3
15. **API coverage**: Every user action has a corresponding OpenAPI endpoint
16. **Terminology**: Every user-facing term matches the glossary (listing=property, flatmate=profile, save=like, etc.)

---

## 13. Terminology Glossary

| User-Facing (UI) | API / Technical | OpenAPI Schema |
|------------------|-----------------|----------------|
| Listing | Property | Property, PropertyCreate |
| Flatmate | Profile | FlatmatesProfile |
| Save | Like (swipe action) | SwipeRequest.action=like |
| Mode | FlatmatesMode | room_poster, co_hunter, open_to_both |
| Society Type | society_type | gated, independent, co_living, pg |
| Room Type | sharing_type | private_room, shared_room, master_bedroom, entire_flat |
| Gender Preference | gender_preference | male, female, any |
| Listing Status | FlatmatesProfileStatus | draft, pending_review, active, paused, rejected |
| Moderation Status | property_status | pending_review, approved, rejected |
| Visit Type | VisitContext | property_tour, flatmate_meet |
| Non-Negotiable | non_negotiables | food_veg_only, no_smoking, etc. |
| Lifestyle Dimension | lifestyle | 6 dimensions in FlatmatesProfile |
