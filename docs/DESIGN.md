# DESIGN.md — AIVERA Website UI Recreation

## 1. Project Objective

Recreate the provided website reference screenshot as closely as possible.

The screenshot is the **single source of truth for the visual design**. The goal is not to create a website inspired by the reference, but to reproduce its actual visual identity, layout, proportions, colors, spacing, typography, component structure, and visual effects.

The result should look like the same website, not a generic SaaS landing page.

Prioritize visual accuracy over creative interpretation.

## 2. Overall Design Direction

The website is a premium, futuristic AI-powered creative SaaS landing page.

Design characteristics:

- Dark, cinematic interface.
- Almost-black background.
- Deep navy and electric-blue ambient lighting.
- Glowing blue gradients behind important sections.
- Minimalist white typography.
- Subtle borders and dark glass-like surfaces.
- Large product screenshots as the primary visual elements.
- Carefully balanced whitespace.
- Premium technology-company aesthetic.

The website should feel sophisticated, modern, immersive, and polished.

Avoid:
- Generic purple AI gradients.
- Excessive glassmorphism.
- Bright white backgrounds.
- Colorful gradients unrelated to the reference.
- Excessive rounded cards.
- Unnecessary animations.
- Generic template-style SaaS sections.

## 3. Color System

Use the following approximate color palette:

| Element | Color |
|---|---|
| Main background | `#050608` |
| Secondary background | `#080B14` |
| Dark navy | `#07142F` |
| Deep blue | `#102A65` |
| Electric blue | `#245BFF` |
| Blue glow | `#164DFF` |
| Primary text | `#FFFFFF` |
| Secondary text | `#A1A8B8` |
| Muted text | `#70798C` |
| Card border | `#17294F` |

### Background treatment

The background is predominantly black, but it should never feel completely flat.

Use:
- Radial blue gradients.
- Subtle blue illumination behind product previews.
- Soft blurred light sources.
- Dark navy transitions between sections.
- Occasional blue horizontal light streaks.

Blue illumination should be concentrated around the hero, product demonstrations, testimonials, and final CTA.

Do not apply the same gradient uniformly to the entire page.

## 4. Typography

Use a modern sans-serif font such as Inter, Geist, or a similar contemporary geometric sans-serif.

Typography hierarchy:

### Hero heading
- Large, centered.
- White.
- Medium-to-bold weight.
- Tight line height.
- Approximately 48–60px on desktop.

### Section headings
- Center aligned.
- White.
- Medium weight.
- Approximately 30–38px on desktop.

### Card headings
- White.
- Approximately 16–20px.
- Semibold.

### Body text
- Muted gray.
- Approximately 12–15px.
- Comfortable line height.
- Restrained text width.

### Eyebrow labels
- Small uppercase text.
- Electric blue.
- Letter spacing.
- Centered above section headings.

Use responsive typography while preserving the original hierarchy.

## 5. Page Structure

Implement the landing page in the following exact section order.

### SECTION 1 — Navigation

Create a minimal horizontal navigation bar.

Layout:
- Brand logo on the left.
- Navigation links centered.
- Sign-in and primary CTA on the right.

Visual treatment:
- Transparent or very dark background.
- Small white typography.
- Minimal spacing.
- Compact blue CTA button.
- No prominent navigation container border.

Keep the navbar visually understated.

### SECTION 2 — Hero

This is the most important section.

The hero contains:

1. Small announcement or eyebrow label.
2. Large centered headline.
3. Short supporting description.
4. Two CTA buttons.
5. Large product-interface preview.

Headline:

"Write, Plan, and Design Your Brand in One Focused Workspace"

Design:
- Center everything horizontally.
- Use a large white heading.
- Constrain the heading width.
- Use a muted description beneath it.
- Primary CTA uses electric blue.
- Secondary CTA uses a dark transparent surface with a subtle border.

#### Product preview

Below the hero text, display a large screenshot-like representation of the actual product interface.

It should resemble a professional creative workspace:

- Dark application window.
- Top application toolbar.
- Left vertical navigation toolbar.
- Central dark canvas.
- Right properties/settings panel.
- Floating design nodes and connected workflow elements.
- Image and branding asset previews.
- Small blue action buttons.

The product preview should be the visual centerpiece of the hero.

Add a subtle blue glow behind the application window.

Do not replace this with a generic illustration or a random dashboard.

### SECTION 3 — Trusted By

Display a horizontal row of recognizable customer/company logos.

Requirements:
- Muted white or gray logos.
- Consistent logo height.
- Even horizontal spacing.
- Minimal visual prominence.
- Dark background.

Keep this section compact.

### SECTION 4 — Features

Eyebrow:

