# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

KNBA is a two-part app with **no shared build** — they run as separate processes and only communicate over HTTP:

- **Frontend** (repo root): Next.js 16 App Router + React 19 + Tailwind v4. Serves the public site and the admin panel. Talks to the backend purely through `fetch`.
- **Backend** (`backend/`): Django 6 + Django REST Framework + SimpleJWT. Exposes a JSON API under `/api/`, the Django admin under `/dj-admin/`, and serves uploaded media under `/media/`.

Despite the workspace path being `django projects`, the root is the Next.js project. The Django project lives entirely under `backend/`.

## Commands

Frontend (run from repo root):
```bash
npm run dev      # Next dev server on http://localhost:3000
npm run build    # Production build (uses --webpack, not turbopack)
npm run start    # Serve the production build
npm run lint     # eslint (flat config, next/core-web-vitals + typescript)
```

Backend (run from `backend/`, with the venv active):
```bash
python manage.py runserver          # API on http://127.0.0.1:8000 (frontend defaults to this)
python manage.py migrate
python manage.py createsuperuser     # login for /dj-admin/ AND for the frontend admin panel
python manage.py seed_knba           # seed demo content (management command)
python manage.py test                # run the test suite (tests in backend/api/tests.py)
python manage.py test api.tests.SomeTest.test_method   # single test
```

There is no `requirements.txt` install shortcut documented beyond `pip install -r backend/requirements.txt`. The backend defaults to **SQLite** locally with no env file needed.

## How the two halves connect

- The frontend reads the API base from `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:8000/api`) and media base from `NEXT_PUBLIC_MEDIA_BASE_URL`. See [lib/api.ts](lib/api.ts). All `NEXT_PUBLIC_*` values are **inlined at build time** — changing them requires a rebuild, never just a restart.
- `next.config.ts` whitelists image hosts (`127.0.0.1:8000`, `localhost:8000`, and `NEXT_PUBLIC_MEDIA_HOST` in prod). A new media host must be added here or `next/image` will reject it.
- Backend CORS/CSRF origins come from `DJANGO_CORS_ALLOWED_ORIGINS` / `DJANGO_CSRF_TRUSTED_ORIGINS` env vars, defaulting to the localhost:3000 frontend.

## Auth model

JWT, not sessions, for the API. Flow lives in [lib/api.ts](lib/api.ts):
- Login (`POST /api/auth/login/`) returns `{ access, refresh, user }`, stored in `localStorage` under `knba_admin_session`.
- `apiRequest()` is the single fetch wrapper; pass `token` to send `Authorization: Bearer`.
- `getValidAdminAccessToken()` refreshes via `/api/auth/refresh/` and re-stores the session; on failure it clears the session.
- [components/admin-shell.tsx](components/admin-shell.tsx) is the admin gate: it hydrates the session client-side, redirects to `/login` if absent, and polls `/auth/me/` + submission/message endpoints every 30s for the topbar notification badge.

## Backend API conventions

All endpoints are in [backend/api/views.py](backend/api/views.py); routes registered in [backend/api/urls.py](backend/api/urls.py) via DRF `DefaultRouter`.

- **`PublicReadAdminWriteViewSet`** is the core base class. Anonymous users get read-only access **filtered to `is_active=True`**; authenticated users see everything and can write. When adding a public-facing resource, subclass this rather than `ModelViewSet`.
- The global DRF default permission is `AllowAny` — security comes from the per-viewset `get_permissions()` overrides, not from a restrictive default. Be deliberate: a plain `ModelViewSet` is fully public unless you set `permission_classes`.
- **"Singleton-ish" resources** (`OrganizationProfile`, `EmergencyNotice`, `CommitteeTerm`) enforce one active/current row: saving one with the active flag deactivates the others (`_sync_active_*` / `_sync_current_term`), and each exposes a `current` action and an `activate` detail action.
- **Public submission → admin approval** is a recurring pattern (`BusinessShowcaseSubmission`, `MemberSubmission`): anonymous `create` is allowed, everything else requires auth. An `approve` action creates/updates the corresponding published record (`BusinessShowcaseItem` / `MemberProfile`) and stamps the submission; `reject` just marks status. Approved/published submissions cannot be rejected.
- Image-bearing viewsets add `MultiPartParser, FormParser, JSONParser` so the same endpoint accepts both JSON and multipart uploads.

## Member role capacity rule (cross-language invariant)

Committee member roles have hard caps per current term. The cap table exists **twice and must stay in sync**:
- Backend: [backend/api/member_role_caps.py](backend/api/member_role_caps.py) (`MEMBER_ROLE_CAPS`) — enforced on submission create and approve.
- Frontend: [lib/member-roles.ts](lib/member-roles.ts).

If you change a role cap, update both files.

## Frontend data layer

- The `app/` directory uses route groups: `(site)` = public pages, `(admin)` = admin panel (wrapped by `AdminShell`). The `(admin)` group has no shared URL prefix beyond the page paths themselves (`/admin/...`, `/login`).
- Each `lib/*.ts` module owns a domain (gallery, members, services, business-showcase, organization-profile, …) and typically exports: a TypeScript record type, a `normalize*Record()` mapper from the loose API shape, an image-src resolver, and **fallback data** imported from [lib/site-data.ts](lib/site-data.ts). Pages render fallbacks when the API is unreachable or empty, so the public site never blanks out.
- Image URL resolution is centralized: `resolveBackendAssetUrl` in [lib/api.ts](lib/api.ts) and per-domain `resolve*ImageSrc` helpers prepend `MEDIA_BASE_URL` to relative paths while leaving absolute/`blob:`/`data:` URLs untouched.
- `@/*` path alias maps to the repo root (see `tsconfig.json`).

## Database & deployment notes

- DB engine is selected by `DJANGO_DB_ENGINE` (`sqlite` default, or `mysql` / `postgres`). For MySQL, [backend/config/__init__.py](backend/config/__init__.py) installs a **PyMySQL shim** (`install_as_MySQLdb`) so no `mysqlclient` C build is needed on shared hosting — do not remove it.
- Production target is **cPanel/Passenger** (LiteSpeed). The frontend production entrypoint is [server.js](server.js) (hardcoded `dev = false`); the backend uses a `passenger_wsgi.py` created on the server. Full runbook is in [DEPLOY.md](DEPLOY.md) — read it before touching deploy config.
- WhiteNoise serves Django static files; `collectstatic` is required for `/dj-admin/` styling. Media is served by Django's `serve()` view in [backend/config/urls.py](backend/config/urls.py) (in production an Apache alias is the recommended override — see DEPLOY.md).
