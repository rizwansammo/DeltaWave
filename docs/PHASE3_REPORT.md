# Phase 3 report: production deployment, enquiries and email

**Status: Partially complete — awaiting prerequisites from DeltaWave.** The website and CMS are live at **https://www.deltawave.tech** from a pinned GHCR image, with HTTPS, backups and the stored-enquiry workflow in place. Online enquiries, outgoing email and R2 media storage are built and tested but switched off until DeltaWave supplies the items under [Waiting for DeltaWave](#waiting-for-deltawave). Nothing claims to work that was not verified; each check is listed under [Verification](#verification).

## What Phase 3 adds

- **Stored enquiries.** Every valid contact-form submission is saved in the CMS (**Administration → Enquiries**) *before* anyone is emailed. The visitor is told the truth: "received and our team has been notified" only when the mail server accepted the notification, otherwise "saved and our team will review it". If the enquiry cannot be saved, the visitor is asked to email instead, and nothing is sent.
- **No duplicates.** Each form load carries a random submission id; a retried or double-clicked submission is recognised and neither stored nor emailed twice (unique `submissionKey`, a SHA-256 of the id).
- **Administrators only.** Visitors and editors cannot list, open, change or delete enquiries, enforced by the collection's access rules on the server (`cms/collections/Enquiries.ts`). Nobody can create one through the CMS API, administrators included; only the contact form route can. The visitor's own words are read-only in the admin; staff can change the status and add internal notes.
- **Email & enquiries settings** (Site settings, last tab, administrators only): accept enquiries online (off by default), email new enquiries, sender name and address (restricted to `MAIL_ALLOWED_SENDER_DOMAINS`), primary and up to five additional receivers, reply-to-visitor and the subject prefix. Anonymous reads of Site settings never include these fields. A **Send test email** button sends one fixed message to the published receiver (administrators only, once a minute). The SMTP server and password are environment variables and never appear in the CMS.
- **One mail transport.** Payload's nodemailer adapter (`lib/mail.ts`) sends both enquiry notifications and password-reset emails. In production without SMTP settings nothing is sent and nothing is logged except a warning (no message bodies, no reset tokens).
- **Media storage.** Cloudflare R2 through `@payloadcms/storage-s3` when the `R2_*` variables are set (`lib/storage.ts`); otherwise uploads stay in the persistent `deltawave_media` volume.
- **Security headers.** A Content-Security-Policy in production (`next.config.ts`): only this site, Cloudflare Turnstile and, if configured, the R2 public origin; no `eval`, no plugins, no framing by other sites, forms post only here. Rate limits in Nginx for sign-in, password reset and enquiry submissions, in addition to the application's own limit. The application trusts only `X-Real-IP`, which Nginx always overwrites.
- **Privacy notice revision** saved as a **draft** of the privacy page (`scripts/privacy-draft.ts`): it describes enquiry storage and contains a placeholder for the retention period that DeltaWave must decide. It is never published automatically.
- **Production image and deployment** as below.

## How production is built and deployed

```
git push (main) ──► GitHub Actions "Build image"
                     1. type-check, lint, unit tests
                     2. docker build ──► ghcr.io/rizwansammo/deltawave:sha-<commit>
                                          (digest in the run summary)
owner/operator ──► /opt/DeltaWave/.env  DELTAWAVE_IMAGE=ghcr.io/rizwansammo/deltawave@sha256:…
                ──► docker compose pull app && docker compose up -d app
Nginx (www.deltawave.tech, TLS) ──► 127.0.0.1:3077 ──► app container ──► db container
```

Publishing an image never deploys it. The server runs exactly the digest written in `/opt/DeltaWave/.env`, never a moving tag, and the image is never built on the server.

### Files on the server (`/opt/DeltaWave`, root only)

