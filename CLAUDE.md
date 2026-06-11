# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

This repo holds two apps that ship together:

- **Next.js 16 frontend** (App Router, React 19, TypeScript, Tailwind v4) at the repo root — public site under `app/(site)/` and JWT-protected admin under `app/(admin)/`.
- **Django 6 + DRF backend** in `backend/` exposing a REST API at `/api/`, Django admin at `/dj-admin/`, and serving uploaded `media/`.

The frontend never talks to the database directly — it calls the Django API over HTTPS. In production they live on separate subdomains (`knba.org.np` and `api.knba.org.np`); see `DEPLOY.md` for the cPanel layout.

## Commands

### Frontend (run from repo root)

```bash
npm run dev       # next dev — http://localhost:3000
npm run build     # next build --webpack  (production build uses webpack, NOT turbopack)
npm run start     # next start (after build)
npm run lint      # eslint
node server.js    # custom Passenger-compatible entrypoint used in production (cPanel)
```

There is no test runner wired up on the frontend.

### Backend (run from `backend/`)

```bash
python manage.py runserver               # http://127.0.0.1:8000
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
python manage.py seed_knba               # seeds starter content + admin user
python manage.py test                    # Django tests (api/tests.py)
python manage.py test api.tests.SomeTest # single test
```

Install: `pip install -r requirements.txt` inside a venv (`backend/venv/` is the local dev one).

## Configuration boundaries

- **Frontend env**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MEDIA_BASE_URL`, `NEXT_PUBLIC_MEDIA_HOST` — see `.env.example`. These are **inlined at build time**, so changing them requires a rebuild. `NEXT_PUBLIC_MEDIA_HOST` also feeds `next.config.ts` `images.remotePatterns` — any new media host must be added there or `next/image` will reject it.
- **Backend env**: loaded from `backend/.env` by a hand-rolled parser in `backend/config/settings.py` (no `python-dotenv` dependency). Keys: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `DJANGO_CORS_ALLOWED_ORIGINS`, `DJANGO_DB_ENGINE` (`sqlite` | `mysql` | `postgres`), `DJANGO_DB_*`, `JWT_ACCESS_TOKEN_MINUTES`, `JWT_REFRESH_TOKEN_DAYS`, `DJANGO_EMAIL_*`.
- **MySQL on shared hosting**: `backend/config/__init__.py` installs `PyMySQL` as the `MySQLdb` driver when `DJANGO_DB_ENGINE=mysql`. Don't remove that shim — it's what makes MySQL work without `mysqlclient`'s C build.
- **No PostgreSQL driver** is in `requirements.txt`. The `postgres` branch in `settings.py` exists but won't run until `psycopg` is added back.

## Architecture notes worth knowing upfront

### API surface (`backend/api/urls.py`)

All routes mount under `/api/`. Auth uses SimpleJWT:
- `POST /api/auth/login/` → `{access, refresh, user}`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`

Content viewsets (organization-profiles, hero-slides, services, members, gallery, business-showcase, events, contact-submissions, emergency-notices, etc.) follow a **public-read / admin-write** pattern via `PublicReadAdminWriteViewSet` in `backend/api/views.py`: unauthenticated GETs are allowed and filtered to `is_active=True`; mutations require JWT.

### Frontend admin auth

`lib/api.ts` is the single fetch wrapper. It stores the JWT session in `localStorage` under `knba_admin_session` and exposes `getValidAdminAccessToken()` which silently refreshes via `/api/auth/refresh/` and clears the session on failure. All admin components go through this — don't roll a parallel fetch path.

### Media URL resolution

Both `lib/api.ts` (`resolveBackendAssetUrl`) and `lib/organization-profile.ts` (`resolveOrganizationImageSrc`) normalize backend-served media paths against `MEDIA_BASE_URL`. Use these helpers; don't string-concat media URLs inline.

### Image optimization on upload

`backend/api/models.py` exports `optimize_uploaded_image()` (Pillow), called from model `save()` methods. It resizes to ≤2200px on the longest edge and re-encodes JPEG/PNG/WebP. Failure is swallowed — the original upload is kept. Any new `ImageField` that needs the same treatment should call this from its model.

### Dynamic favicon

`app/api/favicon/route.ts` proxies the org logo from the Django API as the site favicon (with `force-dynamic` + `no-store`). The root layout points `icons` at `/api/favicon`. Don't add a static `favicon.ico` to `app/` — Next would prefer it over this route.

### Route groups

- `app/(site)/` — public marketing site (shares `SiteHeader`/`SiteFooter` via `(site)/layout.tsx`).
- `app/(admin)/admin/` — admin dashboard, wrapped in `AdminShell` which enforces auth client-side.
- `app/(admin)/login/` — login page (outside the AdminShell).

The path alias `@/*` maps to the repo root (see `tsconfig.json`).

### Production entrypoint

`server.js` is a tiny Node HTTP shim that bootstraps Next.js for cPanel Passenger (which sets `PORT`). Local dev uses `next dev` directly; only touch `server.js` if you're changing how Passenger boots the app.

## Deployment specifics

`DEPLOY.md` is the source of truth for cPanel deployment. The two non-obvious things from it:

1. `NEXT_PUBLIC_*` values must be set **before** `npm run build` because they're inlined into the JS bundle.
2. Media (`/media/`) is only auto-served by Django when `DEBUG=True`. In production, set an Apache `Alias /media/ → backend/media/` (the `.htaccess` snippet in `DEPLOY.md`) rather than relying on Django.
