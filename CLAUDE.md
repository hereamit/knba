# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KNBA (Khichapokhari Newroad Business Association) is a two-part web app:

- **Frontend** — Next.js 16 (App Router, React 19, Tailwind v4) at the repo root.
- **Backend** — Django 6 + Django REST Framework in `backend/`.

They are fully decoupled: no shared code, communicating only over HTTP/JSON. The frontend is a pure API client; all persistent content lives in the Django DB and is edited through the admin panel.

## Commands

### Frontend (run from repo root)
- `npm run dev` — dev server on :3000
- `npm run build` — production build (note: pinned to `--webpack`, not Turbopack)
- `npm run start` — serve the production build (or `node server.js`, the Passenger entry point)
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

### Backend (run from `backend/`, with the venv active)
The venv lives at `backend/venv`. Activate in Git Bash with `source venv/Scripts/activate`.
- `python manage.py runserver` — API + admin on :8000
- `python manage.py migrate` / `makemigrations`
- `python manage.py seed_knba` — seed starter content **and** an admin user (`admin@knba.org.np` / `knba-admin`, overridable via `KNBA_ADMIN_EMAIL` / `KNBA_ADMIN_PASSWORD`)
- `python manage.py test` — run all tests; single test: `python manage.py test api.tests.ClassName.test_method`
- `python manage.py createsuperuser` — note: creates a blank-email account, so log in by **username** (the admin login form prefills email)
- `python manage.py collectstatic --noinput`

The developer runs both dev servers themselves — don't auto-start `runserver` / `npm run dev` (port collisions). For changes that need a running server, hand them the command instead.

## Architecture

### Frontend (`app/`, `components/`, `lib/`)
- Route groups: `app/(site)/` = public pages, `app/(admin)/` = admin panel + `/login`. Every page is a **client component** (`"use client"`) that fetches from the API at runtime — there is no server-side data fetching or SSR data.
- `lib/api.ts` is the single networking module: `API_BASE_URL`/`MEDIA_BASE_URL` resolution, `apiRequest()`, and the JWT session helpers. Pages mostly call `fetch(`${API_BASE_URL}...`)` directly.
- Each `lib/<resource>.ts` holds that resource's TS types plus `normalize*` / `map*` transforms. `lib/site-data.ts` holds large **static fallback** content rendered when the API is unreachable.
- `components/admin-*.tsx` are the admin CRUD managers (one per resource); other `components/*.tsx` are public UI. `components/admin-shell.tsx` is the admin chrome wrapper.
- **Phone numbers** (business showcase, etc.) are stored as a **single comma-separated string** (e.g. `"+977-9801234567, 014445555"`) — mobiles carry the `+977` country code, landlines keep their area code. `lib/phone.ts` parses/formats this; `components/phone-numbers-input.tsx` is the multi-entry editor. Validation is intentionally lenient (no fixed digit count).

### Backend (`backend/api/` — a single Django app)
- All content models extend `TimeStampedModel` in `api/models.py`. Most are exposed as DRF `ModelViewSet`s registered on a `DefaultRouter` in `api/urls.py`.
- **`PublicReadAdminWriteViewSet`** is the key base class: safe methods → `AllowAny` and anonymous reads are filtered to `is_active=True`; writes require JWT auth. Subclass this for any publicly-readable, admin-editable resource.
- Non-router endpoints: `health/`, `auth/login|refresh|me`, `about-page/` (aggregated read), `site-settings/` (singleton), `dashboard/summary/`.
- **"Active singleton" pattern** (OrganizationProfile, EmergencyNotice, CommitteeTerm): saving one with `is_active`/`is_current` true deactivates all others. Implemented in `perform_create`/`perform_update` plus `current` and `activate` `@action`s. Preserve this when touching those viewsets.
- **Image optimization**: every model with an `ImageField` calls `optimize_uploaded_image()` in `save()` (EXIF-transpose, resize to ≤2200px, re-encode/compress). Uploads land in `backend/media/`. Exception: `HeroSlide.image_url` is a plain `CharField` (URL/path), so those images bypass optimization.
- **Two homepage "hero" models**: `HeroSlide` = rich content slides (title/description/CTA + `image_url`); `HomeHeroImage` = uploaded background images for the hero slider. Both surface under the admin `home` area (`admin-home-manager` / `admin-home-hero-manager`) — keep them distinct when editing.
- **Submission → publish workflow**: `BusinessShowcaseSubmission` is publicly creatable; admin `approve`/`reject` actions promote it into a `BusinessShowcaseItem`. Similarly `ContactSubmission` → admin `reply` action sends email and records a `ContactReply`.

### Auth flow
JWT via `djangorestframework-simplejwt`. `LoginView` accepts **username or email**. The frontend stores `{access, refresh, user}` in `localStorage` under `knba_admin_session`; `getValidAdminAccessToken()` refreshes the access token before admin writes. Public reads need no token.

## Configuration & deployment gotchas

- **`NEXT_PUBLIC_*` are inlined at build time**, not read at runtime. Changing `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_MEDIA_BASE_URL` / `NEXT_PUBLIC_MEDIA_HOST` requires a rebuild. Defaults point at `http://127.0.0.1:8000`.
- **DB engine is env-switched** via `DJANGO_DB_ENGINE` in `backend/.env`: `sqlite` (default), `postgres`, or `mysql`. Local dev = **postgres** (Python 3.14 venv); production cPanel = **mysql**. Both drivers ship in `requirements.txt`.
- **Don't remove the PyMySQL shim** in `backend/config/__init__.py` — it registers PyMySQL as MySQLdb so MySQL works wheel-only on shared hosting (only loads when engine is mysql).
- `backend/config/settings.py` has a **custom `.env` loader** (no python-dotenv). `backend/.env` is gitignored and holds secrets + DB creds.
- Media is served by Django (`config/urls.py` via `django.views.static.serve`) in production too — `next.config.ts` whitelists the media host for `next/image`.
- Deployment is cPanel with two Passenger apps (Node + Python); `.cpanel.yml` runs migrate/collectstatic/build on git deploy. Full steps in `DEPLOY.md`.
