#!/usr/bin/env node
// Generate 10 ASADO Express social-media banners via gpt-image-2 @ high
// (locked per ~/.claude/rules/visual-assets.md). Outputs to assets/social/.
//
// Usage:  ./scripts/with-openai-key.sh node scripts/generate-social-banners.js
//
// Mix of square (IG/FB feed) and 2:3 portrait (IG story / FB story).
// Cost: ~$0.21 per square, ~$0.165 per portrait → 10 banners ≈ $2.00.

import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'social');

const MODEL = 'gpt-image-2';
const QUALITY = 'high';
const ENDPOINT = 'https://api.openai.com/v1/images/generations';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY missing'); process.exit(1); }

// Brand DNA repeated across every prompt so the set reads as one campaign
const BRAND_DNA = [
  'Brand: ASADO Express Paphos — kosher Argentinian-Mediterranean restaurant, family-run.',
  'Color palette: deep teal (#073329 / #0E4D40), cream (#F5EFE3), warm terracotta accent (#C46A3B).',
  'Typography for any rendered text: bold serif headline (similar to Fraunces, italic optional), generous letter-spacing, perfect kerning.',
  'Editorial food-magazine aesthetic, Bon Appetit / Eater quality. Hyper-detailed, ultra-sharp.',
  'No watermarks. No URL bars. No fake logos. Real, edible-looking food.',
].join(' ');

