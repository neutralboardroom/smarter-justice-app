from pathlib import Path
import os,re
R=Path(os.environ.get('RUNTIME','.runtime/smarter-justice-v1.7.98'))
P=R/'public'
visible=['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html']
for name in visible:
    p=P/name
    assert p.is_file(), name
    text=p.read_text(errors='replace')
    assert 'SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH' in text, name
    assert 'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY' in text or name in ['professionals.html','attorney-launch.html','professional-signup.html'], name
combined='\n'.join((P/n).read_text(errors='replace') for n in visible)
# Clear, attorney-facing language only.
for bad in ['native-first','external-primary','suppression travels with the record','purpose-limited access','structured lifecycle','temporary profile lookup','compatibility lookup','legacy lookup','focused legal portal','focused micro-portal','micro-portal','full nationwide marketing-compliance automation','unrestricted outbound campaigns','AI front desk','automatic CRM migration']:
    assert bad.lower() not in combined.lower(), bad
for phrase in ['Help more of the right people find your firm','Be easier to find','Make follow-up easier','Market with guardrails','Know what brought the inquiry','Honor what the person asked for','Work alongside systems you already use','Why Smarter Justice is different']:
    assert phrase.lower() in combined.lower(), phrase
# One-platform model and current working differentiators remain visible.
for phrase in ['Smarter Justice legal areas','Navigator','professional profile','human review']:
    assert phrase.lower() in combined.lower(), phrase
# No stale portal links or unqualified future-platform story in the attorney demo.
quick=(P/'attorney-call-tour.html').read_text(errors='replace')
tour=(P/'attorney-partner-tour.html').read_text(errors='replace')
assert '/portals.html' not in quick+tour
assert '/growth-operations-compliance.html' not in quick+tour
# Desktop heading sizes are slightly reduced without changing mobile rules.
styles=(P/'styles.css').read_text(errors='replace')
assert 'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY' in styles
assert '@media(min-width:721px)' in styles
assert 'max-width:860px' in styles
# Runtime hides preserved-but-unqualified public story routes.
server=(R/'server.js').read_text(errors='replace')
assert "release:'v2.0.0-pre52'" in server
assert "demoPathRelease:'v2.0.0-pre52'" in server
assert 'SMARTER_JUSTICE_PRE52_PUBLICATION_GATE' in server
assert "'/growth-operations-compliance.html'" in server
assert "'/portals.html'" in server
print('PASS PRE52 attorney value clarity, visual polish, and public publication gate')
