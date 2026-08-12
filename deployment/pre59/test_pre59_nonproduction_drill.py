from pathlib import Path
import json, subprocess

repo = Path(__file__).resolve().parents[2]
receipt = json.loads((repo / 'deployment/pre59/NONPRODUCTION_ROLLBACK_CREDENTIAL_ROTATION_REHEARSAL__PRE59.json').read_text())
assert receipt['release'] == 'v2.0.0-pre59'
assert receipt['state'] == 'QUALIFIED_NONPRODUCTION_REHEARSAL_PROVIDER_UNCHANGED'
assert len(receipt['rehearsalSteps']) == 6
assert [step['sequence'] for step in receipt['rehearsalSteps']] == list(range(1, 7))
assert sum(step['result'] == 'PASS_EXPECTED_FAILURE_INJECTED' for step in receipt['rehearsalSteps']) == 1
assert all(value is False for value in receipt['consequentialActionGates'].values())
assert receipt['summary']['providerMutations'] == 0
assert receipt['summary']['credentialValues'] == 0
assert receipt['summary']['ordinaryPublicExposureChanged'] is False
assert receipt['noLoss'] is True
checked = subprocess.run(['node', 'scripts/check-pre59-nonproduction-drill.js'], cwd=repo, text=True, capture_output=True)
assert checked.returncode == 0, checked.stdout + checked.stderr
result = json.loads(checked.stdout)
assert result['ok'] is True and result['consequentialGates'] == 'CLOSED'
package = json.loads((repo / 'package.json').read_text())
assert 'check-pre59-nonproduction-drill.js' in package['scripts']['qualify:pre59']
assert 'test_pre59_nonproduction_drill.py' in package['scripts']['qualify:pre59']
pre59_start = 'node scripts/check-pre52-data-continuity.js && node scripts/check-pre58-production-startup.js && node scripts/check-pre59-nonproduction-drill.js && npm --prefix .runtime/smarter-justice-v1.7.98 start'
assert package['scripts']['start'] == pre59_start
for lifecycle_test in [
    'deployment/pre53/test_pre53_render_startup.py',
    'deployment/pre54/test_pre54_release.py',
    'deployment/pre55/test_pre55_release.py',
    'deployment/pre56/test_pre56_release.py'
]:
    lifecycle_source = (repo / lifecycle_test).read_text()
    assert pre59_start in lifecycle_source, lifecycle_test
    assert "env.pop('NODE_USE_ENV_PROXY', None)" in lifecycle_source, lifecycle_test
bootstrap = (repo / 'scripts/bootstrap-sitewide-release.js').read_text()
assert 'delete env.NODE_USE_ENV_PROXY' in bootstrap
print('PASS PRE59 combined non-production rollback and credential-rotation rehearsal; 0 provider mutations, 0 credential values, gates closed')
