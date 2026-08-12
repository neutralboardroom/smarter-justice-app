from pathlib import Path
import json, os, subprocess

repo = Path(__file__).resolve().parents[2]
runtime = Path(os.environ.get('RUNTIME', repo / '.runtime' / 'smarter-justice-v1.7.98'))
sitemap = (runtime / 'public' / 'sitemap.xml').read_text(errors='replace')
acquisition = json.loads((repo / 'deployment' / 'pre56' / 'ACQUISITION_ENROLLMENT_CONTINUITY__PRE56.json').read_text())
for route in acquisition['requiredWorkingSitemapPaths']:
    url = 'https://smarterjustice.com/' if route == '/' else 'https://smarterjustice.com' + route
    assert f'<loc>{url}</loc>' in sitemap, route
for route in acquisition['forbiddenSitemapPaths']:
    assert f'<loc>https://smarterjustice.com{route}</loc>' not in sitemap, route

for name in ['index.html', 'navigator.html', 'professionals.html', 'professional-growth.html', 'professional-membership.html', 'attorney-call-tour.html', 'attorney-partner-tour.html', 'referral-program.html', 'professional-signup.html', 'privacy.html']:
    text = (runtime / 'public' / name).read_text(errors='replace')
    assert '/private-measurement-pre56.js' in text, name
for name in ['measurement-privacy.html', 'private-measurement-pre56.js']:
    assert (runtime / 'public' / name).is_file(), name

queue = json.loads((repo / 'deployment' / 'pre56' / 'PROFILE_CURRENTNESS_WORK_QUEUE__PRE56.json').read_text())
assert queue['state'] == 'PROTECTED_QUEUE_CARRIED_FORWARD_NOT_PUBLICATION'
assert queue['qualifiedPublicDirectoryBaseline'] == {'professionals': 25, 'firms': 5}
assert queue['centralGraphContinuity'] == {'canonicalIdentities': 9484, 'professionalExtensions': 1299, 'firmRelationships': 7033}
assert queue['queue']['totalProtectedRechecks'] == 30
assert queue['newAcceptedProfessionalProfiles'] == 0 and queue['newAcceptedFirmProfiles'] == 0
assert queue['ordinaryPublicExposureChanged'] is False and queue['noLoss'] is True

review = json.loads((repo / 'deployment' / 'pre56' / 'UNIQUE_UX_UI_REVIEW__PRE56.json').read_text())
assert review['reviewState'] == 'PASS_PRESERVED_WITH_PURPOSEFUL_PRIVACY_CONTROL'
assert review['privacyChoiceUx']['default'] == 'OFF'
assert review['privacyChoiceUx']['noConsentWall'] is True and review['privacyChoiceUx']['noDarkPattern'] is True

checked = subprocess.run(['python3', str(repo / 'deployment' / 'pre54' / 'test_pre54_unique_ux_ui.py')], cwd=repo, env={**os.environ, 'RUNTIME': str(runtime)}, text=True, capture_output=True)
assert checked.returncode == 0, checked.stdout + checked.stderr
print(checked.stdout.strip())
print('PASS PRE56 working-only discovery continuity, purposeful nonblocking privacy choice, protected 30-record queue, zero unverified publication and unique UX/UI preservation')
