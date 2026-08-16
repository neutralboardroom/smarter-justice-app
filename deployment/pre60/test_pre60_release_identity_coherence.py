from pathlib import Path
import json
import os
import selectors
import subprocess
import tempfile
import time
import urllib.request

repo = Path(__file__).resolve().parents[2]
runtime = Path(os.environ.get('RUNTIME', repo / '.runtime' / 'smarter-justice-v1.7.98'))
receipt = json.loads((repo / 'deployment/pre60/RELEASE_IDENTITY_COHERENCE__PRE60.json').read_text())
automation_boundaries = (repo / 'AGENTS.md').read_text(errors='replace')
durable_review_rules = (repo / 'deployment/ROGER_DURABLE_PRODUCT_REVIEW_RULES.md').read_text(errors='replace')

assert receipt['release'] == 'v2.0.0-pre60'
assert receipt['marker'] == 'SMARTER_JUSTICE_PRE60_RELEASE_IDENTITY_COHERENCE'
assert receipt['versionContract']['coreApplicationVersion'] == '1.7.98'
assert receipt['deploymentContract']['qualifiedExactCommitRequired'] is True
assert receipt['deploymentContract']['ordinaryZipTransferRequired'] is False
assert receipt['deploymentContract']['renderAutoDeployRemainsOff'] is True
assert receipt['scope']['ordinaryPublicContentChanged'] is True
assert all(value is False for key, value in receipt['scope'].items() if key != 'ordinaryPublicContentChanged')
assert receipt['noLoss'] is True
for required in [
    'Every new version must include an evidence-based visual',
    'customer-funnel review',
    'never change the interface merely to make a release look different',
    'Source tests alone are not visual acceptance',
]:
    assert required in automation_boundaries, required
for required in [
    "Roger's durable product-review rules",
    'Mandatory release review',
    'public starting-help funnel',
    'attorney and firm acquisition funnel',
    'Do not redesign, rearrange, or restyle merely to create novelty',
    'After deployment, inspect the exact production release',
]:
    assert required in durable_review_rules, required

server = (runtime / 'server.js').read_text(errors='replace')
readiness = (runtime / 'lib/serviceReadiness.js').read_text(errors='replace')
for marker in [
    "currentPlatformRelease:'v2.0.0-pre60'",
    "coreApplicationVersion:VERSION",
    "platformMarker:'SMARTER_JUSTICE_PRE60_RELEASE_IDENTITY_COHERENCE'",
]:
    assert marker in server, marker
assert "const APPLICATION_VERSION = require('../package.json').version;" in readiness
assert "version:APPLICATION_VERSION" in readiness
home = (runtime / 'public/index.html').read_text(errors='replace')
home_script = (runtime / 'public/home.js').read_text(errors='replace')
live_chat_script = (runtime / 'public/live-chat.js').read_text(errors='replace')
attorney_tour = (runtime / 'public/attorney-partner-tour.html').read_text(errors='replace')
practice_directory = (runtime / 'public/practice-areas.html').read_text(errors='replace')
community_resources = (runtime / 'public/community-resources.html').read_text(errors='replace')
practice_directory_script = (runtime / 'public/practice-directory-pre60.js').read_text(errors='replace')
community_resources_script = (runtime / 'public/community-resources-pre60.js').read_text(errors='replace')
styles = (runtime / 'public/styles.css').read_text(errors='replace')
assert 'SMARTER_JUSTICE_PRE60_SPECIALTY_START_COHERENCE' in home_script
assert "copyrights:'Copyright & copyright law'" in home_script
assert "launchQuery.get('practice')" in home_script
assert 'Start with ${label}. We’ll help you organize the right next step.' in home_script
assert 'id="professional-platform"' not in home
assert 'u-more">Explore family-law help →</div>' not in home
assert 'SMARTER_JUSTICE_PRE60_PUBLIC_EXPERIENCE_REPAIR' in home
assert 'h1{font-size:clamp(40px,4.7vw,62px);' in home
assert home.index('class="u-hero"') < home.index('class="navp-home-cta"')
assert 'SMARTER_JUSTICE_PRE60_HELP_FOOTER_COHERENCE' in live_chat_script
assert "document.querySelector('.site-footer, .u-footer')" in live_chat_script
assert 'SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_COMPLETION' in attorney_tour
assert 'Why Smarter Justice is different' not in attorney_tour
assert 'SMARTER_JUSTICE_PRE47_GROWTH_LINK' not in attorney_tour
assert 'SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_LAYOUT' in styles
assert '.cards.three{grid-template-columns:repeat(3,minmax(0,1fr))}' in styles
assert 'SMARTER_JUSTICE_PRE60_COHESIVE_VISUAL_SYSTEM' in styles
assert 'SMARTER_JUSTICE_PRE60_HOME_VISUAL_SYSTEM' in home
assert 'SMARTER_JUSTICE_PRE60_SINGLE_MOBILE_NAV' in home
assert '<button class="u-menu-toggle"' not in home
assert '<nav class="u-mobile-menu"' not in home
assert 'SMARTER_JUSTICE_PRE60_SEARCH_FIRST_DIRECTORY' in practice_directory
assert 'src="/practice-directory-pre60.js"' in practice_directory
assert 'What kind of help are you looking for?' in practice_directory
assert practice_directory.count('class="practice-card') == 69
assert practice_directory.count('class="practice-topics') == 69
assert practice_directory.count('class="tile"') == 8
assert 'SMARTER_JUSTICE_PRE60_PRACTICE_DIRECTORY_PROGRESSIVE_DISCLOSURE' in practice_directory_script
assert 'index<12' in practice_directory_script
assert 'SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE' in community_resources
assert 'src="/community-resources-pre60.js"' in community_resources
assert community_resources.count('class="community-need-card') == 21
assert community_resources.count('<details') == community_resources.count('</details>') == 2
assert 'pre60-community-close' in community_resources
assert 'Portfolio alignment' not in community_resources
assert 'Trusted community resource sheet' not in community_resources
assert 'SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE' in community_resources_script
assert 'index<9' in community_resources_script
for page in [practice_directory, community_resources, attorney_tour]:
    assert page.count('<header') == 1
    assert 'pre60-site-header' in page

