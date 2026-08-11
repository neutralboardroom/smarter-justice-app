from pathlib import Path
import os, json
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
pub=root/'public'
page=(pub/'professional-growth.html').read_text()
goc=(pub/'growth-operations-compliance.html').read_text()
server=(root/'server.js').read_text()
client=(pub/'professional-growth-pre49-currentness.js').read_text()
contract=json.loads(Path('deployment/pre49/CURRENTNESS_SOURCE_CONTRACT__PRE49.json').read_text())
for name in ['professional-growth.js','professional-growth-pre48-addon.js','marketing-compliance-pre48-data.js','professional-membership.html','attorney-partner-tour.html','practice-areas.html','navigator.html']:
    assert (pub/name).is_file(), name
for marker in ['SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH','SMARTER_JUSTICE_PRE48_COMPLIANCE_EXPANSION','SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE']:
    assert marker in page, marker
assert 'SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS' in goc
assert 'SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS' in goc
order=['/professional-growth.js','/professional-growth-pre49-currentness.js','/professional-growth-pre48-addon.js']
pos=[page.index(x) for x in order]
assert pos==sorted(pos), pos
for field in ['marketingCurrentnessSummary','marketingCurrentnessList','refreshMarketingCurrentness','downloadMarketingCurrentnessReceipt']:
    assert field in page, field
assert 'SMARTER_JUSTICE_PRE49_MARKETING_CURRENTNESS' in server
assert "pathName === '/api/marketing-compliance/currentness'" in server
assert 'draftOrClientDataTransmitted:false' in server
assert 'cacheTtlSeconds' in server and 'SOURCE_CHECK_TIMEOUT' in server
assert "fetch('/api/marketing-compliance/currentness'" in client
assert 'stopImmediatePropagation' in client and 'deterministicAllowed' in client
assert 'marketingDraft' not in client
assert 'draftOrClientDataIncluded:false' in client
assert contract['failClosed'] is True
assert contract['cacheTtlSeconds']==21600
assert set(contract['jurisdictions'])=={'NY','FL','TX','CA','NJ'}
allowed=('nycourts.gov','floridabar.org','texasbar.com','calbar.ca.gov','njcourts.gov')
for code,row in contract['jurisdictions'].items():
    assert row['sources'], code
    for src in row['sources']:
        assert src['url'].startswith('https://')
        assert any(domain in src['url'] for domain in allowed), src['url']
        assert src['markers'], src['id']
data=(pub/'marketing-compliance-pre48-data.js').read_text()
for token in ['NY-7.1-D-RESPONSIBLE','FL-OP-24-1-AI-DISCLOSURE','TX-PART-VII-REVIEW','CA-7.3-F-DVRO','NJ-CAA-49-RESULTS-DISCLAIMER','PARTIAL_PRIMARY_SOURCE_RULESET_NO_BLANKET_COMPLIANCE_APPROVAL']:
    assert token in data, token
assert 'Navigator' in (pub/'navigator.html').read_text()
combined='\n'.join([page,goc,client]).lower()
for bad in ['guaranteed compliance','50-state compliant','all jurisdictions compliant']:
    assert bad not in combined, bad
print('PASS PRE49 marketing rule source-currentness fail-closed gate')