| Path | Purpose |
| --- | --- |
| `docker-compose.yml` | Copy of `deploy/docker-compose.yml`: Compose project `deltawave`, network `deltawave_net`, volumes `deltawave_db` and `deltawave_media` |
| `.env` | `DELTAWAVE_IMAGE` (pinned digest) and `DELTAWAVE_PORT=3077` |
| `.env.db` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` for the stack's own PostgreSQL |
| `.env.app` | Application settings; names in `deploy/env.app.example` |
| `bin/backup.sh` | Copy of `deploy/backup.sh` |
| `backups/` | Nightly database dumps and media archives, 14 days |
| `deploy-history.log` | One line per deployment: time and digest |
| `preflight/` | The container list recorded before Phase 3 |

Nginx: `/etc/nginx/sites-available/deltawave.tech` (from `deploy/nginx/deltawave.tech.conf`, enabled by a symlink) and `/etc/nginx/snippets/deltawave-proxy.conf`. Certificate: `/etc/letsencrypt/live/deltawave.tech/` (webroot `/var/www/deltawave-acme`, renewed by the existing certbot timer, reloads Nginx after renewal).

### Environment variables (`.env.app`)

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL`, `PAYLOAD_SECRET` | Everything | Generated on the server; never printed |
| `SITE_INDEXABLE` | Search engines | `false` until DeltaWave approves indexing; read at runtime |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Enquiry form | Without both the form stays closed |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | All email | Port 587 uses STARTTLS (required); 465 uses TLS |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Default sender | The SMTP account must be allowed to send as this address |
| `MAIL_ALLOWED_SENDER_DOMAINS` | Sender field in the CMS | Comma-separated; default `deltawave.tech` |
| `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | Media in R2 | Optional; all but `R2_PUBLIC_URL` together |

`NEXT_PUBLIC_SITE_URL` is fixed in the image at build time (`https://www.deltawave.tech`).

## Operations

All commands run as root in `/opt/DeltaWave` and touch only the `deltawave` Compose project. Never run `docker compose down -v`, global prune commands, or Compose commands from another directory.

**Deploy a new version**

1. Push to `main` (or run the workflow manually) and wait for the green run. Copy the digest from the run summary.
2. On the server:
   ```sh
   cd /opt/DeltaWave
   bin/backup.sh
   sed -i "s|^DELTAWAVE_IMAGE=.*|DELTAWAVE_IMAGE=ghcr.io/rizwansammo/deltawave@sha256:<digest>|" .env
   docker compose pull app
   docker compose run --rm app node node_modules/payload/bin.js migrate
   docker compose up -d app
   echo "$(date -u +%FT%TZ) $(grep ^DELTAWAVE_IMAGE= .env)" >> deploy-history.log
   curl -fsS http://127.0.0.1:3077/api/enquiry && curl -fsSI https://www.deltawave.tech/ | head -1
   ```

**Roll back** to the previous digest (from `deploy-history.log`) with the same `sed`, `pull` and `up -d app`. Migrations are additive, so an older image runs against a newer database. If a migration itself must be undone, restore the backup taken before the deployment (below). Never roll back by deleting volumes.

**Logs and health**

```sh
docker compose ps
docker compose logs --tail 200 app
tail -f /var/log/nginx/deltawave.error.log
curl -fsS http://127.0.0.1:3077/api/enquiry
```

**Backups** run nightly from `/etc/cron.d/deltawave-backup` (log: `/var/log/deltawave-backup.log`). Copy the newest `db-*.dump` and `media-*.tgz` off the server regularly; a backup on the same disk does not survive the loss of the server.

**Restore** (stops the website for a minute):

```sh
cd /opt/DeltaWave
docker compose stop app
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --if-exists deltawave_restore && createdb -U "$POSTGRES_USER" deltawave_restore'
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d deltawave_restore --no-owner' < backups/db-<stamp>.dump
# check deltawave_restore, then swap it in:
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "ALTER DATABASE deltawave RENAME TO deltawave_old" -c "ALTER DATABASE deltawave_restore RENAME TO deltawave"'
docker compose start app
# media: docker run --rm --network none -v deltawave_media:/media -v "$PWD/backups":/backup postgres:18.6-alpine3.24 tar -xzf /backup/media-<stamp>.tgz -C /media
```

Drop `deltawave_old` only once the restored site has been checked.

**Email problems**

