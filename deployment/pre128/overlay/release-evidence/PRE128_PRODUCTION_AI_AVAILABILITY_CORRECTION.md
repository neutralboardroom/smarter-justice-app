# PRE128 production AI availability truth correction

## Observation

- Observed: September 3, 2026 during live verification
- Render deployment: `dep-dacpo3f40ujc73er399g`
- GitHub commit: `f00814c7992ca9d6e036925fb8e2766c18a9cb9f`
- Public impact: the customer-safe AI status endpoints described optional AI assistance as available because configuration and feature controls were open, while the controlled synthetic service check returned a safe unavailable response.

No user matter information was used. The synthetic request contained fixed non-user test selections only. The rules-based starting-help path remained available.

## Root cause and boundary

The public availability calculation checked configuration readiness and feature-control state but did not require a successful live provider verification in the current process. The external provider failure category was not needed to establish this product truth defect and is not inferred here.

This was isolated to the optional AI-availability claim. It did not open paid membership, checkout, professional registration, matter browsing, automated outreach, or provider mutation.

## Correction

PRE128 now requires all three conditions before any customer-safe endpoint describes optional AI assistance as available:

1. configured gateway readiness;
2. a successful synthetic live verification in the current process; and
3. an open application feature-control state.

Until all three are true, the public response says optional AI assistance is temporarily unavailable and confirms that guided rules-based help remains available.

The public synthetic-check response is also reduced to availability, a plain-language message, and check time. It does not expose provider names, model names, keys, configuration flags, kill-switch state, or internal error categories.

## Verification requirements

- isolated and clean-clone qualification must report optional AI unavailable while no live provider verification exists;
- a failed production smoke must keep every customer-safe AI surface unavailable;
- the rules-based path must remain available;
- the public smoke response must contain no provider/model/configuration detail;
- no environment, credential, provider, Stripe, database, domain, or DNS setting may be changed by this correction.
