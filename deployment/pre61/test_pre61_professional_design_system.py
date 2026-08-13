from pathlib import Path
from html.parser import HTMLParser
import json
import os
import selectors
import subprocess
import tempfile
import time
import urllib.request
import urllib.parse

repo = Path(__file__).resolve().parents[2]
runtime = Path(os.environ.get('RUNTIME', repo / '.runtime' / 'smarter-justice-v1.7.98'))
receipt = json.loads((repo / 'deployment/pre61/PROFESSIONAL_DESIGN_SYSTEM__PRE61.json').read_text())

assert receipt['release'] == 'v2.0.0-pre61'
assert receipt['marker'] == 'SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM'
assert receipt['renderedReview']['actualBrowserRenderingUsed'] is True
assert receipt['renderedReview']['desktopViewport'] == '1440x1000'
assert receipt['renderedReview']['phoneViewport'] == '390x844'
assert len(receipt['renderedReview']['routes']) == 4
assert receipt['preservation']['legalAreas'] == 69
assert receipt['preservation']['communityCategories'] == 21
assert receipt['preservation']['attorneyTourSteps'] == 7
assert receipt['preservation']['noLoss'] is True
assert receipt['deploymentContract']['productionMutationPerformed'] is False
assert receipt['navigationAndLinkAudit']['duplicateMobileMenusRemoved'] is True
assert receipt['navigationAndLinkAudit']['focusedMicroportalLinksRemoved'] is True
assert receipt['navigationAndLinkAudit']['officialCommunityProviderLinksPreserved'] is True

agents = (repo / 'AGENTS.md').read_text(errors='replace')
durable = (repo / 'deployment/ROGER_DURABLE_PRODUCT_REVIEW_RULES.md').read_text(errors='replace')
assert 'Every new version must include an evidence-based visual' in agents
assert 'never change the interface merely to make a release look different' in agents
assert 'Change the product only when the evidence supports a meaningful improvement' in durable
assert 'Automated source and regression tests support this review but do not replace actual rendered-page inspection.' in durable

checked = subprocess.run(
    ['node', 'scripts/check-pre61-professional-design-system.js'],
    cwd=repo,
    text=True,
    capture_output=True,
)
assert checked.returncode == 0, checked.stdout + checked.stderr
status = json.loads(checked.stdout.strip().splitlines()[-1])
assert status['ok'] is True
assert status['platformRelease'] == 'v2.0.0-pre61'
assert status['preserved']['legalAreas'] == 69
assert status['preserved']['communityCategories'] == 21
assert status['mobileNavigation'] == 'single-shared-controller'
assert status['microportalLinks'] == 'removed-from-central-platform'
assert status['moduleDestinations'] == 'central-routes-verified'

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()

    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return
        attributes = dict(attrs)
        href = attributes.get('href', '')
        if href.startswith('/'):
            self.links.add(href)

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
env['RENDER_GIT_COMMIT'] = 'b' * 40
env['RENDER_GIT_BRANCH'] = 'main'
env['RENDER_GIT_REPO_SLUG'] = 'neutralboardroom/smarter-justice-app'

with tempfile.TemporaryDirectory(prefix='sj-pre61-http-') as storage:
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
        route_bodies = {}
        for route in [
            '/',
            '/practice-areas.html',
            '/community-resources.html',
            '/attorney-partner-tour.html?practice=divorce',
            '/professionals.html',
            '/free-tools.html',
            '/navigator',
            '/family-law.html',
            '/injury.html',
            '/rights-defense.html',
            '/work-business.html',
            '/property-debt.html',
            '/estate-benefits-records.html',
        ]:
            with urllib.request.urlopen(base + route, timeout=10) as response:
                body = response.read()
                assert response.status == 200, route
                assert len(body) > 1000, route
                route_bodies[route] = body.decode('utf-8', errors='replace')

        # Verify every same-origin link exposed by the six main module funnels.
        module_routes = [
            '/family-law.html', '/injury.html', '/rights-defense.html',
            '/work-business.html', '/property-debt.html',
            '/estate-benefits-records.html',
        ]
        checked_links = set()
        for module_route in module_routes:
            parser = LinkParser()
            parser.feed(route_bodies[module_route])
            for href in parser.links:
                target = urllib.parse.urljoin(base + module_route, href)
                normalized = urllib.parse.urlsplit(target)._replace(fragment='').geturl()
                if normalized in checked_links:
                    continue
                checked_links.add(normalized)
                try:
                    with urllib.request.urlopen(normalized, timeout=10) as response:
                        assert response.status == 200, (module_route, href)
                        assert len(response.read()) > 100, (module_route, href)
                except Exception as error:
                    raise AssertionError((module_route, href, normalized, str(error))) from error
        assert len(checked_links) >= 20
        assert livez['version'] == '1.7.98'
        assert health['version'] == '1.7.98'
        assert identity['currentPlatformRelease'] == 'v2.0.0-pre61'
        assert identity['coreApplicationVersion'] == '1.7.98'
        assert identity['platformMarker'] == 'SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM'
        assert identity['gitCommit'] == 'b' * 40
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)

print('PASS PRE61 rendered professional design system, responsive disclosure, preserved funnels, route smoke, and release identity')
