from pathlib import Path
import os
R=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
P=R/'public'
marker='SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY'
files=['growth-operations-compliance.html','attorney-partner-tour.html','attorney-call-tour.html','professional-membership.html','index.html']
for name in files:
    p=P/name
    assert p.is_file(), f'missing {name}'
    text=p.read_text(errors='replace')
    assert marker in text, f'missing pre46 marker in {name}'
platform=(P/'growth-operations-compliance.html').read_text()
for phrase in ['Grow your firm. Run it better. Market with guardrails.','Growth','Operations','Compliance','One story does not mean pretending everything is already live.','Full nationwide jurisdiction mapping for marketing compliance']:
    assert phrase in platform, phrase
for forbidden in ['guaranteed compliance','guarantees compliance','50-state compliant','all jurisdictions compliant','guaranteed leads']:
    assert forbidden.lower() not in platform.lower(), forbidden
home=(P/'index.html').read_text(); assert 'Growth, operations, and compliance' in home and '/growth-operations-compliance.html' in home
member=(P/'professional-membership.html').read_text(); assert 'More than membership' in member and 'Growth, operations, and compliance' in member
tour=(P/'attorney-partner-tour.html').read_text(); assert 'Growth + operations + compliance' in tour and 'jurisdiction-aware' in tour
quick=(P/'attorney-call-tour.html').read_text(); assert 'Growth, operations, and compliance—under one roof.' in quick
practice=(P/'practice-areas.html').read_text(errors='replace'); assert 'All 69 areas remain available' in practice
assert (P/'navigator.html').is_file() or (P/'navigator').is_file(), 'Navigator surface missing'
print('PASS PRE46 growth operations compliance story and no-regression acceptance')
