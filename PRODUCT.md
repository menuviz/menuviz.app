# Product

## Register

brand

## Users

Two buyer groups, addressed equally:

1. **Independent restaurant/cafe owners** — single location, non-technical, busy, price-sensitive. They land on this page from a Google search or a referral, skim on a phone between services, and need to understand in seconds what a "QR menu that visualises your food" means and why it beats a PDF menu.
2. **Small chains and restaurant groups** — multi-location operators and managers. They care about consistency across locations, updating menus at scale, and looking professional. More willing to book a call.

Both share the same job to be done: replace static/PDF/laminated menus with something that makes their food look appetizing and is effortless to keep current.

Secondary audience: the diners who scan the QR code are NOT the audience of this landing page, but the page must show what diners will see, since the diner-facing menu experience IS the product being sold.

## Product Purpose

MenuViz (menuviz.app) is a B2B SaaS: restaurants get a QR code that opens a web app visualising their menu — real photos/renders of dishes, not a wall of text. The landing page is a VERY simple single page whose only goal is conversion: get restaurant decision-makers to **book a demo**. Success = demo bookings. Everything on the page exists to (a) make the diner-facing menu experience instantly legible and desirable, and (b) get the visitor to the demo CTA.

## Brand Personality

Confident, precise, appetizing. The voice is that of a serious software company that happens to serve restaurants: calm technical authority (in the vein of Modal, Linear, Vercel) rather than hospitality-industry cheerfulness. No exclamation marks, no stock-photo warmth. The interface should feel like a professional tool that makes food look good — dark, quiet, with one emerald signal that draws the eye.

## Anti-references

- **Neon/lime greens.** Modal's #7fee64 vivid lime is explicitly out. The accent is a deeper emerald (#2f9e6e); nothing on the page should buzz or glow neon.
- **Restaurant-industry clichés**: chalkboard textures, script fonts, hero photos of smiling waiters, red-and-yellow food-app palettes (Uber Eats / DoorDash territory).
- **Generic SaaS template**: hero-metric blocks, identical three-icon card grids, gradient text, purple-blue AI gradients.
- **"Hacker movie" dark mode**: glow filters, scanlines, monospace-as-decoration. Dark should read as a high-end display, not a terminal cosplay.

## Design Principles

1. **Modal's system, MenuViz's volume.** Adopt the phosphor-terminal design language (near-black canvas, muted green-tinted type scale, rationed accent, hairline borders, flat surfaces) almost exactly, but with the vivid lime replaced by a calmer emerald. When in doubt, do what Modal does, one notch quieter.
2. **Ration the accent.** Emerald appears as a fill on at most one element per viewport: the demo CTA, the logo, or an active state. Everything else is the muted sage/moss scale on black.
3. **Show the product, not adjectives.** The strongest argument is the diner-facing menu itself: a visualised dish grid on a phone. Prefer showing that (mockup, embedded demo) over claims about it.
4. **One page, one action.** Every section funnels to "Book a demo". No competing CTAs, no nav sprawl, no pricing-page detours on v1.
5. **Comfortable density is non-negotiable.** Generous section gaps (80px+), 32px card padding, one glowing focal element per section. Cramped layouts break the system.

## Accessibility & Inclusion

- Target WCAG 2.1 AA. Body copy uses the muted sage scale on black (contrast well above 7:1); verify the emerald accent pill uses near-black text (#2f9e6e on #0a120c ≈ 5:1, passes AA at 16px/500).
- Respect `prefers-reduced-motion`: ambient/looping animations (hero visual rotation) must pause or degrade to static.
- Landing page must be fully usable on mobile — the independent-owner audience skims on phones.
- No information conveyed by color alone; the green-on-black system is effectively monochrome, which helps here.
