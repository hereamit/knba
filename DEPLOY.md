# KNBA — cPanel Deployment Guide

Production layout (recommended):

| App | URL | cPanel tool |
|---|---|---|
| Next.js frontend | `https://knba.org.np` | **Setup Node.js App** |
| Django API + admin + media | `https://api.knba.org.np` | **Setup Python App** |
| MySQL database | `localhost` (inside cPanel) | **MySQL Databases** |

Both apps run under cPanel's Passenger (Phusion). Apache/LiteSpeed sits in front and terminates SSL.

---

## 1. Create the subdomain for the API

In cPanel → **Domains** → **Create A New Domain**:
- Domain: `api.knba.org.np`
- Document Root: `/home/<cpaneluser>/api.knba.org.np` (cPanel default)

Issue an SSL cert for both `knba.org.np` and `api.knba.org.np` via **SSL/TLS Status → AutoSSL**.

---

## 2. Create the MySQL database

cPanel → **MySQL Databases**:
1. Create database → name: `knba` → cPanel prefixes it, final name: `cpaneluser_knba`
2. Create user → name: `knba` → final: `cpaneluser_knba`, set a strong password
3. **Add user to database** → grant **ALL PRIVILEGES**

Note the final names — you'll use them in `backend/.env`.

---

## 3. Upload code

Option A — Git (preferred if cPanel has Git Version Control):
- Clone the repo into `/home/<cpaneluser>/knba-src`
- Symlink or copy `backend/` into the Python app root, and the Next.js project into the Node.js app root.

Option B — File Manager / SFTP:
- Zip the project locally (exclude `node_modules`, `backend/venv`, `backend/db.sqlite3`, `.next`, `staticfiles`)
- Upload + extract into `/home/<cpaneluser>/knba-src`

---

## 4. Backend (Django) — Setup Python App

cPanel → **Setup Python App** → **Create Application**:
- Python version: 3.11 or 3.12 (whatever cPanel offers ≥ 3.10)
- Application root: `knba-src/backend`
- Application URL: `api.knba.org.np`
- Application startup file: `passenger_wsgi.py` (see below)
- Application Entry point: `application`

Create `backend/passenger_wsgi.py` (one-time, on the server):

```python
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
from config.wsgi import application
```

Then in the Python App panel:
1. **Enter virtual environment** (cPanel shows the activation command — copy/paste into terminal).
2. `pip install -r requirements.txt`
3. Copy `backend/.env.example` → `backend/.env` and fill in real values (secret key, MySQL creds, ALLOWED_HOSTS, email).
4. `python manage.py migrate`
5. `python manage.py collectstatic --noinput`
6. `python manage.py createsuperuser` (for `/dj-admin/`)
7. Back in the Python App panel → **Restart**.

**Media uploads** go to `backend/media/` — make sure that directory exists and is writable (`chmod 755`). WhiteNoise serves `/static/`; Django serves `/media/` via the URL config when `DEBUG=False` only if you keep the static() line, which currently runs only in DEBUG. Two options:

- **Recommended**: Add an Apache alias for `/media/` → `/home/<cpaneluser>/knba-src/backend/media/` via cPanel's **File Manager → .htaccess** in the api subdomain root:
  ```apacheconf
  Alias /media/ /home/<cpaneluser>/knba-src/backend/media/
  <Directory /home/<cpaneluser>/knba-src/backend/media/>
      Require all granted
  </Directory>
  ```
- Or change `backend/config/urls.py` to always serve media (less ideal, but works).

Test: `https://api.knba.org.np/dj-admin/` should show the Django admin login.

---

## 5. Frontend (Next.js) — Setup Node.js App

cPanel → **Setup Node.js App** → **Create Application**:
- Node version: 20.x or later (Next 16 requires Node ≥ 18.18)
- Application mode: Production
- Application root: `knba-src` (project root with `package.json`)
- Application URL: `knba.org.np`
- Application startup file: `server.js` (already in the repo)

Then in the Node.js App panel:
1. **Run NPM Install**
2. Open the cPanel terminal in the app's virtualenv and run:
   ```bash
   npm run build
   ```
3. Create `.env.production` in the project root from `.env.example`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api.knba.org.np/api
   NEXT_PUBLIC_MEDIA_BASE_URL=https://api.knba.org.np
   NEXT_PUBLIC_MEDIA_HOST=api.knba.org.np
   ```
   These must be set **before** `npm run build` because `NEXT_PUBLIC_*` values are inlined at build time. Re-build if you change them.
4. Set environment variables in the Node.js App UI:
   - `NODE_ENV=production`
   - `PORT` is provided automatically by Passenger; `server.js` reads it.
5. Click **Restart**.

Test: `https://knba.org.np` should load the homepage; gallery/business images load from `api.knba.org.np`.

---

## 6. Post-deploy checklist

- [ ] `https://knba.org.np` returns 200 and renders the React app
- [ ] `https://api.knba.org.np/api/organization-profiles/current/` returns JSON
- [ ] `https://api.knba.org.np/dj-admin/` admin login works
- [ ] Logging in via the frontend admin panel issues JWT and persists in localStorage
- [ ] Uploading an image from admin saves to `backend/media/` and renders on the public site
- [ ] DEBUG=False, ALLOWED_HOSTS does **not** include `*`
- [ ] Backup created in cPanel **Backup Wizard** before first launch

---

## Things to watch out for

1. **NEXT_PUBLIC_* changes require a rebuild.** They are baked into the JS bundle at build time, not read at runtime.
2. **PyMySQL shim** is in `backend/config/__init__.py` — don't remove it; it's what makes `mysqlclient`-free MySQL work on shared hosting.
3. **Database engine** is controlled by `DJANGO_DB_ENGINE` in `backend/.env`. Use `postgres` (cPanel PostgreSQL® Databases) or `mysql` (MySQL® Databases). Both drivers ship in `requirements.txt` (`psycopg[binary]` and `PyMySQL`), so installation is wheel-only and works on shared hosting.
4. **CORS**: if you later add `www.knba.org.np`, add it to `DJANGO_CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS` and restart the Python app.
5. **Static files**: if admin CSS is missing on `/dj-admin/`, you forgot `collectstatic`. WhiteNoise serves from `staticfiles/`.
6. **Passenger restart**: after any code change on the server, touch `tmp/restart.txt` or click Restart in the cPanel app panel — Passenger caches the process.
