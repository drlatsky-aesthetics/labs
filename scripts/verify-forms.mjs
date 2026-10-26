/**
 * Guard: form map vs. the actual ministry PDF
 * ===========================================
 *   node scripts/verify-forms.mjs
 *
 * Every field written to must exist in lib/forms/on-4422-84.pdf with the
 * appearance state expected. If the ministry reissues the form this fails here
 * instead of silently printing a requisition with an unticked box.
 */

import { readFile } from 'node:fs/promises';
import { PDFDocument } from '@cantoo/pdf-lib';
import { CHECKBOXES, RADIOS, FLAGS, OTHER_TEST_LINES, TEXT_FIELDS, FORM_FILE } from '../lib/form-map.js';

const bytes = await readFile(new URL(`../lib/forms/${FORM_FILE}`, import.meta.url));
const pdf = await PDFDocument.load(bytes, { password: '' });
const form = pdf.getForm();
const present = new Map(form.getFields().map(f => [f.getName(), f]));
const failures = [];

const states = (field) => {
  const out = new Set();
  for (const w of field.acroField.getWidgets()) {
    const normal = w.getAppearances()?.normal;
    if (normal && typeof normal.keys === 'function') for (const k of normal.keys()) out.add(k.asString().slice(1));
  }
  return out;
};

for (const [name, spec] of Object.entries(CHECKBOXES)) {
  const f = present.get(name);
  if (!f) { failures.push(`checkbox "${name}" (${spec.label}) is missing from the PDF`); continue; }
  if (!states(f).has(spec.on)) failures.push(`checkbox "${name}" (${spec.label}) has no "${spec.on}" appearance state`);
}
for (const [name, spec] of Object.entries(RADIOS)) {
  const f = present.get(name);
  if (!f) { failures.push(`radio group "${name}" is missing from the PDF`); continue; }
  const have = states(f);
  for (const value of Object.values(spec.options)) if (!have.has(value)) failures.push(`radio "${name}" has no "${value}" state (${spec.label})`);
}
for (const [name, spec] of Object.entries(FLAGS)) {
  const f = present.get(name);
  if (!f) failures.push(`flag "${name}" is missing from the PDF`);
  else if (!states(f).has(spec.on)) failures.push(`flag "${name}" has no "${spec.on}" state`);
}
for (const name of [...OTHER_TEST_LINES, ...Object.values(TEXT_FIELDS)]) {
  if (!present.has(name)) failures.push(`text field "${name}" is missing from the PDF`);
}

const checked = Object.keys(CHECKBOXES).length + Object.keys(RADIOS).length + Object.keys(FLAGS).length + OTHER_TEST_LINES.length + Object.values(TEXT_FIELDS).length;
if (failures.length) {
  console.error(`✗ ${failures.length} problem(s) in the form map:\n`);
  failures.forEach(f => console.error(`  • ${f}`));
  process.exit(1);
}
console.log(`✓ form map matches the PDF — ${checked} fields verified`);