"THE PLATFORM"

Heading:

"Everything You Need to Create in One Place With AI"

Supporting description underneath.

Create a four-card feature layout arranged in a 2-column grid.

Feature cards:

1. Create Brands From Simple Prompts
2. Unlimited AI and Design Canvas
3. Style Templates Ready to Use
4. Build Brand Assets From Uploaded Files

Each card should contain:
- Small white heading.
- Short muted description.
- Large visual product demonstration.
- Dark navy surface.
- Thin blue-tinted border.
- Subtle blue ambient lighting.

The cards should not look like ordinary text-only feature cards.

Product screenshots and visual demonstrations should occupy most of the card's visual area.

Use varied visual compositions while maintaining consistent card styling.

### SECTION 5 — Workspace Showcase

Eyebrow:

"NEXT LEVEL"

Heading:

"One Workspace That Brings Everything Together"

Supporting description.

Below the heading, display a large, wide product screenshot.

The screenshot should show:
- Dark creative canvas.
- Central design asset.
- Top toolbar.
- Left navigation.
- Right settings panel.
- Small contextual editing controls.

Add a subtle blue glow around the screenshot.

#### Metrics row

Overlay or position a four-column metrics section beneath the workspace preview.

Metrics:

- 10K+
- 1M+
- 5X
- 500+

Each metric should feature:
- Large white number.
- Small muted explanatory label.
- Subtle vertical separators or individual dark gradient backgrounds.

Keep the metrics visually integrated with the workspace section.

### SECTION 6 — How It Works

Eyebrow:

"GET STARTED"

Heading:

"Build Brand Assets in Three Simple Steps"

Display three horizontally aligned cards.

Card 1:
"Start With Prompt or File"

Card 2:
"Let AI Build Your Brand"

Card 3:
"Refine and Export"

Each card includes:
- Number indicator.
- Short heading.
- Small description.
- Product-interface preview.

Styling:
- Dark navy cards.
- Thin blue borders.
- Consistent dimensions.
- Small corner radius.
- Minimal blue highlights.

### SECTION 7 — Testimonials

Eyebrow:

"CREATOR STORIES"

Heading:

"How Creators Use AIVERA to Build Brands Faster"

Display a testimonial carousel or testimonial showcase.

Visual direction:
- Large horizontal testimonial area.
- Blue ambient lighting.
- Dark translucent background.
- Centered featured testimonial.
- Profile avatar.
- Customer name and designation.
- Small carousel navigation indicators.

The section should feel spacious and cinematic.

Avoid generic white testimonial cards.

### SECTION 8 — Pricing

Eyebrow:

"CHOOSE YOUR PLAN"

Heading:

"Simple Pricing for AI-Powered Creative Work"

Supporting description.

Add a billing-period toggle.

Create three pricing cards:

**Free**
- Free plan.
- Basic features.
- Limited usage.
- Neutral dark card.

**Pro**
- Featured plan.
- Approximately $17/month.
- Blue-highlighted background.
- Prominent CTA.
- Stronger visual emphasis.
- Small recommended/popular badge.

**Team**
- Approximately $27/month.
- Team-oriented features.
- Neutral dark card.

Design requirements:
- Three-column desktop layout.
- Equal card heights.
- Center Pro card visually emphasized.
- Thin borders.
- Subtle gradients.
- Clear price hierarchy.
- Feature lists with small icons.
- Full-width CTA buttons.

The Pro card must be the visual focal point.

### SECTION 9 — Final CTA / Footer

Create a large cinematic final section.

Background:
- Deep navy.
- Large blue radial glow.
- Dark gradient fading toward the bottom.

Left side:
- Heading: "Create and Design Better Brands With AIVERA"
- Short supporting text.
- Two CTA buttons.

Right side:
- Multiple compact navigation link columns.

At the bottom, display an enormous decorative wordmark:

"AIVERA"

The typography should be extremely large, bold, and partially cropped by the viewport edges.

Use a subtle dark gray/blue treatment.

This oversized wordmark is an important part of the visual identity. Do not omit it.

## 6. Layout and Spacing

Desktop:
- Maximum content width approximately 1200–1400px.
- Centered page container.
- Consistent horizontal gutters.
- Generous vertical spacing between major sections.
- Product screenshots should occupy substantial width.
- Feature cards should use a balanced grid.

The page should feel like a long, carefully composed landing page rather than a collection of disconnected components.

Maintain the reference's visual rhythm:

Hero → Logos → Features → Workspace → Metrics → Steps → Testimonials → Pricing → Final CTA.

## 7. Component Styling

