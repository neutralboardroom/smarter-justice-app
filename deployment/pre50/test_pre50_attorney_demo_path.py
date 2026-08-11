from pathlib import Path
import os
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
pub=root/'public'
required=['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html','growth-operations-compliance.html','professional-growth.html','navigator.html']
for name in required: assert (pub/name).is_file(), name
text={n:(pub/n).read_text(errors='replace') for n in required}
for n in ['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html']:
    assert 'SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH' in text[n], n
assert '/attorney-partner-tour.html?mode=presenter&practice=divorce' in text['attorney-call-tour.html']
assert 'Start 7-step demonstration' in text['attorney-partner-tour.html']
assert 'Search My Profile' in text['professionals.html']
assert 'Create or Claim a Profile' in text['professionals.html']
assert 'Search for My Profile' in text['attorney-launch.html']
assert 'Return to Attorney Demonstration' in text['professional-membership.html']
assert 'One account across Smarter Justice legal areas' in text['professional-signup.html']
banned=['Temporary profile lookup','temporary noindexed lookup','Compatibility lookup','legacy lookup','focused legal portals','focused portal','focused micro-portal','micro-portal owns','initial four-portal network','View Initial Launch Portals','publication on a focused micro-portal']
combined='\n'.join(text[n] for n in ['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html'])
for bad in banned: assert bad.lower() not in combined.lower(), bad
assert 'value="annual"' not in text['professional-signup.html']
assert 'Monthly is the currently approved pilot cadence' in text['professional-signup.html']
assert 'Growth' in text['attorney-partner-tour.html'] and 'Marketing' in text['attorney-partner-tour.html']
assert 'SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE' in text['professional-growth.html']
assert 'SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS' in text['growth-operations-compliance.html']
assert 'Navigator' in text['navigator.html']
for bad in ['guaranteed clients','guaranteed leads','guaranteed revenue','guaranteed compliance']:
    assert bad not in combined.lower(), bad
print('PASS PRE50 coherent attorney demonstration and tour pathway')
