# Smarter Justice v1.7.98 Coordinated Site-Wide Visual Polish 1

This deployment candidate preserves the exact sealed Smarter Justice v1.7.98 source artifact and applies two fail-closed overlays during the Render build:

1. the previously qualified homepage launch polish; and
2. the coordinated site-wide visual polish based on the owner-supplied live screenshots.

## Exact baseline

- ZIP: `smarter-justice-v1.7.98-comprehensive-community-value.zip`
- Size: `12,891,048` bytes
- SHA-256: `0611f1082bf30244d5ec08a97ccc0de538b3248f19362466389feeb5bc672260`
- Internal application version: `1.7.98`

## Screenshot-driven corrections

- prevents the professional-signup guidance column from collapsing into letter-by-letter text
- gives the professional-signup layout a stable sidebar width and stacks it before it becomes cramped
- separates required agreements into readable bordered rows
- reduces oversized page and section headings without changing required inherited wording
- tightens excessive vertical space on the document-tools page
- balances the two device-only introductory notices
- stacks document comparison panels and form grids earlier on narrower screens
- standardizes card height, button wrapping, and form responsiveness
- protects normal words from `overflow-wrap:anywhere` behavior while retaining safe wrapping for code and long technical strings
- preserves floating Help and footer clearance

## Qualification

The modified exact source passed:

- the complete inherited `npm test` suite
- `tests/sitewide-visual-polish-v1798.test.js`
- an internal-link target audit across 95 public HTML pages with zero missing local targets

The Render postinstall process must also rerun:

- the exact-source bootstrap qualification
- the complete inherited suite after both overlays
- the homepage acceptance test
- the site-wide visual acceptance test

Any failed identity, extraction, overlay, syntax, inherited test, homepage test, or site-wide audit stops deployment before the service starts.
