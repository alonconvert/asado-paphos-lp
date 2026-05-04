#!/usr/bin/env node
// Send the EN block + each non-EN block of i18n.json through gpt-5 (Responses API)
// asking for a native-quality polish + corrections, then write the polished JSON back.
//
// Usage:  ./scripts/with-openai-key.sh node scripts/polish-translations.js
//
// Strategy:
//  - For each target language (he, ar, el, ru, fr, it):
//      - Send the EN block as source-of-truth + the current target block
//      - Ask the model to return a corrected JSON object only for that language
//      - Parse, validate keys match, splice into i18n.json
//  - Write a single polished i18n.json at the end.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const I18N = path.join(ROOT, 'i18n.json');

const dict = JSON.parse(fs.readFileSync(I18N, 'utf8'));
const enKeys = Object.keys(dict.en);
const targets = ['he', 'ar', 'el', 'ru', 'fr', 'it'];

const langName = {
  he: 'Hebrew (modern Israeli, RTL)',
  ar: 'Arabic (Modern Standard, RTL)',
  el: 'Greek',
  ru: 'Russian',
  fr: 'French (Métropolitain)',
  it: 'Italian',
};

const SYSTEM = `You are a native-speaker copy editor for a kosher Argentinian-Mediterranean restaurant landing page.
Brand voice: family-run warmth, slightly editorial, never corporate. The English block is the source of truth.
For the target language you will be given, return ONLY valid JSON (an object with the same keys as the English block).
Each value must be a polished, idiomatic translation that:
  - Keeps the editorial warmth (avoid stiff machine-translation phrasing)
  - Preserves brand names like "ASADO Express", "ASADO Nice to Meat", "ASADO" (do not translate the brand)
  - Preserves proper nouns: Paphos, Limassol, Old Port, Alkminis 29, WhatsApp
  - Keeps numerals and times in Western digits and 24-hour format
  - Keeps em-dashes and middle dots (·) where they appear in the English source
  - For Hebrew: NEVER use em-dash — use middle-dot (·) or comma instead (em-dash is the clearest AI tell in Hebrew)
  - For Arabic: same rule, prefer middle-dot
  - For HTML-like fragments: preserve the structure exactly (no added tags)
  - For very short labels (1-3 words): keep it punchy and short, do not bloat
Return ONLY the JSON object. No preamble, no markdown fence, no commentary.`;

async function polishLang(lang) {
  const en = dict.en;
  const current = dict[lang] || {};
  const userPrompt = `Target language: ${langName[lang]}
The English source-of-truth (canonical):
${JSON.stringify(en, null, 2)}

Current ${langName[lang]} block (may have errors, machine-translation stiffness, em-dash misuse, missing keys, mistranslations):
${JSON.stringify(current, null, 2)}

Return a polished JSON object with the same keys as the English block. Same key order.`;

  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'gpt-5',
      instructions: SYSTEM,
      input: userPrompt,
      // Keep responses focused on JSON output
      max_output_tokens: 16000,
    }),
  });
  const ms = Date.now() - t0;

  if (!res.ok) {
    const text = await res.text();
    console.error(`[${lang}] FAIL ${res.status} ${res.statusText}\n${text.slice(0, 600)}`);
    return null;
  }
  const json = await res.json();
  const out = json?.output_text
    ?? json?.output?.[0]?.content?.[0]?.text
    ?? json?.output?.[0]?.content?.find?.((c) => c.type === 'output_text')?.text;
  if (!out) {
    console.error(`[${lang}] no output_text in response shape`);
    console.error(JSON.stringify(json).slice(0, 600));
    return null;
  }
  // Strip any accidental ```json fences
  const cleaned = out.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); }
  catch (e) {
    console.error(`[${lang}] JSON parse failed: ${e.message}`);
    fs.writeFileSync(`/tmp/polish-${lang}.txt`, cleaned);
    return null;
  }
  // Sanity: every English key should have a translation
  const missing = enKeys.filter((k) => !(k in parsed));
  if (missing.length) {
    console.warn(`[${lang}] WARN ${missing.length} missing keys: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '...' : ''}`);
    // Fill in from current block to keep parity
    missing.forEach((k) => { parsed[k] = current[k] ?? en[k]; });
  }
  // Drop any extra keys the model invented
  const polished = {};
  for (const k of enKeys) polished[k] = parsed[k];
  console.log(`[${lang}] OK · ${ms}ms · ${enKeys.length} keys`);
  return polished;
}

const results = {};
for (const lang of targets) {
  // eslint-disable-next-line no-await-in-loop
  results[lang] = await polishLang(lang);
}

// Splice polished blocks back, keep en + es order intact
const next = { en: dict.en };
for (const lang of targets) {
  next[lang] = results[lang] || dict[lang];
}
fs.writeFileSync(I18N, JSON.stringify(next, null, 2) + '\n');
console.log('\nDone. Polished i18n.json written.');