checked = subprocess.run(
    ['node', 'scripts/check-pre60-release-identity-coherence.js'],
    cwd=repo,
    text=True,
    capture_output=True,
)
assert checked.returncode == 0, checked.stdout + checked.stderr
status = json.loads(checked.stdout.strip().splitlines()[-1])
assert status['ok'] is True
assert status['platformRelease'] == 'v2.0.0-pre60'

workflow = (repo / '.github/workflows/production-qualification.yml').read_text(errors='replace')
for required in [
    "vars.RENDER_DEPLOY_ENABLED == 'true'",
    'needs: [qualification-gate]',
    'commitId: $commitId',
    'https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys',
    '.gitCommit == $commit',
    '.currentPlatformRelease == "v2.0.0-pre60"',
]:
    assert required in workflow, required

env = os.environ.copy()
for key in list(env):
    if key.startswith(('DATABASE_', 'REDIS_', 'OBJECT_STORAGE_', 'AWS_', 'S3_')) or key in [
        'RENDER', 'DATABASE_URL', 'OWNER_CONTROL_CENTER_TOKEN', 'ADMIN_TOKEN',
        'PORTAL_RULES_API_TOKEN', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET'
    ]:
        env.pop(key, None)
env.pop('NODE_USE_ENV_PROXY', None)
env['NODE_ENV'] = 'test'
env['PORT'] = '0'
env['RENDER_GIT_COMMIT'] = 'a' * 40
env['RENDER_GIT_BRANCH'] = 'main'
env['RENDER_GIT_REPO_SLUG'] = 'neutralboardroom/smarter-justice-app'

with tempfile.TemporaryDirectory(prefix='sj-pre60-http-') as storage:
    env['SMARTER_JUSTICE_STORAGE_DIR'] = storage
    proc = subprocess.Popen(
        ['npm', '--prefix', str(runtime), 'start'],
        cwd=repo,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    selector = selectors.DefaultSelector()
    selector.register(proc.stdout, selectors.EVENT_READ)
    output, port = [], None
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline and port is None:
            if proc.poll() is not None:
                break
            for key, _ in selector.select(timeout=.25):
                line = key.fileobj.readline()
                if line:
                    output.append(line)
                    if 'Smarter Justice v1.7.98 listening on ' in line:
                        port = int(line.rsplit(' ', 1)[-1])
                        break
        assert port, ''.join(output[-100:])
        base = f'http://127.0.0.1:{port}'
        with urllib.request.urlopen(base + '/livez', timeout=10) as response:
            livez = json.loads(response.read())
        with urllib.request.urlopen(base + '/health', timeout=10) as response:
            health = json.loads(response.read())
        with urllib.request.urlopen(base + '/api/release-identity', timeout=10) as response:
            identity = json.loads(response.read())
        for route in [
            '/',
            '/practice-areas.html',
            '/community-resources.html',
            '/attorney-partner-tour.html',
            '/professionals.html',
            '/free-tools.html',
            '/navigator',
        ]:
            with urllib.request.urlopen(base + route, timeout=10) as response:
                assert response.status == 200, route
                assert len(response.read()) > 1000, route
        assert livez['version'] == '1.7.98'
        assert health['version'] == '1.7.98'
        assert identity['currentPlatformRelease'] == 'v2.0.0-pre60'
        assert identity['coreApplicationVersion'] == '1.7.98'
        assert identity['gitCommit'] == 'a' * 40
        assert identity['gitBranch'] == 'main'
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)

print('PASS PRE60 cohesive visual system, durable product-review rule, route smoke, coherent live version signals, and fail-closed exact-commit GitHub-to-Render release path')
