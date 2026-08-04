# Smarter Justice v1.7.15 Audit Report

Prepared: July 21, 2026

## Baseline

The exact v1.7.14 artifact was independently verified before changes: SHA-256 `81ed12a5a665da77d51f9cc78fa744f40482eaf0f436c2d0cc261f6b07485603`, exact size 2,395,653 bytes, 268 ZIP entries, 258 files, and 10 directories. CRC, root layout, duplicate, traversal, absolute-path, backslash, symlink, and forbidden-entry checks passed.

## Evidence-backed finding

The v1.7.14 directory offered materially improved search but no safe way to compare multiple public profiles or preserve the full search context when opening a profile. Users had to remember facts across pages, increasing friction and the risk of treating one isolated fact as a recommendation.

## Implemented correction

v1.7.15 adds a URL-based shortlist of up to three individual or firm profiles, a side-by-side comparison of documented public facts, a local plain-text export, clear controls, validated return-to-search links, responsive overflow, print treatment, and explicit neutrality language.

The comparison does not save to an account, use analytics, create an inquiry, rank profiles, verify credentials, conduct conflicts checks, or create a professional relationship.

## Deliberate no-change decisions

No new profile, official form, AI voice, price, subscription, paid service, inquiry workflow, booking workflow, radius claim, or professional-routing capability was added because the audit did not establish a responsible artifact-only basis to do so.

## Remaining limitations

Real-device and assistive-technology acceptance, radius/county search, broader official-source profile coverage, source re-verification, production database/email/payment/support evidence, legal review, and controlled deployment remain open.