- *Site settings → Email & enquiries* shows whether the mail server is configured. **Send test email** reports whether the server accepted a message.
- Each enquiry records **Notification: Sent / Failed** with the reason. "Accepted by the mail server" means the SMTP server took the message; it does not prove inbox delivery.
- If messages are accepted but not received: check the receiver's spam folder, that the sender address belongs to the SMTP account, and SPF/DKIM/DMARC for the sender domain.
- `docker compose logs app | grep -i email` shows failures (enquiry id and a short reason only; never message contents).

**Admin account**

The first administrator was created from the command line (`scripts/create-admin.ts`), so the public "create first user" screen was never open on the live site. Change the initial password after the first sign-in. Use **Forgot password** only once email is configured.

## What is deployed (2026-10-16, 20:36 UTC)

| Item | Value |
| --- | --- |
| Commit | `4b4922634e9c18577db6ffefe7d401ee5ceb55e6` |
| GitHub Actions | [run 38962291232](https://github.com/rizwansammo/DeltaWave/actions/runs/38962291232): type-check, lint, unit tests and image build all passed |
| Image | `ghcr.io/rizwansammo/deltawave:sha-4b4922634e9c18577db6ffefe7d401ee5ceb55e6` |
| Digest (what runs) | `ghcr.io/rizwansammo/deltawave@sha256:39def5e4d08850f26603ffce28cdaa283a1849ce6159a23d49744cc7a74a74b4` |
| Package visibility | Public (inherited from the public repository); the server pulls anonymously with its own empty Docker config `/opt/DeltaWave/.docker`, never another project's registry login |
| Server | `/opt/DeltaWave`, containers `deltawave-app-1` and `deltawave-db-1`, app on `127.0.0.1:3077` only |
| Database | PostgreSQL 18.6 in the stack, volume `deltawave_db`, 4 migrations applied, approved content seeded |
| Media | Volume `deltawave_media` (R2 not configured) |
| TLS | Let's Encrypt, `deltawave.tech` + `www.deltawave.tech`, expires 2027-01-14, automatic renewal |
| Memory at idle | app about 206 MB (limit 640 MB), database about 60 MB (limit 384 MB) |

Later commits that change only documentation or deployment files also produce images, but the server keeps running the digest above until someone deploys a new one.

## Verification

Before deployment, on the developer machine:

- Type-check and lint: no errors (14 warnings, all `<a>` links fixed by the approved markup lock).
- Unit tests: 82 of 82 passed, including the 44-document markup lock (the public site is byte-identical to the approved markup), the enquiry workflow (24 tests: closed and unconfigured forms fail closed, storage before notification, honest messages when email fails, duplicates, header injection, IP spoofing), and access rules.
- Browser tests against a production build: 66 passed, 7 skipped (prototype parity screenshots, which need the old prototype server). New in Phase 3: enquiries and routing settings refused to visitors and editors, nobody can create enquiries through the API, an unapproved sender domain or switching enquiries on without a receiver cannot be published, the security headers are present and the admin works under the Content-Security-Policy.
- The production bootstrap (migrate, seed, privacy draft, first administrator) rehearsed on a fresh test database; the privacy page stayed published with the revision as a draft only; a second `create-admin` run was refused.

On the server and from the internet:

- Redirects: `http://deltawave.tech/`, `http://www.deltawave.tech/about` and `https://deltawave.tech/contact?x=1` all go with one 301 to the same path on `https://www.deltawave.tech`.
- Pages: `/`, `/about`, `/services`, `/solutions`, `/portfolio`, `/academy`, `/contact`, `/privacy`, `/robots.txt`, `/sitemap.xml` and `/admin/login` return 200; an unknown address returns the designed 404.
- A real browser loaded every page with no console errors, no failed requests and no broken images; every page carries `noindex, nofollow` and `robots.txt` disallows everything.
- Headers on every page: Content-Security-Policy, `Strict-Transport-Security: max-age=2592000` (this host only), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- CMS: `/admin` opens the sign-in page; `/admin/create-first-user` sends visitors to sign-in and `/cms-api/users/first-register` answers 403; anonymous `/cms-api/users` and `/cms-api/enquiries` answer 403; the public Site settings response contains no enquiry routing.
- Contact form: closed (`/api/enquiry` reports `enabled: false`, submit button disabled, the page offers the email address instead).
- Enquiry storage in production: `scripts/verify-enquiries.ts` saved a labelled test enquiry, recognised the retry as the same enquiry, recorded the notification result, and deleted the record (0 enquiries remain).
- Restart: after restarting both DeltaWave containers, users, content, media records and the 25 media files were unchanged.
- Backup and restore: the first backup ran; the dump was restored into a throwaway container without network and matched the live database row for row; the media archive holds all 25 files. The throwaway container left nothing behind.
- Other applications: the 65 other containers and the HTTPS status of every other site on the server were identical before and after (snapshots in `/opt/DeltaWave/preflight/`). Nginx was only reloaded gracefully, after `nginx -t` passed.
- Shortly after going live, an internet scanner sent 8 POST requests probing for the October 2026 Next.js server-action vulnerabilities; all were rejected with 400. The image contains the patched Next.js 16.4.1 and React 19.2.9.

## What changed on the server

Only DeltaWave's own files: `/opt/DeltaWave/` (including `bin/restore-test.sh`, which repeats the restore check), `/etc/nginx/sites-available/deltawave.tech` and its symlink in `sites-enabled`, `/etc/nginx/snippets/deltawave-proxy.conf`, `/var/www/deltawave-acme/`, the certificate under `/etc/letsencrypt/{live,archive,renewal}/deltawave.tech`, `/etc/cron.d/deltawave-backup` and `/var/log/deltawave-backup.log`. Copies of the Nginx configuration before Phase 3 and of the temporary HTTP-only stage are in `/opt/DeltaWave/preflight/`.

To take DeltaWave offline without touching anything else: `rm /etc/nginx/sites-enabled/deltawave.tech && nginx -t && systemctl reload nginx`, then `cd /opt/DeltaWave && docker compose stop`. Data stays in the volumes.

Not changed: other projects' containers, databases, volumes, networks, environment files and virtual hosts; Docker, PostgreSQL, SSH and mail services; firewall rules; global Nginx settings; DNS. Two global observations were left alone: Nginx announces its version in the `Server` header (`server_tokens` is a server-wide setting), and 56 unused Docker volumes from other projects exist (none from DeltaWave).

## Waiting for DeltaWave

1. **Initial administrator password.** On the server: `cat /opt/DeltaWave/initial-admin.txt`. Sign in at https://www.deltawave.tech/admin as `mrizwan.sammo@gmail.com`, change the password under *Account*, then `rm /opt/DeltaWave/initial-admin.txt`.
2. **Email (SMTP).** A mailbox for the website, for example `website@deltawave.tech` on MateMail (`mx.matemail.pro`, port 587), created by whoever administers deltawave.tech mail. Put `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM_ADDRESS` in `/opt/DeltaWave/.env.app`, run `docker compose up -d app`, then use **Send test email** in Site settings. Until then, password-reset emails and enquiry notifications are not sent. Also enable DKIM signing for deltawave.tech in the mail service and publish the DKIM record it generates; SPF (`include:_spf.matemail.pro`) and DMARC (`p=none`) are already in DNS and were not changed.
3. **Cloudflare Turnstile.** A widget for `www.deltawave.tech`; put `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in `.env.app` and restart the app.
4. **Privacy notice.** Decide how long enquiries are kept, replace the bracketed placeholder in the draft of the privacy page, review it with **Preview** and publish it. This must happen before enquiries are accepted online.
5. **Switch enquiries on.** After 2–4: *Site settings → Email & enquiries*: set the primary receiver, tick **Accept enquiries online**, publish. Then submit one test enquiry from the website and delete it in *Enquiries*.
6. **Search engines.** When the site may be indexed: `SITE_INDEXABLE=true` in `.env.app`, `docker compose up -d app`. Consider raising HSTS to a year at the same time (a one-line change in the Nginx virtual host).
7. **Cloudflare R2 (optional).** Bucket and API token; set the `R2_*` variables. Existing uploads in the media volume must then be copied to the bucket (not automated).
8. **Off-server backups.** Copy `/opt/DeltaWave/backups/` to storage outside this server on a schedule.
