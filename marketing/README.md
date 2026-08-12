# Seonbae — marketing website

Static marketing site for Seonbae, built with **Astro 5**. No server runtime, no
database, no framework beyond Astro. The whole site builds to plain HTML plus
about 77KB of CSS and JS.

```bash
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
npm run preview  # serve the built output
```

`dist/` is included in this handoff so the site can be opened without installing
anything. Deploy it to any static host (Netlify, Vercel, Cloudflare Pages, S3).

---

## Before this can go live

Four things are deliberately unfinished. They are product decisions, not bugs.

**1. Forms have no backend.** Every form (get matched, contact, become a tutor,
newsletter) runs through `src/lib/forms.ts`. Set `FORM_ENDPOINT` to a provider
URL (Formspree, Basin, Web3Forms, or our own API) and every form starts posting
JSON to it. Until then each form opens the visitor's mail client with all the
answers pre-written and addressed to `admissions@seonbaetutor.com`, so a lead is
never silently dropped. There is a honeypot field (`company`) for spam.

**2. No tutors are listed yet.** `src/content/tutors/` and
`src/content/testimonials/` are intentionally empty. `/tutors` and the homepage
render placeholder profile cards instead of invented people. Drop a markdown
file into `src/content/tutors/` matching the schema in `src/content.config.ts`
and the roster, curriculum filters, and counts switch on automatically.

**3. Korean is only partly done.** The language toggle works, but only the
homepage, `/become-a-tutor`, and `/login` have Korean strings. Every other page
is English-only. Copy lives in `src/i18n/home.ts`; the `<T>` component renders
both languages and CSS hides the inactive one.

**4. Legal pages are missing.** No terms, privacy policy, or business
registration number yet. All three are required to sell to consumers in Korea
(전자상거래법) and will also be needed for payment processor onboarding.

Also outstanding: one real hero photograph (`public/hero.jpg` is picked up
automatically if present), and real photography for the resources articles. The
founders photograph on `/about` is real and lives at `public/images/founders.jpg`
(1800x1200, 3:2, 342KB).

`npm run dev` binds to 4321 unless `PORT` is set, in which case it follows that.

---

## Where things live

| Path | What it is |
|---|---|
| `src/data/rates.ts` | **All 125 subject prices.** Single source of truth. Every price on the site derives from it. |
| `src/data/regions.ts` | Countries for the currency and timezone picker. Rates are approximate and hand-maintained; bump `RATES_UPDATED` when refreshed. |
| `src/content/` | Astro content collections: subjects, tutors, testimonials, resources, plans. |
| `src/i18n/home.ts` | Bilingual copy for the homepage and shared chrome. |
| `src/styles/global.css` | Design tokens, typography, and shared components. |
| `src/lib/forms.ts` | Form submission for the whole site. |
| `public/fonts/` | Self-hosted Hanken Grotesk (variable, 54KB). |

## Design system notes

- **Pricing is per subject, never per curriculum.** No page shows a single
  "from ₩X" for a whole curriculum. Rates run ₩60,000 to ₩120,000 across six
  price points.
- **Colour**: warm cream grounds, deep navy primary. Six pastel surfaces
  (`--p1`..`--p6`) and six stronger marker colours (`--b1`..`--b6`), one per
  curriculum. The `--violet*` token names hold navy for historical reasons.
- **Curriculum names** are circled with a hand-drawn SVG ring
  (`MarkedTitle.astro`), one path per curriculum.
- **Page heroes** hash their own pathname into one of five background shape
  arrangements so no two pages open on the same picture.
- **Scroll reveal** (`Base.astro`) measures on scroll rather than relying on
  IntersectionObserver alone, and sweeps everything visible after 3 seconds.
  Content can never stay hidden because an animation failed to fire.

## Accessibility

Contrast passes WCAG AA throughout (body text measures about 7:1). Heading order
is clean on every page. The tutor filter and the rate browser both announce
result counts to screen readers. Reduced motion is respected.
