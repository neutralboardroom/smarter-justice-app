# Roger's durable product-review rules

These rules apply to every Smarter Justice version, whether the release is primarily visual, functional, operational, data, security, or deployment work.

## Mandatory release review

Before production acceptance, inspect representative actual public and professional routes on desktop and phone. The review must cover:

- visual hierarchy, typography, spacing, color, imagery, cards, forms, and information density;
- global and local navigation, responsive behavior, keyboard/focus behavior, and accessibility;
- the public starting-help funnel, legal-area and community-resource discovery, professional discovery, and safety-first exits;
- the attorney and firm acquisition funnel, profile/claim path, professional workspace path, and membership or growth handoffs;
- calls to action, form comprehension, trust and privacy boundaries, misleading claims, dead ends, duplication, and unnecessary page length;
- consistency between public and professional surfaces while preserving their distinct audiences;
- preservation of federal/nationwide versus state/local legal-area distinctions and other accepted safety or publication boundaries.

## Evidence and decision standard

Record the routes, viewport classes, observations, defects, repairs, remaining limitations, and the reason for each material change or no-change decision. Automated source and regression tests support this review but do not replace actual rendered-page inspection.

Change the product only when the evidence supports a meaningful improvement in clarity, trust, accessibility, consistency, task completion, or funnel effectiveness. Do not redesign, rearrange, or restyle merely to create novelty or to claim visible work in a release.

## Production boundary

Candidate source may be code-qualified before public promotion, but it is not visually accepted until rendered candidate review is complete. After deployment, inspect the exact production release on representative desktop and phone routes. A material regression, broken funnel, misleading state, or inaccessible critical action fails acceptance and requires the established rollback path.
