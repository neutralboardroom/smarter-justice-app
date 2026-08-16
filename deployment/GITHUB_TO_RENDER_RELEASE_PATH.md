# GitHub-to-Render release path

This repository deploys without moving product ZIP files between ChatGPT, GitHub,
PowerShell, and Render.

## Release flow

1. A reviewed change is merged to `main`.
2. `Production qualification` checks out the exact merge commit and reproduces the
   Render `npm ci --omit=dev` build.
3. The qualification gate must succeed.
4. When the repository variable `RENDER_DEPLOY_ENABLED` is exactly `true`, GitHub
   requests a Render deployment of `${{ github.sha }}` through Render's API.
5. The workflow resolves the Render deployment ID, verifies its commit SHA while
   monitoring it, and requires the deployment to become `live`.
6. `/livez`, `/health`, and `/api/release-identity` must confirm the same commit.

The pre61 release gate also requires `/livez` and `/health` to report the core
application version `1.7.98`, and release identity to report the current platform
improvement `v2.0.0-pre61`. It also verifies the professional design-system
overlay, a single working mobile menu, removal of legacy micro-portal links,
and live same-origin destinations exposed by the six main module funnels.

Pull requests, manual qualification runs, and non-`main` branches never deploy.
Render auto-deploy remains off; GitHub is the only automatic promotion gate.

## One-time protected GitHub configuration

Configure these under **Repository settings > Secrets and variables > Actions**:

- Repository secret `RENDER_API_KEY`: a Render API key with access to the correct
  workspace. Never put its value in source, issues, pull requests, logs, or chat.
- Repository secret `RENDER_SERVICE_ID`: the Render service ID for
  `smarter-justice-app`.
- Repository variable `RENDER_DEPLOY_ENABLED`: leave absent or set to `false`
  during setup. Set it to `true` only after both secrets are present.

To stop automatic promotion immediately, set `RENDER_DEPLOY_ENABLED` to `false`.
This does not change the live service.

## Failure behavior

- Missing protected configuration fails closed.
- A build or pre-deploy failure never passes the workflow and Render retains the
  prior live release.
- A deployment whose Render commit does not equal the qualified GitHub commit is
  rejected.
- A public release identity that does not equal the qualified commit is rejected.
- The workflow never changes Render commands, environment variables, domains,
  plans, databases, or auto-deploy settings.

Product, builder, and evidence ZIPs remain durable recovery artifacts. They are
not part of the ordinary deployment path.
