const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = path.join(__dirname, '..');
const lockPath = path.join(root, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const approvedResolvedHosts = new Set(['registry.npmjs.org']);
let resolvedCount = 0;

for (const [packagePath, metadata] of Object.entries(lock.packages || {})) {
  if (!metadata || !metadata.resolved) continue;
  resolvedCount += 1;
  const resolved = new URL(metadata.resolved);
  assert.equal(resolved.protocol, 'https:', `${packagePath} must use HTTPS for resolved dependency artifacts`);
  assert(approvedResolvedHosts.has(resolved.hostname), `${packagePath} uses an unapproved dependency host: ${resolved.hostname}`);
  assert(!resolved.username && !resolved.password, `${packagePath} embeds credentials in its resolved URL`);
}
assert(resolvedCount > 0, 'package-lock.json should contain resolved dependency artifacts');

const self = path.relative(root, __filename).replaceAll(path.sep, '/');
const textExtensions = new Set(['.js', '.json', '.md', '.html', '.css', '.txt', '.yaml', '.yml', '.xml', '.svg', '.example']);
const exactTextNames = new Set(['.env.example', '.gitignore']);
const ignoredDirectories = new Set(['node_modules', '.git']);
const privateHostMarker = ['packages', 'applied-caas-gateway'].join('.');
const privateOpenAiMarker = ['internal', 'api', 'openai', 'org'].join('.');
const privateArtifactMarker = ['artifactory', 'api', 'npm', 'npm-public'].join('/');
const credentialUrl = /\b(?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+:[^\s"']+@/i;
const windowsDeveloperPath = /\b[A-Za-z]:\\(?:Users|Documents and Settings|Projects)\\[^\s"']+/i;
const unixDeveloperPath = /\/(?:Users|home)\/(?!oai(?:\/|$))[^\s/]+\//i;
const localhostRegistry = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\/(?:artifactory\/)?(?:api\/)?npm/i;
const privateKey = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const knownSecret = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b|\bAKIA[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{20,}\b/;

function walk(directory) {
  const findings = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      findings.push(...walk(full));
      continue;
    }
    if (!entry.isFile()) continue;
    const relative = path.relative(root, full).replaceAll(path.sep, '/');
    if (relative === self) continue;
    if (!textExtensions.has(path.extname(entry.name).toLowerCase()) && !exactTextNames.has(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (text.includes(privateHostMarker)) findings.push(`${relative}: private package host marker`);
    if (text.includes(privateOpenAiMarker)) findings.push(`${relative}: private OpenAI host marker`);
    if (text.includes(privateArtifactMarker)) findings.push(`${relative}: private artifact path marker`);
    if (!relative.startsWith('tests/') && credentialUrl.test(text)) findings.push(`${relative}: embedded credentials in URL`);
    if (windowsDeveloperPath.test(text)) findings.push(`${relative}: developer-specific Windows absolute path`);
    if (unixDeveloperPath.test(text)) findings.push(`${relative}: developer-specific Unix absolute path`);
    if (localhostRegistry.test(text)) findings.push(`${relative}: localhost-only package registry`);
    if (privateKey.test(text)) findings.push(`${relative}: embedded private key`);
    if (knownSecret.test(text)) findings.push(`${relative}: embedded credential-like secret`);
  }
  return findings;
}

const findings = walk(root);
assert.deepEqual(findings, [], `release portability violations:\n${findings.join('\n')}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(packageJson.engines?.node, '22.x', 'release must pin the tested Node 22 runtime');
const renderYaml = fs.readFileSync(path.join(root, 'render.yaml'), 'utf8');
assert(/name:\s*smarter-justice-app\b/.test(renderYaml), 'render.yaml must reference the existing smarter-justice-app service');
assert(/runtime:\s*node\b/.test(renderYaml), 'render.yaml must use the current runtime field');
assert(!/^\s*plan:\s*free\s*$/m.test(renderYaml), 'render.yaml must not force the existing service back to the free plan');

console.log(`release-portability.test.js passed: ${resolvedCount} dependency artifacts use approved public registries`);
