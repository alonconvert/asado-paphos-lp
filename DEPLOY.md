# Deploy & Maintenance Guide — `asadoexpresspaphos.online`

> **For future Claude sessions**: read this top-to-bottom before doing any redeploy work. Everything you need to know about how this site is wired is here.

## TL;DR

- **Live URL**: `https://asadoexpresspaphos.online`
- **Hosting**: HostGator shared (Hatchling Plan), owned by **Shai Babani** (a friend of Alon's). This is a side-project, **not a Converty client** — keep it strictly separated from Converty (no Infisical, no Converty repos, no Converty memory entries).
- **Source of truth**: this local repo at `/Users/alonmoshe/Claude Code Projects/landing-pages/asado-paphos-lp/`
- **GitHub remote**: `alonconvert/asado-paphos-lp` (main branch)
- **Stack**: pure HTML/CSS/JS + GSAP via CDN, no build step. Multilingual via `i18n.json`.

## Hosting Setup (one-time, already done — captured here for reference)

### HostGator account & plan

| Field | Value |
|---|---|
| HostGator account holder | Shai Babani (avatar "SB" in HG dashboard) |
| Hosting plan | Hatchling — allows up to 10 sites; currently uses 2 (`s-bprojects.com` + `asadoexpresspaphos.online`) |
| cPanel username | `wanmpc4dyt5q` |
| Hosting server (IP) | `162.144.20.43` |
| Server cluster | `gateway27.websitewelcome.com` family — uses `/home4/` (not standard `/home/`) |
| Home directory | `/home4/wanmpc4dyt5q/` |
| Document root for asado site | `/home4/wanmpc4dyt5q/public_html/website_0dc53c6f/` (HostGator-generated hashed folder name) |
| SSH port | **2222** (HostGator standard for shared hosting; port 22 is firewalled) |
| Shell access | **DISABLED** on Hatchling plan — only SFTP works (sufficient for our needs) |
| SSL | Let's Encrypt via HostGator AutoSSL — auto-provisioned, auto-renews |

### SSH key (how we authenticate to HostGator without a password)

| Field | Value |
|---|---|
| Private key (Mac, NEVER share) | `~/.ssh/asado-paphos-deploy_ed25519` |
| Public key (safe to share) | `~/.ssh/asado-paphos-deploy_ed25519.pub` |
| Algorithm | ed25519 |
| Authorized on cPanel? | ✅ Yes, added via cPanel → SSH Access → Import Key, name `asado-paphos-deplo`, status: Authorized |
| Connect command | `ssh -i ~/.ssh/asado-paphos-deploy_ed25519 -p 2222 wanmpc4dyt5q@162.144.20.43` (will fail with "Shell access not enabled" — that's expected; SFTP still works) |

### Domain & DNS

| Field | Value |
|---|---|
| Domain | `asadoexpresspaphos.online` |
| Registrar | HostGator |
| Nameservers | `hgns1.hostgator.com`, `hgns2.hostgator.com` |
| A records (all type A, all → `162.144.20.43`) | `@`, `autodiscover`, `cpanel`, `ftp`, `mail`, `ssh`, `webdisk`, `webmail` |
| `@` A record TTL | 2 hours |
| `www` CNAME | → `asadoexpresspaphos.online` (root) |
| MX records | `@` → root + `@` → `mail.asadoexpresspaphos.online` |
| GDPR Masking | On |
| Domain Lock | On |
| Autorenew | On |
| Expiration | 2027-05-05 |
| Account ID | 86627600 |

## How to Redeploy (the workflow you'll use 99% of the time)

### Single-file change (e.g. fix a typo in `index.html`)

1. Edit the file locally with the Edit tool.
2. Run the SFTP upload for the changed files only:

   ```bash
   cd "/Users/alonmoshe/Claude Code Projects/landing-pages/asado-paphos-lp"

   sftp -i ~/.ssh/asado-paphos-deploy_ed25519 -P 2222 \
        -o StrictHostKeyChecking=accept-new \
        -o BatchMode=yes \
        -o LogLevel=ERROR \
        wanmpc4dyt5q@162.144.20.43 <<'EOF'
   cd public_html/website_0dc53c6f
   put index.html
   EOF
   ```

3. Commit and push the local change to git (per Alon's auto-commit rule).
4. Verify with curl: `curl -sSL https://asadoexpresspaphos.online | head`

### Multi-file change (e.g. text + image + CSS)

Same as above, but list multiple `put` lines in the heredoc. For directories, use `put -r assets/<subfolder>`.

### Full redeploy (e.g. major refactor)

Use the SFTP batch script we created:

```bash
sftp -i ~/.ssh/asado-paphos-deploy_ed25519 -P 2222 \
     -o StrictHostKeyChecking=accept-new \
     -o BatchMode=yes \
     -o LogLevel=ERROR \
     -b /tmp/asado-sftp-deploy.txt \
     wanmpc4dyt5q@162.144.20.43
```

(Contents of `/tmp/asado-sftp-deploy.txt` — recreate if missing:)

```
cd public_html/website_0dc53c6f
lcd "/Users/alonmoshe/Claude Code Projects/landing-pages/asado-paphos-lp"
put .htaccess
put animations.js
put i18n.js
put i18n.json
put index.html
put social.html
put styles.css
put -r assets
ls -la
```

⚠️ **Note**: full redeploy moves ~113 MB / 301 files via plain SFTP — takes ~6 minutes on residential broadband. Don't kill the process mid-transfer.

## What's where in the source

| File / folder | Purpose |
|---|---|
| `index.html` | The single-page LP (multilingual via `data-i18n` attributes) |
| `social.html` | Separate page for social-media banner generation |
| `styles.css` | All styling |
| `animations.js` | GSAP-driven scroll animations |
| `i18n.json` | All translatable text — 7 languages: EN / HE / AR / EL / RU / FR / IT |
| `i18n.js` | Runtime that swaps text on language change |
| `assets/` | Images, video, social banners, gallery frames, etc. |
| `assets/images/` | Primary dish photos (PNG + WebP versions) |
| `assets/social/` | 27 social-media banners (square + portrait) |
| `assets/video/` | MP4 videos + poster JPGs |
| `assets/gallery-frames/` | Customer photos + extracted video frames |
| `.htaccess` | Apache config — security headers, clean URLs, gzip, asset caching |
| `vercel.json` | Legacy Vercel config (still works there too — see below) |
| `scripts/` | Image generation tooling (gpt-image-2 wrappers) — NOT deployed to server |

## Image regeneration

Dish photos are AI-generated via `gpt-image-2` at `quality: high` (locked per `~/.claude/rules/visual-assets.md`). Regen commands:

```bash
./scripts/with-openai-key.sh node scripts/generate-images.js --smoke           # 1 hero (~$0.21)
./scripts/with-openai-key.sh node scripts/generate-images.js --all             # all 12 (~$2.50)
./scripts/with-openai-key.sh node scripts/generate-images.js --only=asado-bowl,kebab-bowl
```

The script skips files that already exist. Delete the .png locally to force regen.

## Cache-busting (important when replacing images)

`.htaccess` sets `Cache-Control: max-age=31536000, immutable` on all images, video, fonts. This is great for performance but means **replacing an image with the same filename won't be visible to existing visitors until their browser cache expires (1 year)**.

To force users to see the new version, do ONE of:

1. **Rename on replace** (preferred): `schnitzel-bowl.png` → `schnitzel-bowl-v2.png` and update all references in `index.html` / `i18n.json` / `social.html`.
2. **Query string bust**: change references to `schnitzel-bowl.png?v=2`. Less rigorous but simpler.

CSS / JS / JSON have a 60-second cache so updates to those propagate fast — no busting needed.

## Vercel legacy

Before HostGator, this site was deployed to Vercel. Vercel deployment is **still functional** as a backup:

- Vercel project: `alonconverts-projects/asado-paphos-lp` (project ID `prj_K3USwSb3lpg5gvZHJe5wIihJqYyR`)
- Vercel CLI: `vercel --prod` (from project root)
- `vercel.json` config still applies on Vercel
- No custom domain attached on Vercel side; only auto-generated `*.vercel.app` URLs

**Decision pending** (Alon, not Claude): keep Vercel as a backup deployment, or remove `vercel.json` + delete the Vercel project to consolidate. Until decided, leave Vercel alone.

## Constraints from Alon (DO NOT violate)

These constraints were stated explicitly in the deploy session (2026-05-10):

- ❌ **No Infisical for this project** — secrets stay local on Alon's Mac (keychain or `~/.ssh/`).
- ❌ **No Converty entanglement** — no references in Converty OS repo, no Converty memory entries, no shared infrastructure.
- ❌ **No secrets in git** (this repo or any other).
- ✅ **Local Mac copy is fine** — that's the canonical source of truth.
- ✅ **GitHub remote `alonconvert/asado-paphos-lp` is fine** — public-ish, no secrets.

Future Claude sessions: respect these. Don't propose moving the SSH key to Infisical, don't propose adding asado memory entries, etc.

## Things that are NOT secrets but might look like them

When auditing this session for security report purposes:

| Looks suspicious | Actually fine | Reason |
|---|---|---|
| cPanel username `wanmpc4dyt5q` | Identifier, not credential | Visible in HG UI, low-value alone |
| Server IP `162.144.20.43` | Public DNS data | Can be discovered with one `dig` |
| Document root `/home4/wanmpc4dyt5q/public_html/website_0dc53c6f/` | Server-internal path | Not externally addressable; harmless |
| Public SSH key at `~/.ssh/asado-paphos-deploy_ed25519.pub` | Designed to be public | The whole point of asymmetric crypto |
| HostGator nameservers `hgns1/hgns2.hostgator.com` | Public DNS data | In every WHOIS record |

## Common gotchas

1. **DNS propagation is slow on HostGator.** Their UI can show a record change as effective, but `hgns1`/`hgns2` may take many minutes (HG quotes "up to 24-48 hours") to actually serve the new value. Don't redeploy if the issue is DNS — just wait.
2. **`lftp` doesn't work for SFTP-with-key on this setup** — its `sftp:connect-program` config gets eaten by shell quoting. Use plain `sftp -i KEY -P PORT` instead. Sequential but reliable.
3. **`rsync` over SSH won't work** because shell access is disabled. Use SFTP `put` / `put -r`.
4. **The "post-quantum key exchange" warning** in SSH/SFTP output is informational noise. Ignore.
5. **HostGator's "Add Site" wizard** auto-creates the document root with a hashed folder name (e.g. `website_0dc53c6f`), NOT `domain.com/`. Don't try to upload to `/public_html/asadoexpresspaphos.online/` — it doesn't exist.

## Quick smoke test (after any change)

```bash
# 1. Live response check
curl -sSI --max-time 15 "https://asadoexpresspaphos.online" 2>&1 | head -10

# 2. Verify .htaccess headers are being applied
curl -sSI --max-time 15 "https://asadoexpresspaphos.online" 2>&1 | grep -iE "x-content-type|referrer|strict-transport"

# 3. Spot-check the body
curl -sSL --max-time 15 "https://asadoexpresspaphos.online" | grep -iE "<title>|asado" | head -3

# 4. Compare server vs local size of index.html
ls -la index.html
sftp -i ~/.ssh/asado-paphos-deploy_ed25519 -P 2222 -o BatchMode=yes wanmpc4dyt5q@162.144.20.43 <<EOF
ls -la public_html/website_0dc53c6f/index.html
EOF
```

## Session history

- **2026-05-03**: Initial Vercel deployment, multilingual translations, social banners.
- **2026-05-04**: Image gen polish, video frame extractions.
- **2026-05-10** (this session): Migrated from Vercel to HostGator. Created HostGator addon site for `asadoexpresspaphos.online`, generated ed25519 SSH keypair, authorized public key in cPanel, uploaded full site (113 MB / 301 files) via SFTP, wrote `.htaccess` to replace `vercel.json`, verified site live via direct-IP check + .htaccess headers + HTTPS HTTP/2 200. DNS propagation pending at session-close (HG internal sync delay).