const banners = [
  {
    slug: '01-hero-mantra-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Overhead 45-degree shot of a kraft-paper bowl filled with creamy hummus topped with slow-cooked Argentinian asado short rib, a swirl of golden olive oil, and fresh chimichurri herbs. Bowl sits on a warm cream linen surface, sunlit from the side, slight steam.
Top-left of frame: bold italic serif headline in two lines, set in deep teal:
"ARGENTINIAN FIRE.
MEDITERRANEAN SOUL."
Bottom-right small uppercase line in terracotta letter-spaced 0.2em: "NOW IN PAPHOS · ALKMINIS 29".
Composition: rule-of-thirds, food right side, type top-left. Crisp readable letterforms.`,
  },
  {
    slug: '02-opening-now-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Modern Mediterranean restaurant interior — wooden chairs, light pine tables, two black self-order kiosks, warm afternoon sun pouring through floor-to-ceiling windows. A cluster of mint-green and white balloons in the corner. The room is full of happy diners — couples, families, friends — eating from kraft-paper bowls of meat and rice. Candid, real-feeling, photorealistic.
Centered overlay: bold italic serif headline in cream on a 60%-opacity dark teal vignette band:
"OPEN NOW · PAPHOS"
Below in small uppercase terracotta: "ALKMINIS 29 · STRICTLY KOSHER".`,
  },
  {
    slug: '03-bowls-grid-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Top-down flat-lay grid of EXACTLY four kraft-paper bowls arranged in a 2x2 layout on a warm cream linen surface. Bowls contain: (top-left) creamy hummus with chimichurri, (top-right) slow-cooked beef asado over rice with salad, (bottom-left) golden chicken schnitzel sliced over saffron rice with diced Israeli salad, (bottom-right) hand-rolled lamb-and-beef kebabs over grilled vegetables. Sunlit from the upper left. Slight shadow under each bowl.
Center of frame: bold italic serif headline set in deep teal on a small cream rounded panel:
"8 BOWLS,
ONE KOSHER KITCHEN."
Bottom edge tiny uppercase terracotta: "ASADO EXPRESS · PAPHOS".`,
  },
  {
    slug: '04-pita-fire-portrait',
    size: '1024x1536',
    prompt: `${BRAND_DNA}
Vertical 2:3 portrait — Instagram Story / Facebook Story format. Hero close-up of a Cypriot pita freshly off the fire, paper-wrapped halfway in branded ASADO craft paper with Coca-Cola logo print, fillings spilling out: slow-cooked beef asado, grilled red peppers, pickled cabbage, chimichurri. Set on a warm cream surface with a subtle blur of a flame in the background.
Top of frame: oversized bold italic serif headline, deep teal:
"PITA.
OFF THE FIRE."
Bottom of frame: small uppercase terracotta letter-spaced: "PAPER-WRAPPED. FIVE MINUTES FROM THE HARBOUR."`,
  },
  {
    slug: '05-schnitzel-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Overhead shot of a kraft-paper round bowl: golden breaded chicken schnitzel sliced into thick strips arranged across saffron-yellow rice, with diced Israeli salad (cucumber, tomato, parsley), pickled red cabbage, and a drizzle of tahini. Set on a warm cream marble surface, sun-side-lit.
Right side of frame: bold italic serif headline in deep teal stacked tightly:
"GOLDEN
HOUR.
EVERY HOUR."
Bottom-left tiny uppercase terracotta: "CHICKEN SCHNITZEL · €16".`,
  },
  {
    slug: '06-burger-mood-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Moody dark restaurant interior shot, low warm tungsten light, slate stone serving board. Hero burger: a brioche bun stacked with slow-cooked pulled-beef short rib crowned with chimichurri, fresh red pepper, served beside a small kraft tray of golden hand-cut fries. Background out of focus, deep teal and warm brown bokeh.
Bottom-right of frame: bold italic serif headline in cream:
"THE PULLED-BEEF
BURGER · €18"
Bottom-left small uppercase terracotta: "ASADO EXPRESS · PAPHOS".`,
  },
  {
    slug: '07-family-run-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Documentary kitchen action shot — a chef's hands in black food-prep gloves carefully placing slices of slow-cooked beef onto a warm Cypriot pita on branded ASADO craft paper with Coca-Cola print. Stainless steel prep counter, kraft bowls in the background, soft warm light. Photorealistic, slight motion blur on the hands.
Bottom of frame: bold italic serif headline in cream on a 50% deep-teal gradient band:
"FAMILY-RUN.
SINCE LIMASSOL."
Top-right tiny terracotta: "TWO HARBOURS, ONE KITCHEN".`,
  },
  {
    slug: '08-two-harbours-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Editorial illustrated postcard-style map of the southern Cyprus coast, hand-drawn fine line-art on warm cream paper. Two harbour cities marked with small terracotta dots and small italic serif labels: "LIMASSOL · OLD PORT" on the right side of the map, "PAPHOS · ALKMINIS 29" on the left side, connected by a dashed terracotta route line that curves gently along the coast. About two-thirds of the way along the route, draw a small charming hand-illustrated white delivery van seen in three-quarter profile, tiny but characterful, simple flat color (cream body, teal accents, terracotta wheel hubs) — clearly a delivery van traveling between the two cities. Add a small pencil-sketched compass rose in the top-right corner. NO logos, NO brand marks, NO cow icons, NO fake brand symbols — just the map, the route, the van, and the two city labels.
Top of frame: bold italic serif headline in deep teal:
"TWO HARBOURS.
ONE KITCHEN."
Bottom-right tiny uppercase letter-spaced 0.2em terracotta: "ASADO NICE TO MEAT · STRICTLY KOSHER".`,
  },
  {
    slug: '09-hebrew-kosher-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1) targeting Israeli/Hebrew-speaking diners. Overhead shot of a kraft-paper bowl: creamy hummus topped with golden olive oil, chimichurri, and tender slow-cooked beef. Set on a warm cream linen surface with two pieces of fresh Cypriot pita beside it.
Right side of frame: large Hebrew text in bold serif, deep teal — perfect Hebrew letterforms (right-to-left), well-kerned, no broken glyphs:
"בכשרות
מהודרת"
Below in smaller Hebrew, terracotta:
"אלקמיניס 29 · פאפוס"
Bottom-left tiny English uppercase: "ASADO EXPRESS · STRICTLY KOSHER".
CRITICAL: Hebrew text must be perfectly legible, no spelling errors, correct right-to-left direction. The word for "kosher" must read "כשרות" exactly.`,
  },
  {
    slug: '10-whatsapp-order-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post (1:1). Top-down flat-lay: three kraft-paper bowls arranged in a triangular composition — hummus with asado, chicken schnitzel bowl, hand-rolled kebab bowl — on a warm cream linen surface. Beside them, a smartphone showing a green WhatsApp chat conversation (screen content blurred, just the green WhatsApp header recognizable). Sunlit, photorealistic.
Top of frame: bold italic serif headline in deep teal:
"ORDER ON
WHATSAPP."
Below the headline in tabular monospaced uppercase terracotta letter-spaced: "+357 97 660007".
Bottom-right tiny uppercase cream-on-teal pill: "ASADO EXPRESS · PAPHOS".`,
  },
];

async function ensureDir() { try { await mkdir(OUT_DIR, { recursive: true }); } catch {} }
async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function generate(banner) {
  const out = join(OUT_DIR, `${banner.slug}.png`);
  if (await exists(out)) { console.log(`SKIP (exists) ${banner.slug}`); return true; }
  console.log(`→ ${banner.slug} · ${banner.size}`);
  const t0 = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      quality: QUALITY,
      size: banner.size,
      prompt: banner.prompt,
      n: 1,
    }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) {
    console.error(`FAIL ${banner.slug} ${res.status} ${res.statusText}`);
    console.error((await res.text()).slice(0, 400));
    return false;
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) { console.error(`FAIL ${banner.slug} no b64_json`); return false; }
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${banner.slug} · ${ms}ms`);
  return true;
}

await ensureDir();
let ok = 0, fail = 0;
const start = Date.now();
for (const b of banners) {
  // sequential to be polite + easier debugging
  // eslint-disable-next-line no-await-in-loop
  const r = await generate(b);
  r ? ok++ : fail++;
}
console.log(`\nDone. ${ok}/${banners.length} ok, ${fail} failed, ${(Date.now()-start)/1000}s total. Cost ~$${(ok * 0.21).toFixed(2)}.`);
process.exit(fail > 0 ? 1 : 0);
