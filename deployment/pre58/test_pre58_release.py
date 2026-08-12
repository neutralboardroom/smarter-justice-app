from pathlib import Path
import json, subprocess

repo = Path(__file__).resolve().parents[2]
package = json.loads((repo / 'package.json').read_text())
assert 'check-pre58-production-startup.js' in package['scripts']['start']
assert 'check-pre57-production-startup.js' not in package['scripts']['start']
pre57_overlay = (repo / 'scripts' / 'apply-pre57-profile-currentness-execution.js').read_text()
assert "require('./apply-pre58-ny-credential-reconciliation')" in pre57_overlay
startup = subprocess.run(['node', 'scripts/check-pre58-production-startup.js'], cwd=repo, text=True, capture_output=True)
assert startup.returncode == 0, startup.stdout + startup.stderr
status = json.loads(startup.stdout.strip().splitlines()[-1])
assert status['ok'] is True and status['release'] == 'v2.0.0-pre58'
assert status['newYorkMatches'] == 18 and status['newJerseyPending'] == 7
assert status['consequentialGates'] == 'CLOSED'
boundary = json.loads((repo / 'deployment' / 'pre58' / 'LIVE_STATE_AND_DEPLOYMENT_BOUNDARY__PRE58.json').read_text())
auth = json.loads((repo / 'deployment' / 'pre58' / 'OWNER_DEPLOYMENT_AUTHORIZATION__PRE58.json').read_text())
assert boundary['publishedToGitHub'] is False and boundary['deployedToRender'] is False and boundary['claimedLive'] is False
assert boundary['acceptedLiveBaseline']['release'] == 'v2.0.0-pre54'
assert auth['authorized'] is True and auth['providerMutationPerformed'] is False
serialization = json.loads((repo / 'deployment' / 'pre58' / 'RELEASE_SERIALIZATION__PRE58.json').read_text())
assert serialization['normalHandoffZipCount'] == 3 and len(serialization['requiredArtifacts']) == 3
print('PASS PRE58 release identity, production startup guard, owner authorization, three-ZIP serialization and truthful pre-deployment boundary')
