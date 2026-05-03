#!/usr/bin/env node
// Generate ASADO Express dish photography via gpt-image-2 @ high (locked per ~/.claude/rules/visual-assets.md).
// Usage:
//   ./scripts/with-openai-key.sh node scripts/generate-images.js [--smoke|--only=hero,asado-bowl|--all]
// --smoke (default if no flag): hero only, 1 image, ~$0.21 — sanity check.
// --all: all 12 — ~$2.50.
// Outputs PNG into assets/images/<slug>.png. Skips dishes whose file already exists.

import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'images');

const MODEL = 'gpt-image-2';
const QUALITY = 'high';
const ENDPOINT = 'https://api.openai.com/v1/images/generations';

// Master style — same across every dish for consistency.
const MASTER_STYLE = [
  'Studio food photography, overhead 45-degree angle.',
  'Soft warm natural side-light, golden hour mood.',
  'Backdrop is a warm cream surface (#F5EFE3) with subtle linen texture, slight vignette.',
  'Dish is presented in a kraft-paper round bowl, warm tan, with a small dark-green leaf icon on the rim (kosher Argentinian-Mediterranean restaurant brand).',
  'Hyper-detailed, ultra-sharp focus on the food, gentle shallow depth of field on bowl rim.',
  'Vibrant authentic colors, no over-saturation, looks editable for a food magazine cover.',
  'No text, no logos, no watermarks, no human hands, no utensils sticking out unless natural.',
].join(' ');

// Per-dish compositions. Be specific enough that the AI nails the dish identity.
const DISHES = [
  {
    slug: 'hero-hummus-asado',
    size: '1536x1024',
    composition:
      'Generous swirl of creamy white hummus filling the bowl, drizzled with bright golden olive oil, topped with juicy slow-cooked Argentinian asado short-rib pieces sliced thin, garnished with finely chopped parsley, pickled red onion slivers, a sprinkle of paprika, and one whole sprig of cilantro. Steam visible. Hero composition for a restaurant landing page.',
  },
  {
    slug: 'asado-bowl',
    size: '1024x1024',
    composition:
      'Bowl of fluffy white basmati rice as the base, crowned with thick juicy sliced grilled asado beef short-rib (Argentinian style, charred edges, glistening), topped with chopped tabbouleh-style parsley salad, diced tomato, and a small wedge of charred lemon. Side of bright green chimichurri visible.',
  },
  {
    slug: 'boneless-chicken-bowl',
    size: '1024x1024',
    composition:
      'Bowl with golden saffron rice, topped with juicy grilled boneless chicken thigh pieces with charred edges, mixed Mediterranean salad of cucumber/tomato/red-onion on the side, drizzle of tahini, fresh dill garnish.',
  },
  {
    slug: 'kebab-bowl',
    size: '1024x1024',
    composition:
      'Bowl with rice base, topped with three large hand-rolled minced-lamb-and-beef kebabs (charred grill marks, juicy interior), side of grilled tomato + grilled green pepper, drizzle of tahini and a small spoon of bright red harissa, sprig of mint.',
  },
  {
    slug: 'jerusalem-mix-bowl',
    size: '1024x1024',
    composition:
      'Bowl of mixed grilled chicken hearts, livers, and spleen seasoned with cumin, turmeric, and onion (classic Israeli Jerusalem mixed grill — me\'urav yerushalmi), served over rice, topped with caramelized onions, dusting of sumac, fresh parsley, half a charred lemon.',
  },
  {
    slug: 'ribeye-entrecote-bowl',
    size: '1024x1024',
    composition:
      'Premium bowl: rice base with thick slices of medium-rare grilled ribeye entrecote steak (visible pink center, grill marks, glistening), bed of arugula, drizzle of olive oil and aged balsamic, scattered flaky sea salt, a few halved cherry tomatoes.',
  },
  {
    slug: 'hummus-asado-bowl',
    size: '1024x1024',
    composition:
      'Creamy white hummus base with a deep well in the center filled with slow-cooked asado beef pieces, drizzled with golden olive oil, topped with chopped parsley, paprika dust, sliced pickled chili, sprinkle of pine nuts.',
  },
  {
    slug: 'hummus-kebab-bowl',
    size: '1024x1024',
    composition:
      'Smooth creamy hummus base, topped with two grilled lamb-and-beef kebabs sliced into rounds, generous drizzle of olive oil, chopped parsley, finely diced red onion, dusting of sumac, side of pickled cucumber.',
  },
  {
    slug: 'chicken-schnitzel-bowl',
    size: '1024x1024',
    composition:
      'Bowl with golden crispy breaded chicken schnitzel cutlets sliced into strips on a bed of fluffy rice, side of bright green Israeli salad (diced cucumber, tomato, parsley), wedge of charred lemon, drizzle of tahini.',
  },
  {
    slug: 'pita-pulled-chicken',
    size: '1024x1536',
    composition:
      'A Cypriot-style pita wrapped halfway in branded craft paper (paper visible at the base, dish unwrapped at the top showing the filling). Inside: tender pulled grilled chicken, fresh chopped salad, pickled red cabbage, drizzle of tahini and harissa, fresh parsley peeking out the top. Held composition implied — pita standing upright on a wooden board, slight tilt forward to reveal the filling. Warm cream backdrop.',
  },
  {
    slug: 'pita-asado',
    size: '1024x1536',
    composition:
      'Cypriot pita wrapped halfway in branded craft paper, standing upright on a wooden board. Inside: thin sliced juicy asado beef, chopped tabbouleh salad, drizzle of bright green chimichurri sauce, pickled red cabbage, tomato. Glistening, steam rising slightly. Warm cream backdrop, slight tilt forward to reveal the filling.',
  },
  {
    slug: 'pita-kebab',
    size: '1024x1536',
    composition:
      'Cypriot pita wrapped halfway in branded craft paper, standing upright on a wooden board. Inside: two halved hand-rolled kebabs (lamb and beef), grilled tomato, grilled green pepper, drizzle of tahini, fresh parsley, sprinkle of sumac. Slight tilt forward, warm cream backdrop.',
  },
];

