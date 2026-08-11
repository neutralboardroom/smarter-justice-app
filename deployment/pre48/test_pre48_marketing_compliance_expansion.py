from pathlib import Path
import os
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
pub=root/'public'
required=['growth-operations-compliance.html','professional-growth.html','professional-growth.js','professional-growth-pre48-addon.js','marketing-compliance-pre48-data.js','professional-membership.html','attorney-partner-tour.html','practice-areas.html','navigator.html']
for name in required: assert (pub/name).is_file(), name
page=(pub/'professional-growth.html').read_text(); js=(pub/'professional-growth.js').read_text(); addon=(pub/'professional-growth-pre48-addon.js').read_text(); data=(pub/'marketing-compliance-pre48-data.js').read_text(); goc=(pub/'growth-operations-compliance.html').read_text()
assert 'SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH' in page
assert 'SMARTER_JUSTICE_PRE48_COMPLIANCE_EXPANSION' in page
for option in ['value="NY"','value="FL"','value="TX"','value="CA"','value="NJ"']: assert option in page, option
for field in ['marketingDvRestrainingOrder','marketingCompetitorKeyword','marketingEndorserIdentified','marketingTestimonialPaid']: assert field in page, field
for token in ['NY-7.1-D-RESPONSIBLE','FL-OP-24-1-AI-DISCLOSURE','TX-PART-VII-REVIEW','CA-7.3-F-DVRO','CA-7.3-ADVERTISEMENT-LABEL','NJ-CAA-49-RESULTS-DISCLAIMER','NJ-CAA-49-NO-PAYMENT','NJ-ACPE-735-KEYWORD-DISCLAIMER','PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL']: assert token in data, token
for domain in ['nycourts.gov','floridabar.org','texasbar.com','calbar.ca.gov','njcourts.gov']: assert domain in data, domain
for bad in ['XMLHttpRequest','WebSocket','sendBeacon']:
    assert bad not in js and bad not in addon, bad
assert 'fetch(' not in js and 'fetch(' not in addon
assert "crypto.subtle.digest('SHA-256'" in js
assert 'draftIncluded:false' in js
assert 'sourceCheckedAt:rules.checkedAt' in addon
assert 'CA-7.3-F-DVRO' in addon and 'NJ-CAA-49-RESULTS-DISCLAIMER' in addon
assert 'SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS' in goc
assert 'New York, Florida, Texas, California, and New Jersey' in goc
assert 'SMARTER_JUSTICE_PRE47_WORKING_PREFLIGHT_LINK' in goc
assert 'Navigator' in (pub/'navigator.html').read_text()
combined='\n'.join([page,data,goc]).lower()
for bad in ['guaranteed compliance','50-state compliant','all jurisdictions compliant']: assert bad not in combined, bad
print('PASS PRE48 five-jurisdiction partial marketing compliance expansion')
