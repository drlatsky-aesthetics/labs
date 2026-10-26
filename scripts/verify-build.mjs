/**
 * Guard: the order builder and the end-to-end fill
 * ================================================
 *   node scripts/verify-build.mjs
 */

import assert from 'node:assert/strict';
import { PDFDocument } from '@cantoo/pdf-lib';
import { buildPlan, checkPatient, describeForm } from '../lib/build.js';
import { fillRequisition } from '../lib/fill.js';
import { CLINICIAN } from '../config.js';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ✓ ${name}`); };

test('the page is offered every clinical tick box except the two details blocks', () => {
  const d = describeForm();
  const fields = d.sections.flatMap(s => s.boxes.map(b => b.field));
  assert.equal(fields.length, 39);
  assert.ok(!fields.includes('row1.19') && !fields.includes('row1.21'));
  assert.equal(d.otherTestLines, 11);
});

test('a plain order ticks boxes and writes lines', () => {
  const { plan, errors } = buildPlan({ checkboxes: ['hermatology1.0', 'row1.2'], otherTests: ['TSH', '', 'Ferritin', 'tsh'] });
  assert.deepEqual(errors, []);
  assert.deepEqual(plan.checkboxes.map(c => c.field), ['hermatology1.0', 'row1.2']);
  assert.deepEqual(plan.lines.map(l => l.text), ['TSH', 'Ferritin', 'tsh']);
  assert.equal(plan.sheets, 1);
});

test('glucose defaults to random and honours fasting', () => {
  assert.equal(buildPlan({ checkboxes: ['row1.0'] }).plan.radios.biochemistry, 'random');
  const { plan } = buildPlan({ checkboxes: ['row1.0'], glucoseTiming: 'fasting' });
  assert.equal(plan.radios.biochemistry, 'fasting');
  assert.equal(plan.fasting, true);
});

test('hepatitis, PSA and swab sources are incomplete without their companion', () => {
  assert.match(buildPlan({ checkboxes: ['viralHepatits.3b'] }).errors.join(), /Acute, Chronic or Immune/);
  assert.match(buildPlan({ checkboxes: ['TotalPSA'] }).errors.join(), /Insured or Uninsured/);
  assert.match(buildPlan({ checkboxes: ['hermatology1.11'] }).errors.join(), /specimen source/);
  const ok = buildPlan({ checkboxes: ['viralHepatits.3b', 'FreePSA', 'hermatology1.11'], hepatitisReason: 'immune', psaInsurance: 'insured', specify: { 'hermatology1.11': 'urine' } });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.plan.radios, { acuteHep: 'immune', insuredPSA: 'insured' });
  assert.equal(ok.plan.checkboxes.find(c => c.field === 'hermatology1.11').specifyText, 'urine');
});

test('vitamin D on its own is an order', () => {
  const { plan, errors } = buildPlan({ vitaminD: 'uninsured' });
  assert.deepEqual(errors, []);
  assert.equal(plan.radios.insuredvitD, 'uninsured');
});

test('an empty order and an unknown box are refused', () => {
  assert.match(buildPlan({}).errors.join(), /Nothing ordered/);
  assert.match(buildPlan({ checkboxes: ['row1.19'] }).errors.join(), /Unknown tick box/);
});

test('twelve lines need two sheets', () => {
  const { plan } = buildPlan({ otherTests: Array.from({ length: 12 }, (_, i) => `Test ${i + 1}`) });
  assert.equal(plan.sheets, 2);
  assert.equal(plan.lineSheets[0].length, 11);
  assert.equal(plan.lineSheets[1].length, 1);
});

test('the patient block is checked', () => {
  const bad = checkPatient({ lastName: 'X', dob: '1/2/1980', sex: 'other', healthNumber: '123' });
  assert.ok(bad.errors.some(e => /first name/i.test(e)));
  assert.ok(bad.errors.some(e => /YYYY-MM-DD/.test(e)));
  assert.ok(bad.errors.some(e => /M or F/.test(e)));
  assert.ok(bad.errors.some(e => /10 digits/.test(e)));
  const good = checkPatient({ lastName: 'Gonzalez', firstName: 'Maria', dob: '1979-03-15', sex: 'f', healthNumber: '1234-567-897', healthNumberVersion: 'ab' });
  assert.deepEqual(good.errors, []);
  assert.equal(good.patient.healthNumber, '1234567897');
  assert.equal(good.patient.healthNumberVersion, 'AB');
  assert.equal(good.patient.sex, 'F');
  const uninsured = checkPatient({ lastName: 'A', firstName: 'B', dob: '2000-01-01', sex: 'M', payer: 'uninsured' });
  assert.deepEqual(uninsured.errors, []);
});

test('the clinician block is Dr. Latsky', () => {
  assert.equal(CLINICIAN.cpso, '143244');
  assert.equal(CLINICIAN.billingNumber, '052360');
  assert.match(CLINICIAN.address, /2896 Dundas/);
});

console.log('  … filling the ministry PDF');
const { plan } = buildPlan({ checkboxes: ['hermatology1.0', 'row1.2', 'row1.0'], otherTests: Array.from({ length: 12 }, (_, i) => `Test ${i + 1}`) });
const pdf = await fillRequisition(plan, {
  patient: checkPatient({ lastName: 'Test', firstName: 'Patient', dob: '1980-01-01', sex: 'F', healthNumber: '1234567897', healthNumberVersion: 'AB' }).patient,
  clinician: CLINICIAN, clinicalInfo: 'Verification run', collection: { serviceDate: '2026-10-26', signatureDate: '2026-10-26' },
});
const doc = await PDFDocument.load(pdf);
assert.equal(doc.getPageCount(), 2, 'two sheets expected');
assert.equal(doc.getForm().getFields().length, 0, 'output must be flattened');
n++; console.log('  ✓ two-sheet requisition renders flat');

console.log(`✓ builder and fill verified — ${n} checks`);