const HERO_SLUG = 'hero-hummus-asado';

function selectDishes(argv) {
  const flag = argv.find((a) => a.startsWith('--')) || '--smoke';
  if (flag === '--all') return DISHES;
  if (flag === '--smoke') return DISHES.filter((d) => d.slug === HERO_SLUG);
  if (flag.startsWith('--only=')) {
    const slugs = flag.slice('--only='.length).split(',').map((s) => s.trim());
    return DISHES.filter((d) => slugs.includes(d.slug));
  }
  console.error(`Unknown flag: ${flag}. Use --smoke | --all | --only=slug1,slug2`);
  process.exit(1);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function generateOne(dish, apiKey) {
  const outPath = join(OUT_DIR, `${dish.slug}.png`);
  if (await fileExists(outPath)) {
    console.log(`[skip] ${dish.slug} (already exists at ${outPath})`);
    return { dish: dish.slug, skipped: true };
  }

  const prompt = `${MASTER_STYLE} ${dish.composition}`;
  const body = {
    model: MODEL,
    prompt,
    quality: QUALITY,
    size: dish.size,
  };

  console.log(`[gen ] ${dish.slug} @ ${dish.size} ...`);
  const t0 = Date.now();

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '<no body>');
    throw new Error(`OpenAI ${res.status} on ${dish.slug}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`No b64_json in response for ${dish.slug}: ${JSON.stringify(json).slice(0, 200)}`);
  }

  await writeFile(outPath, Buffer.from(b64, 'base64'));
  const ms = Date.now() - t0;
  const kb = (Buffer.from(b64, 'base64').byteLength / 1024).toFixed(0);
  console.log(`[done] ${dish.slug} → ${outPath} (${kb} KB, ${ms}ms)`);
  return { dish: dish.slug, ok: true, ms, kb };
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY missing — run via ./scripts/with-openai-key.sh node scripts/generate-images.js [...]');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const dishes = selectDishes(process.argv.slice(2));
  console.log(`Generating ${dishes.length} dish(es) with model=${MODEL} quality=${QUALITY}`);

  const results = [];
  for (const dish of dishes) {
    try {
      results.push(await generateOne(dish, apiKey));
    } catch (err) {
      console.error(`[fail] ${dish.slug}: ${err.message}`);
      results.push({ dish: dish.slug, error: err.message });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => r.error).length;
  console.log(`\nSummary: ${ok} generated, ${skipped} skipped, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
