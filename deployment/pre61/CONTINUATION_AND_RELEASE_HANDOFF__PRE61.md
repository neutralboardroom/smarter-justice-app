# Smarter Justice pre61 continuation and release handoff

## Candidate identity

- Platform release: `v2.0.0-pre61`
- Core application: `1.7.98`
- Repository: `neutralboardroom/smarter-justice-app`
- Candidate branch: `agent/pre61-professional-design-system`
- Production mutation performed: no

## Product result

Pre61 applies a restrained bright-white professional design system, repairs the
homepage Navigator layout, replaces platform-dependent emoji with stable numbered
markers, reduces phone directory density through progressive disclosure, and
flattens the longest professional-tour surfaces without removing capabilities.

It also removes duplicate legacy mobile menus, leaves one `/app.js` controller,
routes legacy focused-site actions back into Smarter Justice, removes legacy
micro-portal groups from the footer, and verifies every same-origin link exposed
by the six main module funnels. Official government, hotline, and community
provider links remain external because they are public-resource destinations,
not Smarter Justice micro-portals.

## Preserved scope

- 69 legal areas
- 21 community-resource categories
- 7 attorney-tour steps
- 6 homepage starting paths
- 0 routes intentionally removed
- 0 capabilities intentionally removed
- no database, environment, domain, Render-command, or provider mutation

## Qualification

From the exact candidate checkout with Node 22:

```text
npm ci --omit=dev --no-audit --no-fund
npm run qualify:pre61
npm start
```

Acceptance requires the workflow in `.github/workflows/production-qualification.yml`
to qualify the exact merge commit before any Render request. Pull requests do not
deploy. Render auto-deploy remains off.

## Post-deploy requirement

After an authorized exact-commit promotion, verify `/livez`, `/health`, and
`/api/release-identity`, then capture representative desktop and phone views for
the homepage, legal directory, community resources, professional tour, and at
least one main module. A material visual, navigation, funnel, or destination
regression fails production acceptance and uses the established rollback path.
