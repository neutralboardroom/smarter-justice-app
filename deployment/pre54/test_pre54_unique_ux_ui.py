from pathlib import Path
import json, os

repo=Path(__file__).resolve().parents[2]
runtime=Path(os.environ.get('RUNTIME',repo/'.runtime'/'smarter-justice-v1.7.98'))
home=(runtime/'public'/'index.html').read_text(errors='replace')
navigator=(runtime/'public'/'navigator.html').read_text(errors='replace')
attorney=((runtime/'public'/'attorney-call-tour.html').read_text(errors='replace')+'\n'+(runtime/'public'/'attorney-partner-tour.html').read_text(errors='replace'))
styles=(runtime/'public'/'styles.css').read_text(errors='replace')
app=(runtime/'public'/'app.js').read_text(errors='replace')

for marker in ['One connected starting point','Start with what happened','Tell us what happened','Find my starting point','Popular starting paths','Domestic Violence & Safety','Community Resource Aid','For attorneys and firms','Español','No account required to explore']:
    assert marker in home, marker
for marker in ['Navigator','Starting Point','Draft','Summarize','Checklist','Professional Workflow','Available to everyone','External actions confirmation-gated','does not create an attorney-client relationship']:
    assert marker in navigator, marker
for marker in ['help more of the right people find your firm','four things you can demonstrate on the live platform','why smarter justice is different']:
    assert marker.lower() in attorney.lower(), marker
for marker in ['--navy:#123d5f','--teal:#0f7d7a','--mint:#e9f7f4','--gold:#bd8b2f',':focus-visible','@media(max-width:720px)']:
    assert marker in styles, marker
for marker in ['data-nav-toggle','aria-expanded','u-mobile-menu']:
    assert marker in home, marker
assert 'SMARTER_JUSTICE_PRE52_MOBILE_NAVIGATION' in app
public=(home+navigator+attorney).lower()
for forbidden in ['guaranteed compliance','50-state compliant','all jurisdictions compliant','href="/portals.html"','href="/growth-operations-compliance.html"']:
    assert forbidden not in public, forbidden
review=json.loads((repo/'deployment'/'pre54'/'UNIQUE_UX_UI_REVIEW__PRE54.json').read_text())
assert review['reviewState']=='PASS_PRESERVED_AND_REGRESSION_GATED' and review['visibleChange']=='NONE_IN_THIS_DEPLOYMENT_CONTROL_RELEASE'
print('PASS PRE54 unique story-first UX, connected pathways, Navigator, attorney journey, visual identity, responsive access, language/trust, and working-only boundaries preserved')
