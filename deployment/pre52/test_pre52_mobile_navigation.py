from pathlib import Path
import os,re
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
# These launch-critical pages visibly present header navigation and therefore must expose a real mobile toggle and controlled nav region.
for name in ['index.html','attorney-call-tour.html','attorney-partner-tour.html','professionals.html','practice-areas.html']:
    text=(P/name).read_text(errors='replace')
    assert 'data-nav-toggle' in text, name
    assert 'data-nav' in text, name
# For any other page that actually renders a header navigation, require the same controller hooks. Do not invent a Menu on pages whose sealed-runtime header has no nav.
for name in ['professional-membership.html','professional-signup.html']:
    text=(P/name).read_text(errors='replace')
    m=re.search(r'<header\b[^>]*>[\s\S]*?</header>',text,re.I)
    if m and re.search(r'<nav\b',m.group(0),re.I):
        assert 'data-nav-toggle' in m.group(0), name
        assert 'data-nav' in m.group(0), name
# Membership must remain usable on a phone even if its generated header variant has no navigation menu.
membership=(P/'professional-membership.html').read_text(errors='replace')
for href in ['/professional-signup.html','/professionals.html','/professional-login.html']:
    assert href in membership, href
# Homepage is one Smarter Justice platform with in-house legal-area language, not separate micro-portal brands or routes.
home=(P/'index.html').read_text(errors='replace')
for bad in ['focused legal portal','focused micro-portal','Browse focused portals','Divorce Law Aid','Estate Law Aid','Personal Injury Law Aid','Domestic Violence Aid','href="/portals.html"']:
    assert bad.lower() not in home.lower(), bad
for good in ['Legal areas','Divorce & family','Injury & accidents','Criminal & civil rights','Work & business','Housing, property & debt','Estate, benefits & records']:
    assert good.lower() in home.lower(), good
print('PASS PRE52 mobile navigation, membership phone actions, and one-platform public wording')
