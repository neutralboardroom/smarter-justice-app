from pathlib import Path
import os
root=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
server=(root/'server.js').read_text(errors='replace')
required=[
 'SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY',
 "pathName === '/api/release-identity'",
 "gitCommit:String(process.env.RENDER_GIT_COMMIT || '')",
 "demoHtmlCachePolicy:'NO_STORE'",
 "headers['CDN-Cache-Control'] = 'no-store'",
 "headers['X-Smarter-Justice-Release-Commit']",
 "'no-store, max-age=0, must-revalidate'"
]
for item in required: assert item in server, item
for page in ['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html']:
    assert page in server, page
pub=root/'public'
for page in ['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html']:
    text=(pub/page).read_text(errors='replace')
    assert 'SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH' in text, page
assert 'SMARTER_JUSTICE_PRE49_SOURCE_CURRENTNESS_GATE' in (pub/'professional-growth.html').read_text(errors='replace')
assert 'SMARTER_JUSTICE_PRE48_FIVE_JURISDICTIONS' in (pub/'growth-operations-compliance.html').read_text(errors='replace')
assert 'Navigator' in (pub/'navigator.html').read_text(errors='replace')
print('PASS PRE51 public-domain release identity and demo cache convergence guard')
