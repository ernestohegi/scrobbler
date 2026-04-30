# Scrobbler Expansion Spec (Single-User, Docker-First)

## 1. Context

Current goal: relay YouTube Music track data to Last.fm reliably with minimal setup.

This spec expands the project in small tasks while preserving:

- Single-user operation (no multi-tenant complexity yet)
- Docker-first portability
- Existing Tampermonkey ingestion flow

## 2. Product Goals

1. Keep scrobbling reliable and easy to self-host.
2. Add a small web interface to manage Last.fm connection/session.
3. Show recent scrobbles in the interface.
4. Prepare architecture so future multi-user support is possible without full rewrite.

## 3. Non-Goals (for this phase)

- Multi-user accounts/teams
- Advanced analytics/dashboarding
- Full Last.fm data sync engine
- Complex permissions/roles

## 4. Constraints and Assumptions

- Single trusted operator of the app instance.
- Tampermonkey script runs in the user browser.
- Last.fm API capabilities may limit true delete/edit actions for scrobbles.
- Redis remains available (already in current stack).

## 5. High-Level Architecture (Target v1)

- API server (Express + TypeScript)
- Redis for short-lived/session/cache data
- Optional DB (Postgres) introduced only when needed for durable local metadata
- Minimal server-rendered or static frontend served by API server (final choice in Phase 2)

## 6. Security Baseline (Single-User)

- Add shared ingestion token for Tampermonkey -> API POST routes.
- Restrict CORS to explicit origins (or disable cross-origin for production if not needed).
- Validate required env vars at startup and fail fast.
- Add simple rate limiting to ingestion routes.

## 7. Delivery Plan (Task-by-Task)

## Phase 0: Hardening Existing Core

### Task 0.1 - Runtime config validation

Scope:

- Centralize env parsing in one config module.
- Validate required values (`API_KEY`, `SHARED_SECRET`, Redis host/port, ingestion token).

Acceptance criteria:

- App fails at startup with actionable errors when required env vars are missing.
- No direct `process.env.X!` usage outside config module.

### Task 0.2 - Request schema validation

Scope:

- Add schema validation for `/scrobble` and `/now-playing` payloads.
- Normalize validation errors.

Acceptance criteria:

- Invalid payloads return `400` with consistent error format.
- Valid payload behavior remains unchanged.

### Task 0.3 - Ingestion authentication

Scope:

- Require header token for Tampermonkey requests.
- Document script update.

Acceptance criteria:

- Requests without token get `401`.
- Requests with valid token still scrobble.

### Task 0.4 - Baseline observability

Scope:

- Structured logs for route success/failure.
- Add `/health` endpoint.

Acceptance criteria:

- Health endpoint returns status JSON.
- Logs include method, route, and outcome.

## Phase 1: Session Management UI (Single-User)

### Task 1.1 - UI skeleton

Scope:

- Add minimal UI shell with navigation.
- Pages: `Session`, `Recent Scrobbles`.

Acceptance criteria:

- UI accessible from `/app`.
- Navigation works on desktop and mobile.

### Task 1.2 - Session page

Scope:

- Show current Last.fm auth status.
- Add connect/reconnect flow via existing `/` + `/auth` mechanism.
- Show linked username and basic metadata.

Acceptance criteria:

- User can see whether app is authenticated.
- User can complete auth and see updated state.

### Task 1.3 - Session actions

Scope:

- Add disconnect action (clear local stored session).

Acceptance criteria:

- After disconnect, scrobble endpoints require re-auth.
- UI reflects disconnected state.

## Phase 2: Recent Scrobbles View

### Task 2.1 - Read recent scrobbles

Scope:

- Add backend endpoint to fetch latest scrobbles for current user.
- Source can be Last.fm API directly (preferred first step).

Acceptance criteria:

- UI lists latest N scrobbles with artist/track/album/time.
- Errors are surfaced clearly in UI.

### Task 2.2 - Optional local cache

Scope:

- Add Redis cache for recent scrobble responses to reduce API calls.

Acceptance criteria:

- Repeated page loads hit cache within TTL.
- Cache invalidates/refreshes correctly.

### Task 2.3 - "Delete" behavior decision

Scope:

- Verify Last.fm deletion capability.
- If unsupported, implement local hide/ignore list as explicit fallback.

Acceptance criteria:

- Behavior is clearly documented in UI and README.
- No misleading "deleted from Last.fm" messaging.

## Phase 3: Docker and Ops Polish

### Task 3.1 - Compose profiles and health checks

Scope:

- Refine `docker-compose` with service health checks.
- Optional profiles for future DB.

Acceptance criteria:

- `docker compose up` yields healthy app+redis services.
- Health checks gate dependent startup where relevant.

### Task 3.2 - Env and startup docs

Scope:

- Expand `.env.example` and README runbook.
- Include upgrade/migration notes for new vars.

Acceptance criteria:

- Fresh setup from README works end-to-end.
- Required vars and defaults are clearly documented.

## 8. API Additions (Planned)

- `GET /health`
- `GET /api/session`
- `DELETE /api/session`
- `GET /api/scrobbles/recent?limit=...`

Note: Existing routes remain:

- `POST /now-playing`
- `POST /scrobble`
- `GET /` and `GET /auth`

## 9. Data Model Evolution

Initial (Redis only):

- `lastfm_session` (or namespaced equivalent)
- optional `recent_scrobbles_cache`
- optional `hidden_scrobbles`

Future (if DB added):

- `app_settings`
- `session_metadata`
- `hidden_scrobbles`
- `sync_jobs` (optional)

## 10. Testing Strategy by Phase

- Unit tests for config validation and payload schemas.
- Route integration tests for auth failures and success paths.
- UI smoke tests for session and recent-scrobbles pages.
- Docker smoke test: auth + one successful scrobble flow.

## 11. Suggested Execution Order (First 5 Tasks)

1. Task 0.1 Runtime config validation
2. Task 0.2 Request schema validation
3. Task 0.3 Ingestion authentication
4. Task 1.1 UI skeleton
5. Task 1.2 Session page

## 12. Open Questions

1. Preferred UI approach: server-rendered templates vs small SPA?
2. Keep Redis-only for v1 UI data, or introduce Postgres in Phase 2?
3. Preferred reverse proxy/HTTPS approach for self-hosting (if any)?

## 13. Definition of Done (v1)

- Single-user can authenticate Last.fm, scrobble from Tampermonkey, and view recent scrobbles in UI.
- Basic security controls are in place for ingestion route access.
- Docker compose provides reproducible local/self-hosted deployment.
- Documentation is complete for setup, auth, and troubleshooting.
