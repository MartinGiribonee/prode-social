---
name: Premium World Cup Tournament Experience
colors:
  surface: '#0e1416'
  surface-dim: '#0e1416'
  surface-bright: '#333a3c'
  surface-container-lowest: '#080f11'
  surface-container-low: '#161d1f'
  surface-container: '#1a2123'
  surface-container-high: '#242b2d'
  surface-container-highest: '#2f3638'
  on-surface: '#dde4e6'
  on-surface-variant: '#e5bdbb'
  inverse-surface: '#dde4e6'
  inverse-on-surface: '#2b3234'
  outline: '#ac8887'
  outline-variant: '#5c3f3f'
  surface-tint: '#ffb3b1'
  primary: '#ffb3b1'
  on-primary: '#680011'
  primary-container: '#be0027'
  on-primary-container: '#ffcbc9'
  inverse-primary: '#bf0128'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca72f'
  on-tertiary-container: '#4e3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#0e1416'
  on-background: '#dde4e6'
  surface-variant: '#2f3638'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-padding: 20px
  gutter: 16px
---

## Brand & Style

This design system is engineered to elevate sports betting from a utility-driven task to a high-stakes, premium entertainment experience. The brand personality is authoritative, sophisticated, and exclusive, catering to a target audience that values professional-grade data visualization and a "VIP lounge" aesthetic. 

The visual direction combines **Modern Minimalism** with **Glassmorphism**. By utilizing a dark-mode foundation, we create a cinematic backdrop where crimson and gold elements signify action and achievement. The interface avoids the cluttered, "spreadsheet" feel of traditional betting apps, instead opting for a spacious, editorial layout that prioritizes legibility and atmospheric depth. The goal is to evoke the feeling of a high-end physical sportsbook, translated into a digital context.

## Colors

The palette is anchored by **Deep Crimson Red**, used strategically for primary actions, live status indicators, and branding elements to maintain high energy without causing visual fatigue. The foundation is a curated set of **Dark Charcoal and Slate** neutrals, which provide the necessary contrast for a professional dark-mode experience.

**Gold Accents** are reserved strictly for "Premium" moments: VIP tier badges, tournament trophies, first-place standings, and exclusive offers. This hierarchy ensures that gold feels earned rather than decorative. Backgrounds use a tiered neutral system (Surface 1-3) to create a sense of depth and containerization without the need for heavy borders.

## Typography

This design system utilizes **Inter** for its exceptional readability in data-heavy environments and its modern, neutral character. 

- **Headlines:** Use Bold and Extra Bold weights with tight letter spacing to create a powerful, "editorial" impact for tournament titles and major scores.
- **Data Sets:** Tabular numerals are mandatory for betting odds and scoreboards to ensure vertical alignment and quick scanning.
- **Labels:** Small, uppercase labels with increased tracking are used for secondary metadata (e.g., "MATCH TIME", "GROUP B") to maintain a structured hierarchy.
- **Hierarchy:** High contrast in weights (Regular vs. Bold) is preferred over excessive font size variation to keep the layout feeling compact and professional.

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous safe-area margins to ensure a spacious feel. A 12-column system is used for desktop/tablet, while mobile relies on a single-column stack with standardized 20px side margins.

Unlike traditional utility apps that cram data into every pixel, this system employs "Negative Space as a Feature." Vertical rhythm is maintained through a 4px baseline grid. Cards and sections are separated by large 24px-40px gaps to define clear content areas, preventing the visual "wall of text" common in sports apps. Data tables use an expanded row height (min 48px) to ensure touch targets are comfortable and readability is maximized.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Glassmorphism**, rather than traditional high-contrast shadows.

1.  **Base Layer:** Pure black (#0A0A0A) or very dark charcoal.
2.  **Surface Layer:** Dark slate surfaces with a subtle 1px inner border (opacity 10% white) to define edges.
3.  **Glassmorphism:** Overlays, such as sticky navigation bars or modal headers, use a 20px background blur with a 60% opacity fill of the surface color. This maintains context of the content underneath while adding a premium, tactile quality.
4.  **Shadows:** When used, shadows are "Ambient"—extremely diffused (20-40px blur), low opacity (15%), and tinted with the primary crimson red color to create a soft "glow" beneath active cards or live match indicators.

## Shapes

The shape language is characterized by "Sophisticated Softness." A base radius of **12px to 16px** (Rounded-LG to Rounded-XL) is applied to all primary containers, cards, and buttons. 

This rounding serves two purposes: it makes the interface feel modern and approachable, and it creates a distinct visual container that separates individual betting markets or tournament groups. Secondary elements like input fields and small tags use a smaller 8px radius to maintain a cohesive but hierarchical relationship with the larger containers.

## Components

- **Buttons:** Primary buttons are solid Crimson Red with white text. Secondary buttons are "Ghost" style with a 1px Slate border. "Premium" buttons (VIP actions) utilize a subtle gold-to-dark-gold gradient.
- **Tournament Cards:** Feature a background blur effect and a 1px semi-transparent stroke. When a match is "LIVE", the card gains a subtle crimson outer glow.
- **High-Contrast Tables:** Table headers are uppercase and muted. Alternating rows use subtle tonal shifts (#161616 vs #1C1C1E) rather than visible lines to reduce visual noise.
- **Chips & Tags:** Small, pill-shaped elements (8px radius) used for status (e.g., "HT", "FT", "VAR"). Live status tags pulse slowly to draw attention.
- **Input Fields:** Dark surfaces with a 1px border that shifts to Crimson Red on focus. Labels sit above the field in a bold, diminished font size.
- **VIP Tiers:** Components specific to loyalty tiers use a gold-tinted "frosted glass" effect with metallic iconography.
- **Scoreboards:** Large, high-weight numbers (Display-LG) with ample padding around the team flags/logos.