# Phase 3 report: production deployment, enquiries and email

**Status: Partially complete — awaiting prerequisites from DeltaWave.** The website and CMS are live at **https://www.deltawave.tech** from a pinned GHCR image, with HTTPS, backups and the stored-enquiry workflow in place. Online enquiries, outgoing email and R2 media storage are built and tested but switched off until DeltaWave supplies the items under [Waiting for DeltaWave](#waiting-for-deltawave). Nothing claims to work that was not verified; each check is listed under [Verification](#verification).

## What Phase 3 adds

- **Stored enquiries.** Every valid contact-form submission is saved in the CMS (**Administration → Enquiries**) *before* anyone is emailed. The visitor is told the truth: "received and our team has been notified" only when the mail server accepted the notification, otherwise "saved and our team will review it". If the enquiry cannot be saved, the visitor is asked to email instead, and nothing is sent.
- **No duplicates.** Each form load carries a random submission id; a retried or double-clicked submission is recognised and neither stored nor emailed twice (unique `submissionKey`, a SHA-256 of the id).
- **Administrators only.** Visitors and editors cannot list, open, change or delete enquiries, enforced by the collection's access rules on the server (`cms/collections/Enquiries.ts`). Nobody can create one through the CMS API, administrators included; only the contact form route can. The visitor's own words are read-only in the admin; staff can change the status and add internal notes.
- **Email & enquiries settings** (Site settings, last tab, administrators only): the **SMTP server** (host, port, STARTTLS or SSL/TLS, username, password) with **Test SMTP connection** and **Send test email**, then accept enquiries online (off by default), email new enquiries, sender name and address, primary and up to five additional receivers, reply-to-visitor and the subject prefix. Anonymous reads of Site settings never include these fields. See [SMTP managed in the CMS](#smtp-managed-in-the-cms).
- **One mail transport.** Enquiry notifications, test emails and Payload's password resets all go through the SMTP server configured in the CMS, read on every send (`lib/mail.ts`). Without a complete configuration nothing is sent, the reason is shown in the CMS and recorded on each enquiry, and nothing is logged except a one-line warning (no message bodies, no recipients, no reset tokens). There is no fallback to any other mail account.
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
| `CREDENTIALS_ENCRYPTION_KEY` | The SMTP password stored in the CMS | 64 hex characters, generated once on the server; never printed. Also in `/opt/DeltaWave/keys/credentials-encryption.key`. See [SMTP managed in the CMS](#smtp-managed-in-the-cms) |
| `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | Media in R2 | Optional; all but `R2_PUBLIC_URL` together |

`NEXT_PUBLIC_SITE_URL` is fixed in the image at build time (`https://www.deltawave.tech`). Email is not configured here: SMTP host, port, security, username, password, sender and receivers are all managed in the CMS.

## SMTP managed in the CMS

Administrators configure outgoing email entirely in **Site settings → Email & enquiries → SMTP server**; nobody needs to sign in to the server to change the host, port, username, password, sender or receivers.

- **Applies immediately.** **Save SMTP settings** stores the connection at once (it is separate from Save draft / Publish) and the next email uses it: the transport is created from the stored settings for every message, so there is no rebuild, no `.env.app` edit and no restart. Sender and receivers stay in the published Site settings, as before.
- **Write-only password.** The panel never receives the stored password; it only shows that one is set and when. Leaving the field empty keeps it for the same SMTP host and username; changing either requires re-entering the password, so an old credential cannot be sent to a different server. Typing a new password replaces it, **Remove SMTP settings** deletes the whole connection. The browser is told not to autofill the CMS sign-in password into it.
- **Encrypted at rest.** The password is encrypted with AES-256-GCM (fresh random IV per value, authenticated, bound to its purpose) under `CREDENTIALS_ENCRYPTION_KEY`, which exists only in the server environment, never in the database, its backups, the image or the repository. A database dump alone does not reveal the password. If the key is lost or replaced, the CMS says so and the password is simply entered again.
- **Not reachable through any API.** The connection lives in a separate store (`cms/globals/SmtpSettings.ts`) that the REST API refuses to everyone, administrators included; it has no versions or drafts, so a replaced password leaves no older copy; GraphQL is disabled. Only four administrator endpoints touch it (`cms/globals/smtp-endpoints.ts`), and none returns the password. Editors and visitors get 403. Requests from other sites are not signed in (Payload's CSRF origin check).
- **Test SMTP connection** connects, negotiates TLS and signs in without sending anything, using the values in the form (and the stored password only if the host and username are unchanged), and reports a plain reason: host not found, refused, timed out, TLS or certificate problem, or username/password rejected. Six tests per ten minutes per administrator. **Send test email** sends one fixed message, once a minute, only to the signed-in administrator or to the published primary receiver, never to an address taken from the request.
- **No probing of the server's network.** Only public mail servers are accepted: host names must be full public names (no `localhost`, single-label Docker names, `.local`, `.internal` and similar), IP addresses and every address a name resolves to must be public (private, loopback, link-local and cloud-metadata, carrier-grade NAT, Docker, multicast, reserved, IPv4-mapped and NAT64 ranges are refused), and only the SMTP ports 587, 465, 25 and 2525 are allowed. The name is resolved once and the connection goes to that checked address, while the certificate is still verified against the name (TLS 1.2 or newer, STARTTLS mandatory on 587, no plain-text option).
- **Password resets** use the same transport. The adapter never throws, so "forgot password" answers the same for existing and unknown accounts whatever the mail server does.
- **Enquiries stay closed** until all prerequisites are met: publishing *Accept online enquiries* is refused unless the SMTP connection is complete, the Turnstile keys are set, and the published privacy notice contains "How enquiries are stored" with the retention placeholder filled in. The public form additionally checks SMTP readiness on every load.
- **Sender address.** The From address is the published *Sender email*, or the SMTP username when that is empty. The earlier server-side sender-domain allowlist (`MAIL_ALLOWED_SENDER_DOMAINS`) was removed, because it would have required server access to change; the mail server itself decides which addresses the account may send as, and the test email shows its answer.

**The encryption key.** It was generated once on the server (`openssl rand -hex 32`) and is stored root-only in `/opt/DeltaWave/.env.app` and `/opt/DeltaWave/keys/credentials-encryption.key`. It is deliberately not part of the nightly backups. For disaster recovery, copy it once into DeltaWave's password manager: `cat /opt/DeltaWave/keys/credentials-encryption.key`. Restoring a database backup on a new server with the same key keeps the SMTP password working; with a new key, re-enter the password in the CMS. Do not change the key casually: a new key makes the stored password unreadable until it is entered again.

## SMTP patch verification and production rollout (2026-10-18)

The isolated SMTP branch check passed on GitHub Actions: TypeScript, lint, unit tests and production build passed; **72 browser/CMS API tests passed, 7 prototype-parity tests skipped, 0 failed**. New tests cover encrypted/password-masked storage, administrator-only access, protection against private SMTP endpoints, and preventing credential reuse when changing SMTP host or username. This verifies the code and interface; **real SMTP delivery still needs the owner to enter the mailbox credentials in the live CMS and run the connection/email test**.

**Production deployment completed (2026-10-18, 05:58 UTC):**

- Main commit: `0fea20fbcc3ca1b756e7db4f7d0264706fd04dff`; new immutable GHCR image: `ghcr.io/rizwansammo/deltawave@sha256:864e581c9ed7f9dbcf2bf0aeda71c4866568085c5690a96722a87e4c35338a60`.
- Previous image (retained for rollback): `ghcr.io/rizwansammo/deltawave@sha256:39def5e4d08850f26603ffce28cdaa283a1849ce6159a23d49744cc7a74a74b4`. The previous `.env` image selection was also preserved at `/opt/DeltaWave/preflight/env-before-cms-smtp-20261018`.
- Database and media were backed up before migration (`db-20261018T055326Z.dump`, `media-20261018T055326Z.tgz`). Migration `20261016_215553_phase3_cms_smtp` was the sole outstanding migration and completed successfully. Only the DeltaWave app container was recreated; the DeltaWave database and all other applications were left running.
- Post-deployment backups: `db-20261018T055759Z.dump` and `media-20261018T055759Z.tgz`. The isolated restore check reported **RESTORE MATCHES LIVE** for users, services, solutions, media, pages, migrations and enquiries.
- The new DeltaWave app and database were both healthy; the home page, admin login and contact page returned HTTP 200. Unauthenticated requests to the SMTP settings endpoint and encrypted storage global returned HTTP 403. The live app could load its existing credential-encryption key; no replacement key was generated. All 61 other running containers remained running.
- Online enquiries remain disabled: Turnstile has not yet been configured (`/api/enquiry` returns `{"enabled":false}`). SMTP credentials and real outbound email have **not** been tested; the owner must configure and test them through the CMS. Search indexing, R2 and off-server backup are separate outstanding owner decisions.
- This deployment made no modifications to MateMail, Nginx, other services or shared container configuration.

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

- *Site settings → Email & enquiries → SMTP server* shows the state (not configured, incomplete, ready, or a key problem) and the last connection test. **Test SMTP connection** names the failing step; **Send test email** reports whether the server accepted a message.
- Each enquiry records **Notification: Sent / Failed** with the reason. "Accepted by the mail server" means the SMTP server took the message; it does not prove inbox delivery.
- If messages are accepted but not received: check the receiver's spam folder, that the sender address belongs to the SMTP account, and SPF/DKIM/DMARC for the sender domain.
- "The stored password cannot be decrypted": the server's key changed. Enter the password again and save.
- `docker compose logs app | grep -iE "email|smtp"` shows failures and who saved SMTP settings (short reasons only; never passwords, message contents or recipients).

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

1. **Initial administrator password — completed by the owner.** The owner signed in, changed the initial password and verified deletion of `/opt/DeltaWave/initial-admin.txt`.
2. **Email (SMTP).** A mailbox for the website, for example `website@deltawave.tech` on MateMail, created by whoever administers deltawave.tech mail. Then, in the CMS only: *Site settings → Email & enquiries → SMTP server*, enter the host, port, security, username and password, **Save SMTP settings**, **Test SMTP connection**, **Send test email to me**. Until then, password-reset emails and enquiry notifications are not sent. Also enable DKIM signing for deltawave.tech in the mail service and publish the DKIM record it generates; SPF (`include:_spf.matemail.pro`) and DMARC (`p=none`) are already in DNS and were not changed. Copy the encryption key to a password manager once (see [SMTP managed in the CMS](#smtp-managed-in-the-cms)).
3. **Cloudflare Turnstile.** A widget for `www.deltawave.tech`; put `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in `.env.app` and restart the app.
4. **Privacy notice.** Decide how long enquiries are kept, replace the bracketed placeholder in the draft of the privacy page, review it with **Preview** and publish it. This must happen before enquiries are accepted online.
5. **Switch enquiries on.** After 2–4: *Site settings → Email & enquiries*: set the primary receiver, tick **Accept enquiries online**, publish. Then submit one test enquiry from the website and delete it in *Enquiries*.
6. **Search engines.** When the site may be indexed: `SITE_INDEXABLE=true` in `.env.app`, `docker compose up -d app`. Consider raising HSTS to a year at the same time (a one-line change in the Nginx virtual host).
7. **Cloudflare R2 (optional).** Bucket and API token; set the `R2_*` variables. Existing uploads in the media volume must then be copied to the bucket (not automated).
8. **Off-server backups.** Copy `/opt/DeltaWave/backups/` to storage outside this server on a schedule.
