# Smarter Justice v1.7.16 Change Map

| Improvement | Problem solved | Principal files | Acceptance criteria | Tests |
|---|---|---|---|---|
| Unified Free Tools journey | Working free capabilities were scattered and difficult to understand as one journey. | `public/free-tools.html`, `public/index.html`, `public/styles.css`, `public/sitemap.xml`, `public/llms.txt` | Users can reach the starting path, device-only document tools, source-linked plan, and neutral professional directory from one truthful public page. | `tests/seo-performance-v1716.test.js`, `tests/public-ux.test.js`, customer-language tests |
| Capability truth | Public users needed clearer available/not-active boundaries. | `public/free-tools.html` | Available tools, device-only handling, no-save boundaries, and closed paid/upload/filing/routing/review gates are explicit. | SEO/performance and customer-language tests |
| Canonical and structured metadata | Indexable pages lacked explicit canonical URLs and the homepage lacked machine-readable identity metadata. | `public/*.html`, `public/professional.js`, `public/sitemap.xml`, `public/llms.txt` | Every indexable public HTML page has a canonical SmarterJustice.com URL; homepage and Free Tools structured data are truthful; private pages stay out of the sitemap. | `tests/seo-performance-v1716.test.js`, `tests/public-ux.test.js` |
| Safe public caching | Static assets had a short cache and HTML lacked a deliberate revalidation policy. | `server.js` | CSS, JavaScript, images, icons, and SVG assets receive one-day caching with stale-while-revalidate; HTML revalidates; APIs remain no-store. | `tests/seo-performance-v1716.test.js`, smoke tests |
| Protected-page indexing defense | Protected surfaces lacked a response-header robots safeguard. | `server.js`, `public/robots.txt` | Owner, staff, account, checkout-state, and readiness pages receive `X-Robots-Tag: noindex, nofollow, noarchive`; authentication remains required. | `tests/seo-performance-v1716.test.js`, security tests |

No profile, form, pricing, dependency, AI-provider, payment, upload, routing, booking, Human Review, or filing capability was activated.

## Deployment and environment version truth

- Problem: inherited deployment and environment examples named obsolete versions.
- Files: `DEPLOY_RENDER.md`, `.env.example`, `tests/release-governance-v1716.test.js`.
- Acceptance: current release, rollback, production truth, closed gates, and version labels are accurate.
- Result: passed targeted and full regression tests.
