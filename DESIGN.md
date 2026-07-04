# MenuViz — Design System

> Modal's phosphor terminal, one notch quieter: near-black canvas, muted green-tinted type, and a single deep emerald signal instead of neon lime.

**Theme:** dark

MenuViz adopts Modal's design language almost exactly — void-black canvas, phosphor-pale green type scale, flat borderless components with hairline green-tinted borders, generous negative space, one accent element per viewport. The single deliberate departure: the vivid lime (#7fee64) is replaced everywhere by **Emerald Signal (#2f9e6e)**, a deeper, calmer green that reads premium B2B rather than neon. Where Modal's accent behaves like an LED, ours behaves like a jeweler's stone: saturated but not emissive. Everything else — surfaces, sage/moss text scale, radii, spacing, typography treatment — follows the Modal reference.

## Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Void Black | `#000000` | `--color-void-black` | Page canvas, hero background, deepest layer |
| Ground Iron | `#181818` | `--color-ground-iron` | Primary button fill, card surfaces, base UI surface |
| Carbon Veil | `#212525` | `--color-carbon-veil` | Elevated surfaces, nav background |
| Circuit Border | `#485346` | `--color-circuit-border` | Ghost-action border, primary interactive hairline |
| Slate Hairline | `#1f2a33` | `--color-slate-hairline` | Secondary hairline borders, band separators |
| Emerald Signal | `#2f9e6e` | `--color-emerald-signal` | **Primary accent** — logo mark, demo CTA pill, active tags, hero emphasis phrase, illustration base. Replaces Modal's #7fee64. Rationed: one fill per viewport. |
| Emerald Deep | `#1e7a52` | `--color-emerald-deep` | Accent hover/pressed state, gradient end stop |
| Ink On Emerald | `#08130c` | `--color-ink-on-emerald` | Text on emerald fills (never #000 or #181818 gray) |
| Phosphor White | `#ddffdc` | `--color-phosphor-white` | Headings, icon strokes, button text. Never body copy. |
| Mint Frost | `#def0dd` | `--color-mint-frost` | Light section canvas, soft highlight wash |
| Sage 60 | `#8cab87` | `--color-sage-60` | Body copy default on dark |
| Sage 40 | `#677d64` | `--color-sage-40` | Helper text, low-priority copy |
| Moss 70 | `#9cbf93` | `--color-moss-70` | Eyebrow labels, category tags |
| Moss 80 | `#aed2a4` | `--color-moss-80` | Lead paragraphs, hero subhead |
| Fern Link | `#859984` | `--color-fern-link` | Inline links, tertiary nav |
| Deep Fern | `#697368` | `--color-deep-fern` | Micro-copy, footer text, logo strips |
| Pine 15 | `#3e4a3c` | `--color-pine-15` | Low-emphasis interactive hairline |

Marketing gradient (hero visual, brand illustrations): `#3cb87e → #2f9e6e → #1e7a52`. Radial halo behind the hero visual: `rgba(47, 158, 110, 0.35)` fading to transparent — a soft bloom, not a neon glow.

**Contrast notes:** dark text (`#08130c`) on Emerald Signal ≈ 5.2:1 (AA at 16px/500). Emerald Signal as large display text on black ≈ 5.4:1 (AA large). Sage 60 body on black ≈ 8.6:1.

## Typography

- **Single family:** Google Sans Flex (variable, loaded from the Google Fonts CDN with full opsz/wght ranges) sets everything: display headings, card titles, UI chrome, and body. Hierarchy comes from size, weight (500 for headings and interactive elements, 400 for body), and `font-optical-sizing: auto`, not a second face. Tight negative tracking is signature: -0.448px at 64px, -0.336px at 42px, -0.022em base.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Face/Weight |
|------|------|-------------|----------------|-------------|
| caption | 12px | 1.33 | +0.6px | Google Sans Flex 500 |
| body-sm | 14px | 1.43 | -0.364px | Google Sans Flex 400/500 |
| body | 16px | 1.5 | -0.352px | Google Sans Flex 400 |
| subheading | 20px | 1.5 | -0.36px | Google Sans Flex 400 |
| heading-sm | 24px | 1.3 | -0.312px | Google Sans Flex 400 |
| heading | 30px | 1.2 | -0.36px | Google Sans Flex 400 |
| heading-lg | 42px | 1.05 | -0.336px | Google Sans Flex 500 |
| display | 64px | 1.0 | -0.448px | Google Sans Flex 500 |

Cap body line length at 65–75ch. Hero subhead max-width ~640px.

## Spacing & Shape

- Base unit 4px; scale: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 96, 128, 160.
- Density: comfortable. Section gap 80px, card padding 32px, element gap 20px. Page max-width 1280px.
- Radii: buttons 12px, cards/inputs 8px, pills 9999px (CTAs, tags, link chips only — never cards).
- Shadows: one only, on the nav bar (`rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.1) 0 4px 6px -4px`). Depth everywhere else via surface steps (#000000 → #181818 → #212525) and 1px #485346 hairlines.

## Components

- **Accent Pill Button (demo CTA):** 9999px radius, #2f9e6e fill, #08130c text + trailing animated ↗ arrow, 16px/500, compact padding (10px vertical, ~18px/14px horizontal): the text sits close to the pill edge, Modal-style. Hover: #1e7a52.
- **Morphing Nav CTA:** default state is emerald *text* plus a 24px emerald circle holding a dark ↗ arrow; on hover the circle scales out (~400ms ease-out-quart) to flood the whole pill, text flips to #08130c. This is the Modal nav Sign Up treatment.
- **Primary Filled Button:** #181818 fill, #ddffdc text and 1px border, 12px radius. "Engraved into the dark."
- **Ghost Outline Button:** transparent, 1px #ddffdc border, #ddffdc text, 9999px pill radius (matches the accent pill it pairs with).
- **Outlined Ghost Link:** transparent, 1px #485346 border at reduced opacity, 9999px radius, #859984 text, Google Sans Flex 14px/500.
- **Navigation Bar:** sticky, #212525 with 10px backdrop blur, 1px bottom border #1f2a33, ~64px tall, 24px horizontal padding. Logo left (emerald mark + "MenuViz" in Google Sans Flex 20px/500 #ddffdc), links center (Google Sans Flex 14px/500 #ddffdc), "Book a demo" accent pill right.
- **Hero:** full-bleed #000000, centered stack. Headline display/64 with the emphasis phrase in #2f9e6e, rest #ddffdc. Subhead 20px Google Sans Flex #aed2a4. CTA pair: accent pill ("Book a demo") + ghost outline. Signature visual below: a phone/device frame showing the diner-facing visualised menu (dish imagery grid), sitting in the soft emerald radial halo — this replaces Modal's 3D cube.
- **Feature Card:** 8px radius, #181818 or #1f2a33 surface, 32px padding, optional 1px #485346 border. Title Google Sans Flex 24px/400 #ddffdc, body Google Sans Flex 16px/400 #8cab87. Max 3 columns, 20–24px gap.
- **Eyebrow Label:** Google Sans Flex 12px/500 uppercase +0.6px, #9cbf93, 8–12px above its heading.
- **Tag/Chip:** 9999px, #2f9e6e fill for active/status, or transparent with #485346 border for neutral. Google Sans Flex 12px/500, 4px 12px padding.
- **Section Divider:** 1px #1f2a33 line at content max-width. Sparingly.
- **Device/Menu Mockup Card:** the MenuViz equivalent of Modal's code window — a rounded (12–16px) dark panel, 1px #485346 border, showing the diner-facing menu UI with real dish visuals. No shadow.
- **Micro-demos:** tiny looping simulations of the product (mini editor, QR stamp, mini phone, price-sync, load bar, text-to-photo, language swap, location ripple) that sit inside How-it-works columns and bento cards. Rules: decorative (`aria-hidden`), IntersectionObserver-gated (paused off-screen), frozen at a meaningful static frame under reduced motion, 4–7s cycles with long pauses, emerald used only as the "change just happened" signal (ticks, price pulse), no glow, ease-out-quart only.

## Layout

Full-bleed dark with 1280px containment. Hero is a centered stack (no split layout). Section rhythm: eyebrow → Google Sans Flex heading → muted body, then a 2-column text+visual band or a ≤3-column card grid. Alternate #000000 and #181818 bands; one light #def0dd section mid-page as a breath. Compact dark footer, links in muted green.

## Motion

300ms ease-out for all UI state changes; transition color, background-color, border-color, fill, and stroke together. Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` reserved for the hero visual only, never UI chrome. Long ambient loops (60–80s) allowed on the hero visual; must respect `prefers-reduced-motion`.

## Do's and Don'ts

**Do**
- Use #2f9e6e as a fill on exactly one element per viewport.
- Keep body copy on the sage scale (#8cab87 / #677d64); #ddffdc is for headings and button text only.
- Set headings in Google Sans Flex with the specified negative tracking; Google Sans Flex never sets display type.
- Two radius values define the geometry: 12px buttons, 8px cards. Pills only on CTAs/tags/chips.
- Show real dish imagery inside device/menu mockups — food visuals are the product.

**Don't**
- No neon or lime greens anywhere (#7fee64, #00ff00 class colors are banned). No glow filters, no text shadows, no scanlines.
- No raw #ffffff or pure #000-on-color text; use #ddffdc and #08130c.
- No blue, purple, or non-green chromatic accents. Dish photography is the only place other hues appear, contained inside mockup frames.
- No drop shadows on cards/buttons/content (nav bar is the single exception).
- No 9999px radius on cards or panels.
- No side-stripe borders, gradient text, or identical icon-card grids.
