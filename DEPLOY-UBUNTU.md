# Deploy Extrovent to Ubuntu Server

Stack: PHP >=8.0 API (`backend/public/index.php`) + React Vite SPA (`extrovent_web/dist/`) + MySQL + Nginx.
Domain: `extrovent.mikael.my`

Your current Cloudflare DNS is:

```
CNAME extrovent -> a59068cb-6324-43f0-8662-4d859361bfc4.cfargotunnel.com (Proxied)
```

That means **Option A (Tunnel)** works with zero DNS changes. **Option B (public Nginx + Certbot)** requires changing that CNAME to an `A` record pointing at the server IP.

---

## 1. Server prep (Ubuntu 22.04 / 24.04)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx mysql-server php-fpm \
  php-mysql php-mbstring php-xml php-curl php-zip php-gd php-cli \
  composer nodejs npm

php -v        # need >= 8.0
node -v       # need >= 20 for vite build
sudo systemctl enable --now nginx mysql php8.3-fpm
# adjust php version: php8.1-fpm / php8.2-fpm / php8.3-fpm — check with: ls /run/php/
```

Open firewall only if using Option B:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

For Option A (Tunnel) you do **not** need to open 80/443.

---

## 2. Clone project

```bash
sudo mkdir -p /var/www/extrovent
sudo chown $USER:www-data /var/www/extrovent
cd /var/www/extrovent
git clone <your-repo-url> .  # or rsync/scp this folder up
```

Expected layout:

```
/var/www/extrovent/backend/public/index.php
/var/www/extrovent/extrovent_web/
/var/www/extrovent/ref_folder/extrovent.sql
/var/www/extrovent/backend/migrations/create_user_sessions_table.sql
```

---

## 3. Database

```bash
sudo mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS extrovent CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'extrovent'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG';
GRANT ALL PRIVILEGES ON extrovent.* TO 'extrovent'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Import base schema + JWT/session migrations via runner (`backend/migrate.php`, HRMS-style — runs every `migrations/*.sql` once, tracked in `schema_migrations`):

```bash
cd /var/www/extrovent/backend
composer install --no-dev --optimize-autoloader
# make sure .env DB_* points at this server first (see §4)
php migrate.php --list
php migrate.php --dry-run
php migrate.php --baseline   # imports ref_folder/extrovent.sql if users is missing
php migrate.php              # applies pending migrations
```

Manual fallback (same result without the runner):

```bash
mysql -u extrovent -p extrovent < /var/www/extrovent/ref_folder/extrovent.sql
mysql -u extrovent -p extrovent < /var/www/extrovent/backend/migrations/create_user_sessions_table.sql
```

> Note: tables use unprefixed names (`users`, `events`, `business_profile`, ...). If your server DB was built from the old dump, `php migrate.php` runs `rename_outdoorbuddy_prefix.sql` to rename them automatically (idempotent — fresh installs are a no-op).

Verify:

```bash
mysql -u extrovent -p -e "SHOW TABLES FROM extrovent;" | grep -E 'user_sessions|login_attempts|blacklisted_tokens|users'
```

---

## 4. Backend (`/api`)

```bash
cd /var/www/extrovent/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
nano .env
```

Production `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=extrovent
DB_USER=extrovent
DB_PASS=CHANGE_ME_STRONG

APP_ENV=production
APP_DEBUG=false
APP_URL=https://extrovent.mikael.my
APP_TIMEZONE=Asia/Kuala_Lumpur

JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
JWT_EXPIRATION=86400
REFRESH_TOKEN_EXPIRATION=2592000

CORS_ALLOWED_ORIGINS=https://extrovent.mikael.my

UPLOAD_DIR=/var/www/extrovent/backend/uploads
MAX_FILE_SIZE=5242880
```

Generate the secret separately (do not paste the literal `$(...)`):

```bash
openssl rand -base64 48
```

Permissions:

```bash
sudo mkdir -p /var/www/extrovent/backend/uploads /var/www/extrovent/backend/storage
sudo chown -R www-data:www-data /var/www/extrovent/backend/uploads /var/www/extrovent/backend/storage
sudo chmod -R 775 /var/www/extrovent/backend/uploads /var/www/extrovent/backend/storage
sudo chown -R $USER:www-data /var/www/extrovent/backend
sudo chmod 640 /var/www/extrovent/backend/.env
```

Test PHP-FPM is serving (adjust `php8.3-fpm` to your version):

```bash
curl -s http://localhost:8080/api/health || php -S 127.0.0.1:8080 -t /var/www/extrovent/backend/public &
```

---

## 5. Frontend (Vite build)

Build on the server (or locally and copy `dist/` up):

```bash
cd /var/www/extrovent/extrovent_web
cat > .env.production <<'EOF'
VITE_API_URL=https://extrovent.mikael.my/api
EOF
npm ci
npm run build
```

Output goes to `extrovent_web/dist/`. Nginx will serve this directory directly.

> Rebuilding is required whenever `VITE_API_URL` changes — it is baked in at build time. `http://localhost/api` (dev default) will not work from the public domain.

---

## 6. Nginx vhost (both options)

`/etc/nginx/sites-available/extrovent`:

