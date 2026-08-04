# Smarter Justice v1.7.76 Change Map

Source and rollback: exact `smarter-justice-v1.7.75.zip` (`8995ae6c794d5fa454eb5d62b41fd0a4290af853eac46b0400535de951fd5459`).

## Product/platform track

- Added a public device-only Journey Handoff Planner using fixed non-narrative choices.
- Added deterministic consent and integrity receipts with a 60-minute local expiry.
- Added local JSON and text downloads with no fetch, XHR, beacon, WebSocket, server save, analytics, or automatic destination opening.
- Advanced consent-based journey orchestration from D1 schema-only governance to a D2 usable local planner while keeping runtime transfer disabled.

## Builder/prompt-system track

- Added a deterministic V12 dual-track release gate.
- Added a continuous-improvement plan, dual-improvement report, and cross-version learning ledger.
- Added protected owner visibility for both the handoff planner and V12 continuous-improvement evidence.
- Added two dependency-independent tests, increasing the suite to 131 commands plus one separately gated PostgreSQL part.

No provider access, secret access, account save, cross-product transfer, deployment, production request, cohort freeze, or canary selection was opened. Launch remains `NO_GO`.
