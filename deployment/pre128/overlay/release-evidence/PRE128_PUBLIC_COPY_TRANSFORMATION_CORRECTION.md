# PRE128 public-copy transformation correction

## Observation

- Observed: September 3, 2026 during live desktop visual QA
- Render deployment: `dep-dacpubfqj5pc738nv070`
- GitHub commit: `2e2be35f2d816bac0cd7a267ba0673c7748101eb`
- Visual boundary: homepage structure, styling, hierarchy, navigation, and interaction layout remained intact.

The public-language cleanup had used broad mechanical replacements. The phrase `source-linked` became `with original source links` even where an adjective was required, producing wording such as “build a with original source links action plan.” The unbounded phrase replacement for `review boundary` also matched the middle of “Preview boundary,” producing a corrupted heading.

## Correction

- inherited uses of `source-linked` now become the grammatically compatible adjective `source-backed`;
- authored phrases such as “information with original source links” remain unchanged where they are already natural;
- `responsible source` replacements use complete-word boundaries and preserve singular/plural meaning;
- `review boundary` changes only as a complete phrase and becomes `next review date`;
- the distinct heading “Preview boundary” becomes “Preview limits” deliberately;
- the article before “original source” is normalized when needed.

The same adjective-safe rule applies inside the public legal-area and legal-community API copy adapters.

## Regression requirements

- scan every public HTML, JavaScript, CSS, XML, JSON, text, and web-manifest file;
- reject the observed mechanical-wording patterns and substring corruption;
- retain the existing public release-identifier and retired-copy checks;
- re-run desktop and mobile visual QA on the homepage, Downtown Brooklyn community, professional preview, and membership page;
- do not change homepage visual geometry as part of this copy correction.

No account, provider, environment, Stripe, database, domain, DNS, profile, membership, or entitlement state is changed by this correction.