### Buttons
- Compact.
- Slightly rounded corners.
- Primary buttons use electric blue.
- Secondary buttons use dark surfaces and subtle borders.
- Avoid oversized pill-shaped buttons.

### Cards
- Almost-black or dark navy backgrounds.
- Thin blue-gray borders.
- Subtle shadows.
- Small-to-medium corner radius.
- Occasional blue ambient glow.

### Product previews
- Dark application windows.
- Realistic toolbars and panels.
- Thin interface borders.
- Small, precise UI controls.
- Detailed central canvas.

### Section transitions
Use changes in ambient lighting rather than obvious dividers.

## 8. Responsive Design

The desktop screenshot is the primary reference.

However, the implementation must also support smaller screens.

On tablet:
- Reduce horizontal padding.
- Adjust card widths.
- Preserve product preview proportions.

On mobile:
- Stack feature cards.
- Stack pricing cards.
- Collapse navigation into a mobile menu.
- Reduce heading sizes.
- Preserve centered hero alignment.
- Allow product previews to scale or scroll horizontally when necessary.
- Prevent horizontal page overflow.
- Preserve the dark cinematic atmosphere.

Do not simply shrink the desktop design. Reorganize layouts appropriately.

## 9. Implementation Requirements

Before implementing:

1. Inspect the existing project structure.
2. Identify the framework and styling system.
3. Reuse existing dependencies where possible.
4. Identify any available product screenshots, images, icons, and assets.
5. Use the provided reference screenshot throughout implementation.

Implementation principles:

- Use reusable components.
- Keep styling consistent.
- Use CSS gradients for ambient lighting.
- Use responsive CSS layouts.
- Avoid unnecessary dependencies.
- Use actual product screenshots when available.
- Never substitute unrelated stock imagery.
- Keep the implementation maintainable.

Suggested component structure:

- Navbar
- HeroSection
- TrustedBrands
- FeaturesSection
- WorkspaceShowcase
- MetricsSection
- HowItWorks
- TestimonialsSection
- PricingSection
- FinalCTA
- Footer

## 10. Visual Accuracy Rules

These requirements are especially important.

1. Match the reference screenshot's overall composition.
2. Preserve the black and deep-navy color identity.
3. Reproduce the blue ambient lighting.
4. Maintain the same section sequence.
5. Match the centered typography and heading hierarchy.
6. Give product previews substantial visual importance.
7. Keep cards dark and subtly outlined.
8. Preserve the generous vertical spacing.
9. Match the pricing section's three-card arrangement.
10. Recreate the oversized AIVERA footer typography.

Do not invent additional sections.

Do not redesign the reference.

Do not introduce unrelated colors, illustrations, or visual patterns.

## 11. Final Quality Check

After implementation, compare the rendered website against the supplied reference screenshot.

Check:

- Overall page composition.
- Section heights and spacing.
- Background colors.
- Gradient placement.
- Typography sizes.
- Card dimensions.
- Product preview proportions.
- Button placement.
- Pricing layout.
- Footer composition.

Make multiple refinement passes.

The final result should be visually as close to the supplied reference as possible.

**Final instruction: Treat the reference screenshot as a visual specification, not merely as inspiration. Every design decision should be justified by the screenshot. Prioritize pixel-level visual similarity over personal design preferences.**

---

## Flamme adaptation notes (applied on top of the spec above)

This spec was written against the AIVERA SaaS reference. Flamme is a non-commercial
NASA Space Apps prototype, so content (not visual system) is substituted:

- Hero product preview → per explicit follow-up instruction, the hero section itself
  uses a real NASA flame photo as a full-bleed background with a black gradient
  overlay, headline/CTAs on top (instead of a separate mockup window below the text).
  A compact floating preview card of the real Flame Lab UI still sits at the hero's
  lower edge to keep section 2's "product preview" requirement.
- "Trusted by" logos → NASA PSI / NTRS / Saffire / BASS-II / FLEX (the real source
  investigations), since there are no customer logos.
- Section 7 "Testimonials" → kept the exact carousel visual treatment, but the quotes
  are real excerpts from the dataset's source notes (data.js), captioned with the
  source file/row instead of a fabricated person — no invented testimonials.
- Section 8 "Pricing" → kept the exact 3-column/center-emphasized visual treatment,
  but content is the project's honesty guarantees (illustrative / deterministic /
  source-linked) instead of invented prices, since this tool isn't sold.
- Metrics row (10K+/1M+/5X/500+) → replaced with the dataset's real counts
  (investigations, experiment rows, controlled parameters, AI model calls = 0).
- Footer wordmark "AIVERA" → "FLAMME".

Everything else (color system, type scale, section order, card/button styling,
ambient blue lighting, spacing rhythm) follows the spec as written.
