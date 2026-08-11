from pathlib import Path
import os
R=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
P=R/'public'
app=(P/'app.js').read_text(errors='replace')
css=(P/'styles.css').read_text(errors='replace')
assert 'SMARTER_JUSTICE_PRE52_MOBILE_NAVIGATION' in app
assert 'SMARTER_JUSTICE_PRE52_MOBILE_NAVIGATION' in css
for phrase in ["b.textContent='Close'","event.key==='Escape'","document.body.classList.add('mobile-nav-open')","nav.addEventListener('click'","window.addEventListener('resize'"]:
    assert phrase in app, phrase
for phrase in ['.site-header .top-nav.open{display:flex!important','min-height:44px','max-height:calc(100vh - 90px)','z-index:110']:
    assert phrase in css, phrase
# Old separate-portal wording must not reappear through the shared JS renderer.
for bad in ['Recommended focused website','Open focused website','View all portals','Separate website not open yet','href="/portals.html"']:
    assert bad not in app, bad
# Main launch pages all expose a real toggle and a navigation region.
for name in ['index.html','attorney-call-tour.html','attorney-partner-tour.html','professionals.html','professional-membership.html','practice-areas.html']:
    text=(P/name).read_text(errors='replace')
    assert 'data-nav-toggle' in text, name
    assert 'data-nav' in text, name
print('PASS PRE52 mobile menu reliability and one-platform wording')
