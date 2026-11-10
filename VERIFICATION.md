# Verification — 2026-11-10

This update builds on PR #6's authentication and exam-integrity changes.

## Verified in this update

- Node.js 24.14.0 and isolated MySQL 8.4.13: **37 tests passed, 0 failed, 0 skipped**.
- Tests include concurrent assessment starts, concurrent code submissions (one accepted write, one conflict), authentication, authorization, exact MCQ grading, results, logout and read-only preflight.
- Browser flow with synthetic student S2: login, assigned assessment, MCQ 1/1, coding 1/1, finish, rendered results.
- External code execution was mocked in integration and browser tests. This does not validate the public Piston service.
- JavaScript syntax checks include all maintained server modules, scripts, tests and inline browser scripts.
- `npm audit`: zero reported vulnerabilities at verification time.
- Dockerfile now uses Node 22, locked dependencies and a non-root runtime; no local C compiler is needed. Docker build was not run because Docker is unavailable on this machine.

## Defects addressed

- Removed empty-input execution before judging: programs that require stdin are evaluated only against assigned test cases.
- Draft saves capture problem/session/text before debounce; late draft loads cannot overwrite another problem. Empty drafts remain empty and unsaved text survives tab changes in memory.
- Code submissions retain their original problem identity, block duplicate UI clicks, preserve verdict text and refresh completion markers.
- MCQ-only assessments can finish after an authenticated, successful empty coding-list response.
- API parser failures and unknown endpoints return safe JSON without stack traces.
- Fresh installations can initialize a clean data-free schema; initialization refuses a nonempty database. Integration tests exercise that same schema.
- A read-only preflight checks the origin, schema and provisioned-account coverage without printing student records or credentials.
- CI covers Node 20/22/24 with real MySQL and a dependency audit.

## Release work still required

No production data, account credentials or deployment settings were changed.
Before merging/deploying the authentication overhaul:

1. Configure a separate hosted staging MySQL database and Preview APP_ORIGIN.
2. Make a private production backup, apply the authentication migration and provision/deliver individual passwords.
3. Rotate previously exposed secrets and assess records remaining in public Git history.
4. Run `npm run preflight` with each target environment's configuration, then verify HTTPS login, assessment completion and the real external judge on staging.

Passing local tests does not establish that these operational release steps are complete.
