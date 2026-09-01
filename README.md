# Smarter Justice v2.0.0-pre126

Smarter Justice is a public legal-help platform and one connected network of hyperlocal legal communities.

The public experience remains task-first: a person can describe what happened, receive a free starting response without an account, use preparation tools, find local public resources, and independently search source-linked lawyer and law-firm profiles.

The professional experience now centers on legal-community membership. Public factual profiles remain free. Paid membership adds local legal intelligence, community participation, professional and firm presence tools, scheduling and follow-up workflows, and optional user-selected opportunities where active. Payment does not purchase credentials, verification, endorsement, organic rank, guaranteed clients, or an attorney-client relationship.

## First legal community

The initial community is **Downtown Brooklyn / Civic Center**, nested under Brooklyn / Kings County, New York City, and New York State. It includes:

- official court locations and current court-calendar items;
- independent public-help and legal-service organizations;
- source-linked professional activity;
- live local profile searches from the read-only Profile Factory snapshot;
- English and Spanish public routes;
- a share-ready local professional brief;
- a professional community home and durable geography preferences.

Downtown Brooklyn is also the founder-supplied birthplace of the Justice Truck idea, connected to Roger's operation of Rock and Hammer Tax Services, its mobile tax-truck offices, and the office at 26 Court Street. The release does not infer a date, institutional partnership, or endorsement from that account.

## Pricing and provider boundary

The existing prices are preserved:

- Professional: $10/month or $100/year;
- Team: $29/month or $290/year, up to 5 professionals;
- Office: $49/month or $490/year, up to 15 professionals;
- Enterprise / Network: custom.

This release makes no new Stripe product, price, coupon, payment-link, provider, secret, webhook, or environment-variable change.

## Reproducible build

```bash
npm ci --omit=dev --no-audit --no-fund
npm test
npm run deployment:validate
npm start
```

The compact bootstrap reconstructs exact PRE125 production, verifies the hash-pinned community overlay, checks every unchanged predecessor file, restores the tracked evidence dependencies required by the authenticated owner control center, replays the retained security regression suites, generates a deterministic SBOM, and creates the PRE126 completion and rollback receipts.

Immediate rollback source: Git commit `2e4b90c083c469bc0e055747258fc9521eed06b2` (PRE125).
