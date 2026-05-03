#!/usr/bin/env node
// Send the empty-restaurant photos to gpt-image-2 /v1/images/edits with a prompt
// that fills them with diners. Per ~/.claude/rules/visual-assets.md: gpt-image-2 + quality=high, no fallback.
//
// Usage:  ./scripts/with-openai-key.sh node scripts/edit-empty-rooms.js
//
// Inputs/outputs hard-coded — no CLI args. If a job fails, log + continue.

import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error('OPENAI_API_KEY not in env. Run via scripts/with-openai-key.sh.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const JOBS = [
  {
    in: 'assets/video/paphos-tables-still.jpg',
    out: 'assets/video/paphos-tables-bustling.png',
    prompt:
      'Fill this empty modern Paphos restaurant interior with happy diners. Keep the exact same room: white walls, wooden flooring, black wooden chairs, light pine wooden tables, two black self-order kiosks against the white wall, ceiling fan, floor-to-ceiling open glass front, sunlight from the street side, building visible across the street. Now seat groups of friends and families across the tables — ages 20s to 60s, casual summer wear, mix of men and women, light Mediterranean palette. People are eating from kraft-paper bowls of meat and rice on the tables, mid-conversation, smiling, glasses of soft drinks. Warm afternoon light. Natural candid restaurant photography, photorealistic, no text, no logos, no signs.',
  },
  {
    in: 'assets/video/paphos-exterior-still.jpg',
    out: 'assets/video/paphos-exterior-bustling.png',
    prompt:
      'Fill this empty Paphos restaurant patio with diners enjoying a sunny afternoon. Keep the exact same setting: light wooden tables, black wooden chairs, smooth wooden floor, ceiling fan, white walls and ceiling, the dark order kiosk on the wall, Cyprus apartment building across the street with palm-lined sidewalk, blue sky. Now seat happy groups across all visible tables — couples, friends, families with one or two children, casual Mediterranean summer dress code, ages 25-65, mix of locals and tourists. People are eating from branded ASADO craft bowls, drinking from glass bottles, talking and laughing. Bright daylight, candid lifestyle photography, photorealistic, no text, no logos, no signs.',
  },
];

async function editOne(job) {
  const inAbs = path.join(ROOT, job.in);
  const outAbs = path.join(ROOT, job.out);
  if (!fs.existsSync(inAbs)) {
    console.error(`SKIP ${job.in} — file missing`);
    return false;
  }
  console.log(`→ editing ${job.in}`);

  const buf = fs.readFileSync(inAbs);
  const blob = new Blob([buf], { type: 'image/jpeg' });

  const form = new FormData();
  form.append('model', 'gpt-image-2');
  form.append('quality', 'high');
  form.append('prompt', job.prompt);
  form.append('image[]', blob, path.basename(inAbs));

  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  const ms = Date.now() - t0;

  if (!res.ok) {
    const text = await res.text();
    console.error(`FAIL ${job.in} → ${res.status} ${res.statusText}\n${text.slice(0, 500)}`);
    return false;
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`FAIL ${job.in} — no b64_json in response`);
    console.error(JSON.stringify(json).slice(0, 400));
    return false;
  }
  fs.writeFileSync(outAbs, Buffer.from(b64, 'base64'));
  console.log(`  ✓ wrote ${job.out} (${(fs.statSync(outAbs).size / 1024).toFixed(1)} KB, ${ms}ms)`);
  return true;
}

const start = Date.now();
let ok = 0,
  fail = 0;
for (const job of JOBS) {
  // run sequentially to be polite + easier to debug
  // eslint-disable-next-line no-await-in-loop
  const r = await editOne(job);
  if (r) ok++;
  else fail++;
}
console.log(`\nDone. ${ok} ok / ${fail} failed in ${(Date.now() - start) / 1000}s`);
process.exit(fail > 0 ? 1 : 0);
