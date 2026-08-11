from pathlib import Path
import os
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
pub=root/'public'
required=['portals.html','attorney-partner-tour.html','attorney-partner-tour.js','attorney-call-tour.html','practice-areas.html','navigator.html']
for name in required:
    assert (pub/name).is_file(), name
portals=(pub/'portals.html').read_text()
tour=(pub/'attorney-partner-tour.html').read_text()
js=(pub/'attorney-partner-tour.js').read_text()
call=(pub/'attorney-call-tour.html').read_text()
for bad in ['Choose a focused justice portal','Portal directory','source intakes','legacy-domain cutovers','separate websites','micro-portal','NO_GO']:
    assert bad.lower() not in portals.lower(), ('portals',bad)
for bad in ['micro-portal','repository, deployment','portal eligibility','NO_GO','central professional system']:
    assert bad.lower() not in tour.lower(), ('tour',bad)
assert '/practice-areas.html' in portals
assert '69 areas' in portals
pre46='SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY'
assert ('Help prospective clients reach your firm better prepared.' in tour) or (pre46 in tour and 'better-prepared' in tour.lower())
for ident in ['tour-role','tour-portal','tour-profile','tour-tool','tour-dashboard','tour-membership','tour-continue','tourPortalStatus','tourMembershipBenefits','tourContinueProfile','copyTourLinkResult']:
    assert f'id="{ident}"' in tour, ident
assert 'human=' in js and 'practice area' in js
assert ('Meet better-prepared people' in call) or (pre46 in call and 'Growth' in call and 'Operations' in call and 'Compliance' in call)
practice=(pub/'practice-areas.html').read_text()
assert 'All 69 areas remain available' in practice or '69 areas remain available' in practice
nav=(pub/'navigator.html').read_text()
assert 'Navigator' in nav
print('PASS PRE45 public/professional alignment (including explicit successor copy)')
