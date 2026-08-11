from pathlib import Path
import os,re
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
pub=root/'public'
required=['growth-operations-compliance.html','attorney-call-tour.html','professional-growth.html','professional-growth.js','marketing-compliance-pre47-data.js','professional-membership.html','attorney-partner-tour.html','practice-areas.html','navigator.html']
for name in required: assert (pub/name).is_file(), name
page=(pub/'professional-growth.html').read_text()
js=(pub/'professional-growth.js').read_text()
data=(pub/'marketing-compliance-pre47-data.js').read_text()
membership=(pub/'professional-membership.html').read_text()
tour=(pub/'attorney-partner-tour.html').read_text()
assert 'SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH' in page
assert 'Jurisdiction-aware marketing compliance preflight' in page
assert 'does not approve publication' in page
assert 'PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL' in data
for token in ['NY-7.1-D-RESPONSIBLE','NY-7.3-LIVE-SOLICITATION','FL-OP-24-1-AI-DISCLOSURE','FL-4-7.19-FILING','TX-PART-VII-REVIEW','HUMAN_REVIEW_REQUIRED']:
    assert token in data, token
for domain in ['nycourts.gov','floridabar.org','texasbar.com']:
    assert domain in data, domain
for bad in ['XMLHttpRequest','WebSocket','sendBeacon']:
    assert bad not in js, bad
assert 'fetch(' not in js
assert "crypto.subtle.digest('SHA-256'" in js
assert 'draftIncluded:false' in js
assert 'SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH_CTA' in membership
assert '/professional-growth.html' in membership
assert 'SMARTER_JUSTICE_PRE47_GROWTH_LINK' in tour
practice=(pub/'practice-areas.html').read_text()
assert 'area' in practice.lower()
# The exact 69-area preservation invariant remains enforced by the immediately preceding pre45 acceptance test.
assert 'Navigator' in (pub/'navigator.html').read_text()
print('PASS PRE47 professional growth workspace and marketing preflight')

goc=(pub/'growth-operations-compliance.html').read_text(); quick=(pub/'attorney-call-tour.html').read_text()
assert 'SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY' in goc
assert 'SMARTER_JUSTICE_PRE47_WORKING_PREFLIGHT_LINK' in goc
assert 'SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY' in quick
