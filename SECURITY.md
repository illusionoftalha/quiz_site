# Security and deployment

Do not post student records, secrets or proof-of-concept exploits in public issues. Report vulnerabilities privately to the repository maintainer.

The application stores opaque cookie session hashes in MySQL, not passwords or raw cookie values. Student credentials are individually provisioned and hashed with scrypt. The session table must be created by migrations/001_auth.sql before deployment.

**Urgent migration note:** Previous commits included SQL dumps with student/session records and a third-party provider API key. Deleting those files from the current branch does not delete copies from Git history. Audit exposure, revoke old session tokens, rotate the affected API credentials and notify affected people where appropriate. Do not publish production data in future commits.

Deploy only over HTTPS with APP_ORIGIN exactly matching the public origin, an appropriately restricted database role, verified database TLS, and a rate-limiting reverse proxy. Built-in request throttling is per-process and should not be the sole production defense.
