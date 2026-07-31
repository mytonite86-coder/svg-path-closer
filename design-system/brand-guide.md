# SVG Micro Eco Brand Guide

## Brand Structure

**Parent brand:** SVG Micro Eco
**Producer:** Kreepy Productions
**Product model:** Five browser-based CNC SVG repair tools sharing one visual system, account system, subscription, and support structure.

Each tool should feel like a different machine mounted inside the same industrial body.

---

## Core Brand Promise

SVG Micro Eco provides focused tools that repair specific SVG problems before files reach a CNC machine.

The tools should feel:

* Practical
* Industrial
* Precise
* Trustworthy
* Fast
* Built for real shop work

Avoid decorative technology language, excessive animation, cartoon styling, and vague AI claims.

---

## Shared Product Chassis

The following elements stay consistent across every SVG Micro Eco tool:

* Header and navigation
* SVG Micro Eco family mark
* Tool badge shape
* Page layout
* Upload area
* Scan dashboard
* Review workspace
* Status cards
* Buttons and form controls
* Pricing area
* Login and account controls
* Footer
* Mobile layout
* Support language
* Kreepy Productions attribution

The working repair engine must remain separate from the shared interface whenever practical.

---

## Tool-Specific Engine Swap

Each tool may replace only:

* Tool name
* Tool tagline
* Center badge symbol
* Accent color
* Upload instructions
* Scan categories
* Review controls
* Repair engine
* Validation language
* Tool-specific sales copy

Future tools should not require rebuilding the entire page structure.

---

## Badge System

The SVG Micro Eco family badge uses:

* Industrial hexagonal outer frame
* Dark steel or charcoal body
* Consistent border thickness
* Tool symbol in the center
* Tool name as the primary text
* SVG MICRO ECO as the secondary family text
* Small optional confirmation or status mark

The badge must remain readable at:

* Full landing-page size
* Header size
* Mobile size
* Favicon size
* Social preview size

The outer badge remains consistent. Only the tool name, center symbol, and accent color change.

---

## PathSeal Identity

**Name:** PathSeal

**Tagline:**
Find the break. Seal the path. Send the cut.

**Accent color:** Industrial orange

**Center symbol:**

* Broken SVG contour
* Two visible endpoint dots
* Orange dotted bridge between endpoints
* Small confirmation mark

PathSeal should communicate inspection, repair approval, and successful closure.

---

## Shared Color Foundation

The core SVG Micro Eco palette uses:

* Near-black page backgrounds
* Dark charcoal panels
* Steel-gray raised surfaces
* Silver and off-white text
* Muted gray secondary text
* One tool-specific accent color
* Green for successful validation
* Yellow for caution
* Red for errors or failed validation

Tool accent colors should identify the tool without replacing the shared dark industrial foundation.

---

## Typography

Use condensed, heavy typography for:

* Tool names
* Major headings
* Dashboard numbers
* Strong calls to action

Use a clean sans-serif typeface for:

* Instructions
* Descriptions
* Forms
* Navigation
* Pricing
* Account information

Use monospace typography only for:

* Measurements
* SVG data
* Path information
* Technical output
* Diagnostic information

---

## Interface Principles

1. The uploaded file and repair decision remain the focus.
2. The interface must clearly distinguish scan, review, repair, validation, and download.
3. Recommended repairs may begin selected.
4. Large or questionable repairs require deliberate approval.
5. The preview must show exactly what the user is approving.
6. Disabled actions must look clearly unavailable.
7. Errors must explain what happened without blaming the user.
8. Branding must never make the repair workflow harder to understand.
9. Shared styling must not alter repair calculations or SVG output.
10. Every major visual change requires a working checkpoint.

---

## Product Language

Preferred terms:

* Scan
* Open path
* Gap
* Recommended repair
* Manual review
* Repair selected
* Validation passed
* Clean SVG
* Download

Avoid:

* Magic
* Fully automatic
* Perfect repair
* Guaranteed cut
* AI-powered unless AI is genuinely involved
* Technical jargon that does not help the CNC user

---

## Subscription Structure

Free users may:

* Upload
* Scan
* Review
* Preview proposed repairs

Active subscribers may:

* Apply repairs
* Validate repaired files
* Download cleaned SVG files
* Access every SVG Micro Eco tool included in their subscription tier

All five tools should eventually share:

* One domain
* One backend
* One database
* One login
* One Stripe subscription
* One monitoring system
* One support address

Do not build a separate payment stack for each tool.

---

## Attribution

Use the following wording consistently:

**SVG Micro Eco**
Produced by **Kreepy Productions**

Kreepy Productions should appear as the producer, not as the primary product name.

---

## Implementation Rule

The shared design system should be reusable without copying large blocks of tool-specific CSS.

Preferred structure:

```text
design-system/
├── tokens.css
├── base.css
└── brand-guide.md
```

Tool-specific styling should override shared variables rather than rewriting the shared chassis.

Example:

```css
:root {
    --tool-accent: #ff7a00;
    --tool-accent-bright: #ff9b38;
    --tool-accent-dark: #b84e00;
}
```

---

## Current Build Rule

PathSeal is the first implementation of the SVG Micro Eco chassis.

Do not modify the functioning path-detection and repair engine while establishing the shared brand and interface system.
