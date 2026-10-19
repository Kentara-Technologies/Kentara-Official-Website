# Kentara Technologies — Expressive Cyan redesign

## Local review

- Branch: `design/expressive-cyan`
- Starting commit: `46d576c` (`main`)
- Changes are local and uncommitted. Nothing was pushed, merged or deployed.
- Current isolated preview: http://127.0.0.1:8767/index.html
- All earlier comparison and evergreen mockups remain in their original workspace directories.

The accompanying ZIP contains the four HTML pages and their existing assets, without Git metadata. Extract it and open `index.html`, or serve the extracted folder for a normal local preview:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open http://127.0.0.1:8767/. No installation or build is required. Google Fonts and the existing Tailwind CDN require internet; the semantic component stylesheet also provides the layout without Tailwind. System-font fallbacks are available.

## Repository audit

The original site contained four HTML pages, one shared custom stylesheet, one mobile-menu script, Tailwind via CDN, two logo assets and a founder portrait. No framework, dependency manifest, automated test suite or case-study assets were present.

Important existing functionality was the four-page navigation, active navigation indicators, project intake form links, mobile menu, WhatsApp, email and social links. The enquiry flow opens the existing Google Form; there is no local form backend.

The homepage repeated mission, benefits, capabilities, values, payment terms, process and founder copy in a long sequence. Services used lengthy descriptions, and the same dark colors and typography settings were repeated in each page. Mobile navigation did not explicitly manage focus.

## Changes

### Shared design system

- Mist Gray canvas, White elevated surfaces, Soft Silver sections, Graphite headings, Slate body text, Signature Cyan actions and Cyan Mist accents.
- Centralized tokens in `assets/css/styles.css`; `assets/js/tailwind-config.js` references the same CSS variables.
- Manrope headings at 600; Inter body, navigation and buttons. Desktop hero headings reach 72px; supporting sizes scale down on mobile.
- Approximately 1160px content width, an 8px spacing rhythm, 104–120px desktop section spacing, 64–72px mobile section spacing and 16px surface radii.
- Subtle 180–300ms interactions and reveals, with 220ms disclosure content animation and reduced-motion support.
- Small cyan links on Soft Silver use the deeper interaction shade because Signature Cyan alone gives only 4.34:1 contrast on that surface.
- Original official logo and founder image are unchanged. The gray logo is displayed at its native proportions, without recoloring or replacement.

### Homepage

- Leads with “Premium technology. Built around your business.” and a concise description.
- Two hero actions: the existing project form and Services.
- Native service accordions replace long service blocks.
- Four concise differentiators explain business-first development, premium experience, transparency and flexibility.
- A five-step Discover → Design → Build → Launch → Support overview.
- Short Kentara Flex introduction links to full terms on Start a Project.
- Repeated founder/story material is consolidated on About; R&D information is retained there.
- No selected-work section was invented: the repository has no project screenshots or case-study assets suitable for that showcase.

### About

- Editorial story and mission layout, concise values, actual founder information and original portrait/quote.
- Retains Kentara’s approach and proprietary-product direction.

### Services

- Native expandable core services with accurate descriptions and capability lists.
- Supporting capabilities use concise expandable entries.
- Service deep links open the matching disclosure on arrival.

### Start a Project

- A clear introduction and intake card linking to the unchanged Google Form.
- Original enquiry stages are retained: submission, review, discovery, proposal and build.
- Original Standard 30/40/30 terms and Flex 30/70 terms remain available, including eligibility and third-party cost limitations.
- Strategic-partnership information is retained in a disclosure.

### Accessibility and resilience

- Skip link, one h1 per page, labelled navigation and correct current-page indicators.
- Native details/summary controls preserve keyboard and expanded-state semantics.
- Native mobile dialog with explicit Tab/Shift+Tab wrap, Escape dismissal, focus restoration and background inertness.
- Progressive enhancement: content is visible without Intersection Observer; no-JavaScript navigation fallback is provided.
- Reduced-motion settings disable decorative motion and keep content visible.

## Validation completed

- All four pages loaded and were inspected in Chrome.
- Checked desktop/default 1920px, 1280px, tablet 768px, and mobile 390px/320px widths. No horizontal overflow or text-boundary overflow was detected in the inspected views.
- Confirmed headline weight 600 and the intended desktop/mobile scaling.
- Browser-tested mobile menu opening, modal state, focus cycling in both directions, Escape close, focus restoration and menu-link navigation.
- Browser-tested service disclosures with Enter/Space, a closed-service deep link, the payment-options link and the strategic-partnership disclosure.
- No JavaScript errors were observed in the browser logs checked.
- Reduced-motion initialization checked on all four pages with a DOM test harness; content stays visible.
- Checked local assets, local links and anchor destinations, unique IDs, current navigation, image alternatives and external-link `noopener` attributes.
- Compared metadata against `main`: title meaning, meta values and canonical links are preserved. Existing form/contact/social destinations remain present on each page.
- Confirmed original image assets, robots.txt, sitemap.xml and site.webmanifest are unchanged.
- JavaScript syntax checks and `git diff --check` pass.
- These checks are not a conformance certification. Full screen-reader testing, a cross-browser matrix and a complete WCAG audit were not performed. The externally hosted intake form is outside this implementation.

### Text contrast

| Pair | Ratio |
| --- | ---: |
| Slate on Mist Gray | 5.50:1 |
| Slate on White | 6.18:1 |
| Slate on Soft Silver | 5.00:1 |
| White on Signature Cyan CTA | 5.36:1 |
| Cyan on Mist Gray | 4.77:1 |
| Deeper small cyan text on Soft Silver | 5.75:1 |
| Graphite on Cyan Mist | 10.48:1 |

## Existing SEO issues requiring a separate decision

These were present in the source repository and have been preserved rather than silently changed:

1. Canonical URLs, sitemap.xml and robots.txt reference `kentara.tech`; Open Graph URLs and the active website references use `kentaratech.com`.
2. Open Graph image URLs point to `assets/images/og-image.jpg`, which is not present in the repository. About also uses a different hostname for that image reference.
3. The web manifest has empty name and short-name fields.

No domain, hosting or deployment settings were changed. Decide the canonical domain and approved sharing image before a future release.
