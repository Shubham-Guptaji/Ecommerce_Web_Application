# Homepage Premium Editorial Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the storefront homepage with a premium editorial visual system and tasteful animations while preserving existing ecommerce behavior.

**Architecture:** Keep `src/app/(store)/page.tsx` as a Server Component and add local presentational helpers in the same file. Reuse existing data fetch helpers, `ProductGrid`, `NewsletterForm`, `CountdownTimer`, and `Image`/`Link` behavior. Use CSS keyframes scoped through the page's existing inline `<style>` block, including `prefers-reduced-motion`.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS, shadcn/ui, lucide-react.

---

## File Structure

- Modify: `.gitignore`
  - Add `.superpowers/` so visual companion files stay out of git.
- Modify: `docs/superpowers/specs/2026-05-02-homepage-premium-editorial-design.md`
  - Captures the approved visual design and verification scope.
- Modify: `src/app/(store)/page.tsx`
  - Add homepage-only helper arrays and components: `SectionHeader`, `TrustCard`, `HeroProductCollage`, and `HomeProductCard`.
  - Replace hero, trust badges, product section wrappers, flash sale section, promo banner, why-choose-us, and newsletter presentation.
  - Keep fetch helpers and route links unchanged.

---

## Task 1: Add Homepage Presentation Helpers

**Files:**
- Modify: `src/app/(store)/page.tsx`

- [ ] **Step 1: Add any needed lucide icons**

Add premium/trust icons to the existing import from `lucide-react`.

- [ ] **Step 2: Add helper data and helper components above `HomePage`**

Add local helpers for section headers, trust cards, hero collage, and simple product cards so repeated homepage markup stays consistent.

- [ ] **Step 3: Keep helpers server-safe**

Do not add `use client`, hooks, event handlers, browser APIs, or new client state to `page.tsx`.

---

## Task 2: Refresh Hero And Trust Strip

**Files:**
- Modify: `src/app/(store)/page.tsx`

- [ ] **Step 1: Replace the existing hero section**

Use a deep navy/gold editorial hero with staggered text, two CTAs, proof chips, decorative gradients, and a product collage fed by existing product images.

- [ ] **Step 2: Replace the trust badge section**

Convert the current flat trust row into four glass-style cards with staggered animation classes and the same trust claims.

- [ ] **Step 3: Add reduced-motion CSS**

Add scoped keyframes and a `prefers-reduced-motion` block so continuous motion stops for users who request reduced motion.

---

## Task 3: Refresh Product Discovery Sections

**Files:**
- Modify: `src/app/(store)/page.tsx`

- [ ] **Step 1: Upgrade category section**

Keep category links and image fallbacks, but use premium section headers, richer cards, and smoother hover motion.

- [ ] **Step 2: Upgrade featured products**

Keep `ProductGrid products={featuredProducts}` and existing empty fallback while improving the section wrapper and heading.

- [ ] **Step 3: Upgrade flash sale**

Keep the flash-sale condition, countdown, product links, and prices. Re-skin the section with premium dark/gold styling instead of loud red/orange.

- [ ] **Step 4: Upgrade new arrivals and best sellers**

Keep product links, image display, ratings, discounts, and empty states. Improve wrappers, cards, and hover transitions.

---

## Task 4: Refresh Supporting Sections

**Files:**
- Modify: `src/app/(store)/page.tsx`

- [ ] **Step 1: Replace promo banner**

Turn the simple delivery banner into a premium scrolling or ribbon-style statement without changing routes or data.

- [ ] **Step 2: Upgrade why-choose-us**

Use premium cards with stronger visual hierarchy and subtle staggered reveals.

- [ ] **Step 3: Upgrade newsletter block**

Keep the existing `NewsletterForm`, but place it in a premium card/gradient section.

---

## Task 5: Verify

**Files:**
- Read: `package.json`
- Run against: full project

- [ ] **Step 1: Type-check**

Run: `npm.cmd run type-check`

Expected: TypeScript completes without errors.

- [ ] **Step 2: Build if environment allows**

Run: `npm.cmd run build`

Expected: Next.js build completes. If Windows sandbox hits a known `spawn EPERM` or environment issue, record that honestly and keep `type-check` as the baseline.

- [ ] **Step 3: Browser smoke check if dev server is available**

Run `npm.cmd run dev`, load `http://localhost:3000/`, and confirm the homepage renders, links remain present, no obvious console/runtime crash appears, and mobile width is usable. If the dev server cannot start in this environment, record the exact command output and reason.
