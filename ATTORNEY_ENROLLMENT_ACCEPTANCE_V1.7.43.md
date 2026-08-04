# Attorney Enrollment Acceptance — v1.7.43

A pilot attorney must be able to scan a QR or open an allowlisted link, understand the value, find or create the correct profile, create one account, verify email, submit claim evidence, see pending review, apply for membership, pay only when billing is separately activated, and return to manage approved information.

Test this flow separately for `divorce-law-aid`, `estate-law-aid`, and `personal-injury-law-aid`. Verify narrow-phone layouts, autocomplete, password manager compatibility, focus, error summary, progress, saved return context, duplicate claim prevention, safe account recovery, firm invitation and seat state, payment/publication separation, and clear next steps.

Personal Injury copy must clearly include vehicle accidents and clearly state that workers’ compensation is a separate portal path.


## Founding Profile Pilot acceptance

- Invitation token is shown once and stored only as a hash.
- Only the verified invited email can redeem.
- Expiration, capacity, replay, and revocation behave safely.
- Complimentary access never changes paid membership, verification, portal eligibility, publication, ranking, or endorsement.
- Portal-first claim and central create contexts survive signup and return safely.
