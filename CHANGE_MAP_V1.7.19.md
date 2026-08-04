# Smarter Justice v1.7.19 Change Map

| Workstream | Main files | Acceptance |
|---|---|---|
| Classic visual system | `public/styles.css` | White/near-white surfaces, restrained accents, reduced gradients/radii/shadows, clear controls, focus and reduced-motion safeguards |
| Brand assets | `public/logo.svg`, `public/favicon.svg`, `public/images/brand/*`, `public/site.webmanifest`, public HTML heads | Approved identity preserved; all asset paths resolve; no placeholder or third-party branding |
| Three-market profiles | `data/threeMarketProfileSeedsV1719.js`, `lib/professionalMarketplace.js`, `PROFILE_GROWTH_REPORT_V1.7.19.json` | 25 new individuals, 5 new firms, 25 links; 11/7/7 market split; no inferred verification or participation |
| Directory discovery | `public/professionals.html`, `public/professional.js`, `server.js` | Brooklyn, Manhattan, and Hudson County entry points; county/service-region search; neutral ordering |
| Owner accountability | `lib/professionalMarketplace.js`, `public/app.js` | Batch targets, actuals, market rotation, and boundaries visible in owner data |
| Governance/testing | package, manifest, release/readiness records, tests | 34-part suite, exact counts, current version and rollback truth |
| Protected redirect indexing | `server.js`, `tests/security-boundaries-v177.test.js` | Unauthenticated owner/staff redirects remain 302/no-store and now carry `X-Robots-Tag: noindex, nofollow, noarchive` |
