# Quiz Site — Assessment Platform

Node.js / Express / MySQL assessment application with student and proctor dashboards, server-graded multiple-choice questions, C code evaluation through a third-party Piston service, results and violation logs.

> **Security release candidate**: This branch introduces mandatory password-based login, role-based server-side authentication, session ownership checks and exam integrity improvements. **It is not production-certified.** Do not deploy before reviewing migrations, credentials, backup handling and automated checks.

## Security model

- Students log in with their registered roll number **and a separately issued secret password**; a roll number alone is not authentication.
- Admins use individual accounts verified on the server. No hard-coded frontend passwords.
- Random opaque session cookies are HttpOnly and SameSite=Strict. A SHA-256 digest of each token is stored in MySQL and expires after eight hours.
- Server-side access rules limit students to their own quiz sessions, while submission and violation data requires admin access.
- Mutation requests require an exact matching Origin header and a configured APP_ORIGIN.
- Multiple-choice answers use exact **zero-based** option indexing (A=0, B=1, C=2, D=3) with submitted question IDs validated against the assigned quiz.
- A server-side deadline is calculated from the database started_at timestamp. Syncing a timer does not decrement the database.
- A remote MySQL server uses certificate-verified TLS in production. A trusted CA may be supplied with DB_SSL_CA.

## Local setup

Requires Node.js 20+, MySQL and an existing quiz schema. The existing database backup files were removed from the new branch because they contain student/session records. Restore sensitive data privately, never from a public repository.

1. Run npm ci.
2. Copy .env.example to .env and configure your database. **Node does not automatically read .env**: provide these variables through your shell, hosting platform or a trusted dotenv loader.
3. Set APP_ORIGIN=http://localhost:3000 for local testing, and use the exact HTTPS public origin in production.
4. Apply the migration: npm run migrate.
5. Provision credentials interactively: node scripts/provision.js admin ADMIN_USERNAME and node scripts/provision.js student ROLL_NUMBER. Each prompts for a 12+ character password without echoing it.
6. Start the application: npm start. The frontend is served at http://localhost:3000.

Never reuse the publicly committed example admin credentials, old API keys or tokens. Revoke/rotate all potentially exposed credentials, including those in Git history.

## Run checks

- npm test — Node test suites for authentication, grading and the existing submissions service.
- npm run check — JavaScript syntax validation.
- GitHub Actions CI — Node 20/22 build/test checks on push and pull requests.

## Endpoints

- POST /api/student/login — student login with roll_no + password
- POST /api/admin/login — server-verified admin credentials
- GET /api/auth/me — current logged-in account
- POST /api/auth/logout — revoke current session
- GET /api/student/assessments/:roll_no and /api/student/results/:roll_no — student-only and account-scoped
- POST /api/start_assessment — assigned student account only
- GET /api/mcq/:version_code, POST /api/submit_mcq — assigned quiz only
- GET /api/coding/:version_code, POST /api/submit_code — assigned challenges only
- POST /api/run_code — external execution service; apply additional production quotas
- GET /api/admin/submissions, GET /api/admin/violations — admin-only

## Remaining production hardening

This is not a substitute for a full security assessment. Before processing real student records, add distributed rate limits (edge or Redis), robust concurrent assessment submission locking, production telemetry, external execution quotas, dependency scanning, end-to-end authentication tests using a seeded ephemeral MySQL database, and privacy/retention policies for student logs.

## License

ISC.
