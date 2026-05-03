# ASADO Express Paphos · Landing Page

Single-page multilingual landing page for the new ASADO Express branch in Paphos, Cyprus.

- **Address**: Alkminis 29, 8041 Paphos
- **Phone**: +357 97 660007
- **Languages**: EN · HE · AR · EL · RU · FR · IT (RTL flip on HE/AR)
- **Stack**: Pure HTML / CSS / vanilla JS · GSAP via CDN · zero build step

## Local preview

```bash
open index.html
# or, for live-reload during edits:
python3 -m http.server 4173
open http://localhost:4173
```

## Regenerating dish photography

All dish photos are generated via `gpt-image-2` at `high` quality (locked per
`~/.claude/rules/visual-assets.md`).

```bash
./scripts/with-openai-key.sh node scripts/generate-images.js --smoke    # 1 hero (~$0.21)
./scripts/with-openai-key.sh node scripts/generate-images.js --all      # all 12 (~$2.50)
./scripts/with-openai-key.sh node scripts/generate-images.js --only=asado-bowl,kebab-bowl
```

Skips files that already exist. Delete the .png to regenerate.

## Deploy

```bash
vercel --prod
```

The `vercel.json` sets long-lived cache for `assets/`, sane security headers, and `cleanUrls`.

## i18n notes

- All copy lives in `i18n.json`. EN is canonical; the other 6 are first-pass translations.
- Greek and Russian copy is flagged for native-speaker review (best-effort by Claude).
- Add a language by appending to `i18n.json`, the `LANGS` array in `i18n.js`, and a `<li>` in the menu.
