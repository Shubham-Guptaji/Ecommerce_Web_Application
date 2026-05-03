# Homepage Premium Editorial Refresh Design

## Goal

Refresh the storefront homepage so it creates a stronger recruiter-facing first impression while preserving the working ecommerce behavior. The homepage should feel premium, editorial, modern, and animated without making the shopping flow noisy or fragile.

## Scope

The refresh focuses on `src/app/(store)/page.tsx` and small homepage-only presentation helpers if extraction is useful. Product, category, checkout, payment, admin, auth, cart, wishlist, newsletter, and API behavior stay unchanged.

The current homepage data contract remains intact:

- Featured products come from `getFeaturedProducts()`.
- Categories come from `getCategories()`.
- Flash sale products come from `getFlashSaleProducts()`.
- New arrivals come from `getNewArrivals()`.
- Best sellers come from `getBestSellers()`.
- Newsletter submission continues through the existing `NewsletterForm`.

## Visual Direction

Use the approved Premium Editorial direction:

- Replace the current blue-purple hero with a deep navy editorial hero and warm gold accents.
- Add a layered product-collage style visual in the hero using existing product/category imagery when available, with graceful decorative fallbacks.
- Add proof chips in the hero that subtly signal real engineering depth, such as secure checkout, admin dashboard, and fast storefront.
- Convert trust badges into premium glass-style cards below the hero.
- Improve section headers with small labels, stronger copy, better spacing, and consistent calls to action.
- Keep product sections familiar but more curated through softer surfaces, richer backgrounds, hover lift, and restrained image motion.
- Keep the flash sale visually energetic but aligned with the premium palette rather than loud red/orange.

## Motion Direction

Animations should be tasteful and recruiter-friendly:

- Hero elements reveal with staggered `fade/slide` timing.
- Decorative hero shapes drift slowly.
- Product collage tiles float subtly.
- Trust cards and section blocks reveal on load through CSS delays.
- Product/category cards keep gentle hover lift and image scale.
- Motion must respect `prefers-reduced-motion` by disabling or minimizing continuous movement.

## Architecture

Keep the homepage as a Server Component so data fetching behavior stays stable. If the file becomes too large, extract pure presentational helpers in the same file or a homepage-specific component file without adding client state.

Recommended units:

- `SectionHeader`: shared label/title/description/action layout.
- `TrustCard`: one premium trust badge.
- `HeroProductCollage`: decorative hero visual derived from available products.
- `ProductRailSection`: repeated product section wrapper for featured, arrivals, and best sellers where practical.

Do not change shared product card behavior unless needed for safe visual consistency.

## Data And Error Handling

Existing fallback behavior remains:

- Empty categories show the existing empty message.
- Empty product sections show empty states or omit optional sections as they do now.
- Missing product/category images fall back to decorative placeholders.
- Database errors remain caught inside the existing fetch helpers.

The hero collage should tolerate empty product arrays and missing image URLs.

## Testing And Verification

After implementation:

- Run `npm.cmd run type-check`.
- Prefer `npm.cmd run build` if the environment allows it.
- Browser-check the homepage at desktop and mobile widths.
- Verify `/products`, product detail links, category links, flash sale links, and newsletter form remain reachable.
- Check that animations do not block rendering and reduced-motion CSS is present.

## Non-Goals

- No checkout, payment, cart, order, admin, or auth logic changes.
- No database schema changes.
- No dependency additions unless absolutely necessary.
- No redesign of every site page in this phase.
