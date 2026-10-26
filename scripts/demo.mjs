/**
 * Demo: write one sample requisition
 * ==================================
 *   node scripts/demo.mjs [outfile.pdf]
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildPlan, checkPatient } from '../lib/build.js';
import { fillRequisition } from '../lib/fill.js';
import { CLINICIAN } from '../config.js';

const out = process.argv[2] || 'out/demo.pdf';
const { plan, errors } = buildPlan({
  checkboxes: ['hermatology1.0', 'row1.2', 'row1.0', 'row1.13', 'row1.1', 'viralHepatits.3b'],
  glucoseTiming: 'fasting', hepatitisReason: 'immune', vitaminD: 'uninsured',
  otherTests: ['TSH', 'Ferritin', 'Vitamin B12', 'Magnesium'],
});
if (errors.length) { console.error(errors); process.exit(1); }
const { patient } = checkPatient({
  lastName: 'Gonzalez', firstName: 'Maria', dob: '1979-03-15', sex: 'F', payer: 'ohip',
  healthNumber: '1234567897', healthNumberVersion: 'AB',
  address: '48 Rosewood Ave, Toronto ON M4K 2P1', phone: '(416) 555-0182',
});
const pdf = await fillRequisition(plan, {
  patient, clinician: CLINICIAN,
  clinicalInfo: 'Fatigue; annual screening.',
  collection: { serviceDate: '2026-10-26', signatureDate: '2026-10-26' },
  copyToClinician: { lastName: 'Example', firstName: 'Naturopath', address: '1 Example Rd, Toronto ON' },
});
await mkdir(dirname(out), { recursive: true });
await writeFile(out, pdf);
console.log(`✓ ${plan.sheets}-sheet requisition written to ${out}`);
