# Smarter Justice v1.7.17 Change Map

| Improvement | Problem solved | Principal files | Acceptance criteria | Tests |
|---|---|---|---|---|
| Device-only factual communication preparation | Users had no complete private path from exact document findings to an editable factual question or letter. | `public/document-tools.html`, `public/document-tools.js`, `public/styles.css`, `public/free-tools.html` | User reviews text, selects exact findings, enters only user-controlled facts and request, generates an editable draft and separate source appendix, downloads locally, and can clear the work. No network, persistence, AI, sending, routing, or professional relationship is created. | `tests/communication-prep-v1717.test.js`, customer-language and public-UX tests |
| Deep-link continuity | Free Tools linked to an action-plan anchor that did not exist. | `public/document-tools.html`, `public/free-tools.html` | Action-plan and communication-preparation deep links resolve to visible sections. | `tests/communication-prep-v1717.test.js`, `tests/public-ux.test.js` |

No profile, form, pricing, dependency, provider, payment, upload, routing, booking, Human Review, or filing capability was activated.