```nginx
server {
    listen 80;
    server_name extrovent.mikael.my;

    root /var/www/extrovent/extrovent_web/dist;
    index index.html;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — direct FastCGI pass, no rewrite.
    # index.php strips the /api/ prefix itself, so keep the original
    # REQUEST_URI intact (fastcgi_params already sets it to $request_uri).
    # Same pattern as netvid.conf — do NOT use regex + alias here.
    location /api/ {
        include             fastcgi_params;
        fastcgi_pass        unix:/run/php/php8.3-fpm.sock;
        fastcgi_param       SCRIPT_FILENAME /var/www/extrovent/backend/public/index.php;
        fastcgi_param       SCRIPT_NAME     /index.php;
        client_max_body_size 6M;
    }

    # Block hidden files (.env, .git, etc.)
    location ~ /\. {
        deny all;
    }

    access_log /var/log/nginx/extrovent_access.log;
    error_log  /var/log/nginx/extrovent_error.log;
}
```

Enable:

```bash
# adjust php-fpm sock version first: ls /run/php/
sudo ln -sf /etc/nginx/sites-available/extrovent /etc/nginx/sites-enabled/extrovent
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Test with `sudo nginx -t`. If `/api/*` still 500s, check `sudo tail -20 /var/log/nginx/extrovent_error.log` — a sock-name mismatch (`ls /run/php/`) or PHP fatal is the usual cause, not the location block.

---

## 7A. Option A — Cloudflare Tunnel (matches your existing DNS, recommended)

No port forwarding, no Certbot. TLS terminates at Cloudflare.

On the Ubuntu server:

```bash
# Install cloudflared (Ubuntu 22.04/24.04, amd64)
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
```

In Cloudflare Zero Trust dashboard → Networks → Tunnels → your tunnel `a59068cb-...` → Configure → Public Hostnames, add:

```
Hostname: extrovent.mikael.my
Service:   http://localhost:80
```

Or from a machine already logged in:

```bash
cloudflared tunnel login
cloudflared tunnel route dns a59068cb-6324-43f0-8662-4d859361bfc4 extrovent.mikael.my
```

Minimal `/etc/cloudflared/config.yml` if running manually:

```yaml
tunnel: a59068cb-6324-43f0-8662-4d859361bfc4
credentials-file: /etc/cloudflared/a59068cb-6324-43f0-8662-4d859361bfc4.json
ingress:
  - hostname: extrovent.mikael.my
    service: http://localhost:80
  - service: http_status:404
```

Run as service:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared --no-pager
```

Your existing DNS record (`CNAME extrovent -> <tunnel-id>.cfargotunnel.com`, Proxied) is exactly what this needs. Just press **Save** in the Cloudflare DNS editor.

---

## 7B. Option B — Direct Nginx + Let's Encrypt (instead of Tunnel)

Only if you want the server to terminate TLS itself:

1. Change Cloudflare DNS: delete the Tunnel CNAME, add:
   ```
   A extrovent -> <server-public-IP> (Proxied OFF / DNS-only during issuance)
   ```
2. Issue cert:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d extrovent.mikael.my
   ```
3. Flip Cloudflare back to Proxied ON after issuance if you want CDN/WAF.

---

## 8. Verify

```bash
curl -s http://localhost/api/health
# {"success":true,"data":{"status":"ok",...}}

curl -sk https://extrovent.mikael.my/api/health
curl -s https://extrovent.mikael.my/ | head -20
```

Browser checks:

- `https://extrovent.mikael.my/` loads SPA
- Login → calls `POST https://extrovent.mikael.my/api/auth/login`
- Uploads serve via `GET /api/media/<type>/<file>`

Useful logs:

```bash
sudo tail -f /var/log/nginx/extrovent_error.log
sudo journalctl -u php8.3-fpm -f
sudo journalctl -u cloudflared -f   # Option A only
sudo tail -f /var/log/mysql/error.log
```

---

## 9. Common failures

| Symptom | Fix |
|---|---|
| `404 Endpoint not found` on `/api/*` | Nginx is not passing `REQUEST_URI` intact, or `/api/` prefix rewrite wrong. `index.php:569` strips exactly one leading `api/`. Check `fastcgi_param REQUEST_URI $request_uri;` |
| `502 Bad Gateway` from Nginx | Wrong `php-fpm.sock` version. `ls /run/php/` and match vhost. `sudo systemctl status php*-fpm` |
| CORS errors in browser | `CORS_ALLOWED_ORIGINS=https://extrovent.mikael.my` (no trailing slash), restart not needed (read per-request) |
| Login works locally, fails publicly | Frontend built with `VITE_API_URL=http://localhost/api`. Rebuild with production URL |
| `SQLSTATE[HY000] [1045]` | Wrong `DB_USER`/`DB_PASS` in `backend/.env`, or user not granted on `extrovent.*` |
| Missing `user_sessions` / `blacklisted_tokens` | Re-run the migrations import in §3 |
| Tunnel `ERR` / DNS works but no response | `cloudflared` not running, or Public Hostname service points at wrong port. Must match Nginx `listen 80` |
| Uploads 500 / permission denied | `chown www-data:www-data uploads/ storage/` + `chmod 775` (§4) |
| `APP_DEBUG=true` in prod | Set `false` — error responses leak internals |

---

## 10. Updating

```bash
cd /var/www/extrovent
git pull
cd backend && composer install --no-dev --optimize-autoloader
cd ../extrovent_web && npm ci && npm run build
sudo systemctl reload php8.3-fpm nginx
# Tunnel needs no reload on code change
```
