# Smarter Justice Production Incident Runbook — v1.7.73

1. Identify the exact product, commit, release ZIP, Render deploy, domain, and affected capability.
2. Keep the incident scope narrow; pause only affected paid, upload, routing, notification, or integration capabilities where possible.
3. Preserve logs and redacted evidence. Never expose secrets, private legal matters, or survivor-safe contact data.
4. Determine whether the previous healthy service is still serving. Do not roll back during the ordinary Render health evaluation window without evidence of material harm.
5. Assess migration, database, disk, environment-group, domain, and auto-deploy compatibility before rollback.
6. Roll back only to a distinct verified eligible target; otherwise fail closed and serve the safest available static/public fallback.
7. Verify health, readiness, critical smoke, monitoring, support, and screenshots after recovery.
8. Record correction, evidence invalidation, owner notification, reacceptance, and prevention work.
