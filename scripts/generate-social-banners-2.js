#!/usr/bin/env node
// Banners 11-30 — second batch. Same gpt-image-2 @ high lock.
// Usage:  ./scripts/with-openai-key.sh node scripts/generate-social-banners-2.js
// Cost: ~$0.21 per square × 20 ≈ $4.20.

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

const BRAND_DNA = [
  'Brand: ASADO Express Paphos — kosher Argentinian-Mediterranean restaurant, family-run.',
  'Color palette: deep teal (#073329 / #0E4D40), cream (#F5EFE3), warm terracotta accent (#C46A3B).',
  'Typography for any rendered text: bold serif headline (similar to Fraunces, italic optional), generous letter-spacing, perfect kerning.',
  'Editorial food-magazine aesthetic, Bon Appetit / Eater quality. Hyper-detailed, ultra-sharp.',
  'No watermarks. No URL bars. No fake logos. Real, edible-looking food.',
].join(' ');

const banners = [
  {
    slug: '11-asado-shortrib-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square Instagram post. Overhead 45-degree of a kraft-paper bowl: glistening slow-cooked Argentinian beef short rib chunks over fluffy white rice with a vibrant green chimichurri swirl, pickled red cabbage on the side. Warm cream linen surface, sun-side-lit, soft steam rising.
Top-left bold italic serif in deep teal:
"ASADO.
SHORT RIB,
SLOW-COOKED."
Bottom-right tiny uppercase terracotta letter-spaced 0.2em: "€17 · ASADO EXPRESS PAPHOS".`,
  },
  {
    slug: '12-friday-lunch-portrait',
    size: '1024x1536',
    prompt: `${BRAND_DNA}
Vertical 2:3 portrait — Story format. Mediterranean lunch table seen at 3/4 angle: three kraft-paper bowls (asado, schnitzel, hummus) plus two fresh pitas, a glass bottle of soda, a glass of red wine, a small bowl of olives. Sunlit dappled light through palm fronds suggests a Cyprus afternoon. Real, candid, photorealistic.
Top of frame: oversized bold italic serif headline in cream on a 50% deep-teal vignette:
"LUNCH.
EVERY FRIDAY."
Bottom of frame small uppercase terracotta: "ALKMINIS 29 · OPEN 11:00 – 15:00".`,
  },
  {
    slug: '13-kebab-handrolled-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Overhead close-up of three plump hand-rolled lamb-and-beef kebabs sizzling over a charcoal grill, char marks visible, with a dusting of sumac and a sprig of fresh parsley. Cinematic warm light, smoke wisps in background. Photorealistic.
Bottom-right bold italic serif in cream on a 50%-opacity dark vignette:
"HAND-ROLLED.
EVERY MORNING."
Top-left tiny uppercase terracotta: "KEBAB · €17 · ASADO PAPHOS".`,
  },
  {
    slug: '14-jerusalem-mix-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Overhead of a kraft bowl: classic Jerusalem mix (me'urav yerushalmi) — chicken hearts, livers, sliced onion, peppers all glistening with cumin and oil over fluffy rice. Warm cream surface, soft side-light.
Right side bold italic serif in deep teal stacked tight:
"JERUSALEM
MIX."
Bottom-left tiny uppercase terracotta letter-spaced: "ME'URAV · €17 · ASADO PAPHOS".`,
  },
  {
    slug: '15-hummus-chimichurri-macro',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Tight macro overhead of fresh hummus in a kraft bowl — visible swoops, a perfect well in the center filled with vibrant green chimichurri, golden olive oil pooling, a sprinkle of paprika and pine nuts. Warm cream linen, soft sun-side-light. Photorealistic, hyper-detailed.
Top-right bold italic serif in deep teal:
"HUMMUS.
CHIMICHURRI.
NEVER FROZEN."
Bottom tiny uppercase terracotta: "FRESH-PRESSED, TWICE DAILY".`,
  },
  {
    slug: '16-built-to-order-portrait',
    size: '1024x1536',
    prompt: `${BRAND_DNA}
Vertical 2:3 portrait. Documentary kitchen action — a chef's gloved hand holds a kraft bowl mid-build, ladling tabbouleh next to slow-cooked beef onto saffron rice. Stainless steel prep counter blurred behind. Slight motion blur on the hand. Photorealistic.
Top bold italic serif in cream on dark vignette:
"BUILT
TO ORDER."
Bottom small uppercase terracotta: "EVERY BOWL · ASADO EXPRESS PAPHOS".`,
  },
  {
    slug: '17-bring-the-kids-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Modern restaurant patio: a family of four (parents and two children, mid-meal, candid laughing) seated at a light-pine table with kraft bowls of food. Mint-green and white balloons in soft focus background. Warm afternoon light. Photorealistic, real-feeling.
Top-left bold italic serif in cream on subtle dark vignette:
"BRING
THE KIDS."
Bottom-right tiny uppercase terracotta: "FAMILY-RUN · KOSHER · PAPHOS".`,
  },
  {
    slug: '18-tahini-drizzle-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Macro tight shot of pale silky tahini being drizzled in a slow ribbon from above onto a roasted eggplant half on a kraft tray, the ribbon caught mid-air, shallow depth of field. Photorealistic, frozen motion.
Bottom-right bold italic serif in deep teal:
"FRESH TAHINI,
EVERY HOUR."
Top-left tiny uppercase terracotta: "ASADO EXPRESS · ALKMINIS 29".`,
  },
  {
    slug: '19-bring-the-table-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Top-down communal table shot — six pairs of hands reaching from the edges of frame toward six kraft bowls and three fresh pitas in the center, glasses of soda, a small dish of pickles. The hands are diverse, gestures suggest sharing. Warm cream linen, sun-side-lit.
Center small bold italic serif in deep teal on a tight cream rounded panel:
"BRING
THE TABLE."
Bottom-edge tiny uppercase terracotta: "ASADO PAPHOS · ORDER FOR 6+ ON WHATSAPP".`,
  },
  {
    slug: '20-patio-golden-portrait',
    size: '1024x1536',
    prompt: `${BRAND_DNA}
Vertical 2:3 portrait — Story format. Restaurant patio at golden hour, low warm sun raking across light-pine tables and black wooden chairs, white walls glowing amber, a Cyprus apartment building across the street, a couple in summer wear seated at a far table sharing a bowl. Slight bokeh on the foreground.
Top bold italic serif in cream on subtle deep-teal vignette band:
"THE PATIO
IS OPEN."
Bottom small uppercase terracotta: "ALKMINIS 29 · PAPHOS · 11:00 – 22:00".`,
  },
  {
    slug: '21-kebab-pita-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Overhead of a Cypriot pita wrap, paper-wrapped halfway in branded ASADO craft paper with a Coca-Cola logo print, fillings spilling out: hand-rolled kebab pieces, tahini drizzle, fresh tabbouleh, pickled red onion. Warm marble surface, sun-side-lit.
Top-right bold italic serif in deep teal:
"KEBAB
PITA."
Bottom-left tiny uppercase terracotta letter-spaced: "€15 · OFF THE GRILL · ASADO PAPHOS".`,
  },
  {
    slug: '22-paper-wrapped-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Hero close-up of a freshly-grilled pita wrap held in two hands, paper-wrapped in branded ASADO craft paper with Coca-Cola print clearly visible, steam rising. Warm soft natural light, slight motion blur on the steam. Photorealistic.
Bottom-left bold italic serif in cream on subtle dark vignette:
"PAPER-WRAPPED.
STILL HOT."
Top-right tiny uppercase terracotta: "FIVE MINUTES FROM THE HARBOUR".`,
  },
  {
    slug: '23-review-five-stars-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Editorial typography card on a warm cream textured paper background. A row of five terracotta-filled five-pointed stars across the top center. Below, in large bold italic serif (deep teal), a customer review pull-quote:
"Not sure if he was the
waiter or the owner —
he just kept bringing us
things to taste."
Below the quote, small uppercase terracotta letter-spaced: "— GOOGLE REVIEW · 5.0 · ASADO OLD PORT LIMASSOL".
Decorative thin terracotta hairline divider above the attribution.
NO photo, just typography. Make every letter perfectly legible.`,
  },
  {
    slug: '24-hebrew-two-harbours-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Editorial illustrated postcard map of the southern Cyprus coast, hand-drawn fine line-art on warm cream paper. Two harbour cities: Limassol on the right, Paphos on the left, dashed terracotta route line connecting them, small hand-illustrated white delivery van two-thirds along the route, tiny pencil-sketched compass rose top-right. NO logos, NO brand marks, NO cow icons.
Top of frame: large Hebrew bold serif in deep teal — perfect Hebrew letterforms (right-to-left), well-kerned, no broken glyphs:
"שני נמלים.
מטבח אחד."
Below smaller Hebrew terracotta:
"לימסול · פאפוס"
Bottom-right tiny English uppercase: "ASADO NICE TO MEAT · STRICTLY KOSHER".
CRITICAL: Hebrew text perfectly legible, no spelling errors, correct right-to-left direction.`,
  },
  {
    slug: '25-hebrew-open-now-portrait',
    size: '1024x1536',
    prompt: `${BRAND_DNA}
Vertical 2:3 portrait — Story format targeting Israeli/Hebrew speakers. Modern restaurant patio with diners enjoying meals from kraft bowls, mint-green and white balloons floating in the corner. Warm afternoon sun. Photorealistic, real-feeling.
Top bold Hebrew serif in cream on a deep-teal vignette band — perfect right-to-left Hebrew letterforms:
"פתוח עכשיו
פאפוס"
Below smaller Hebrew in terracotta:
"אלקמיניס 29 · בכשרות מהודרת"
Bottom small English uppercase terracotta: "ASADO EXPRESS · OPEN NOW".
CRITICAL: Hebrew perfect, no broken glyphs, correct RTL.`,
  },
  {
    slug: '26-loaded-fries-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Overhead of a kraft tray heaped with golden hand-cut fries crowned with slow-cooked pulled-beef asado, a drizzle of tahini, fresh parsley, pickled chili. Sunlit cream marble surface. Photorealistic.
Top-left bold italic serif in deep teal:
"LOADED FRIES.
ASADO ON TOP."
Bottom-right tiny uppercase terracotta: "€13 · ASADO EXPRESS PAPHOS".`,
  },
  {
    slug: '27-asado-cigar-square',
    size: '1024x1024',
    prompt: `${BRAND_DNA}
Square. Overhead close-up of three crispy fried asado cigars (golden filo wrapped beef rolls) on a small kraft tray, with a small terracotta dipping bowl of harissa and a sprig of mint. Warm marble surface, soft natural light.
Right side bold italic serif in deep teal stacked:
"FRIED ASADO
CIGAR."
Bottom-left tiny uppercase terracotta: "€6 · CRUNCH FIRST. CHIMICHURRI SECOND.".`,
  },
  // (RU/FR/EL banners 28-30 dropped — Hebrew + English only per Alon)
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
    body: JSON.stringify({ model: MODEL, quality: QUALITY, size: banner.size, prompt: banner.prompt, n: 1 }),
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
  // eslint-disable-next-line no-await-in-loop
  const r = await generate(b);
  r ? ok++ : fail++;
}
console.log(`\nDone. ${ok}/${banners.length} ok, ${fail} failed, ${(Date.now()-start)/1000}s. Cost ~$${(ok * 0.21).toFixed(2)}.`);
process.exit(fail > 0 ? 1 : 0);
