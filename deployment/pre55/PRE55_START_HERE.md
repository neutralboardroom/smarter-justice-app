# Smarter Justice pre55 — start here

Pre55 is the single qualified successor to accepted-live pre54. Its primary material change is a protected, time-bounded Render API credential-rotation drill that verifies candidate access, retired-credential denial and final active access without writing credential material, hashes or authorization headers to source, logs or receipts.

The current deployment workflow no longer depends on a deploy-hook secret. Exact qualified commits are requested through the protected Render API and then verified by provider deploy ID, terminal status, exact commit identity and public release identity. Provider-side regeneration of any previously exposed hook remains recommended and manual.

The drill does not create, reveal, copy, revoke or replace a credential by itself. Those provider-account actions remain manual, production-environment protected and independently authorized. The verification window is at most 60 minutes and fails closed when expired.

Pre55 also removes the held legacy portals route from the runtime sitemap, adds current working acquisition and professional-value paths, and adds a protected currentness queue for the 25-professional/5-firm qualified directory baseline. It does not publish new profiles.

The public visual product is unchanged: the story-first experience, Navigator, attorney journey, responsive navigation, bilingual access and trust boundaries remain active. External consequential actions and automatic overage billing remain disabled. /growth-operations-compliance.html and /portals.html remain ordinary-public 404.
