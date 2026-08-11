# Security Notes

- Render deploy hooks are GitHub environment secrets and never source files.
- Production deployment uses exact 40-character commit SHAs.
- Reusable workflows are pinned to immutable commits.
- Workflow permissions are read-only unless a later reviewed release operation requires narrowly scoped write access.
- Production environments must contain `PUBLIC_BASE_URL` and `RENDER_DEPLOY_HOOK_URL` only after one-time owner setup.
- No workflow may store full payment card numbers or CVC values.
- Database migrations must be expand-first, backup-protected, rehearsed, and data-preserving.
- Automatic rollback must not restore a database snapshot that would discard valid user work created after deployment.
- Production remains disabled until the branch passes independent review.
