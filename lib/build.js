/**
 * Order Builder
 * =============
 * Turns what the provider ticked and typed on the web page into the plan shape
 * that fill.js writes onto the ministry PDF.
 *
 * The page offers the form's own tick boxes, so there is no name matching to
 * do: a ticked box is a field name from form-map.js, and a free-text "Other
 * Tests" line is written verbatim. The builder's job is the rules the form
 * itself imposes — glucose needs a timing, hepatitis needs a reason, PSA and
 * vitamin D need an insurability — and the eleven-line limit per sheet.
 */

import { CHECKBOXES, RADIOS, OTHER_TEST_CAPACITY } from './form-map.js';

/** Boxes the page offers. The two "details block" boxes are sub-widgets of
 *  neonatal bilirubin / drug monitoring and are not orderable on their own. */
const HIDDEN = new Set(['row1.19', 'row1.21']);

export const SECTIONS = (() => {
  const order = ['Biochemistry', 'Hematology', 'Immunology', 'Microbiology', 'Viral Hepatitis', 'PSA'];
  const out = order.map(title => ({ title, boxes: [] }));
  for (const [field, spec] of Object.entries(CHECKBOXES)) {
    if (HIDDEN.has(field)) continue;
    const s = out.find(x => x.title === spec.section);
    if (s) s.boxes.push({ field, label: spec.label.replace(' (immune status)', ''), specify: !!spec.specify, needs: spec.needs || null, fasting: !!spec.fasting });
  }
  return out;
})();

/** What the page needs to draw itself. */
export function describeForm() {
  return {
    sections: SECTIONS,
    otherTestLines: OTHER_TEST_CAPACITY,
    radios: {
      glucoseTiming:   Object.keys(RADIOS.biochemistry.options),  // random | fasting
      hepatitisReason: Object.keys(RADIOS.acuteHep.options),      // acute | chronic | immune
      psaInsurance:    Object.keys(RADIOS.insuredPSA.options),    // insured | uninsured
      vitaminD:        Object.keys(RADIOS.insuredvitD.options),   // insured | uninsured
    },
  };
}

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();

/**
 * @param {object} order
 *   checkboxes: string[]           field names from form-map.js
 *   specify:    { [field]: text }  specimen source for Chlamydia / GC / Wound / Other Swabs
 *   glucoseTiming:   'random' | 'fasting'
 *   hepatitisReason: 'acute' | 'chronic' | 'immune'
 *   psaInsurance:    'insured' | 'uninsured'
 *   vitaminD:        'insured' | 'uninsured' | ''   (choosing one *is* the vitamin D order)
 *   otherTests: string[]           free text, one test per line
 * @returns {{ plan: object, errors: string[] }}
 */
export function buildPlan(order = {}) {
  const errors = [];
  const checkboxes = [];
  const radios = {};
  const specify = order.specify || {};

  const wanted = [...new Set((order.checkboxes || []).map(clean).filter(Boolean))];
  for (const field of wanted) {
    const spec = CHECKBOXES[field];
    if (!spec || HIDDEN.has(field)) { errors.push(`Unknown tick box "${field}".`); continue; }
    const box = { field, section: spec.section, label: spec.label };
    if (spec.specify) {
      const src = clean(specify[field]);
      if (!src) errors.push(`${spec.label}: specify the specimen source.`);
      box.specifyText = src;
    }
    checkboxes.push(box);
  }

  const has = f => wanted.includes(f);
  const pick = (group, value, allowed, what) => {
    const v = clean(value);
    if (!allowed.includes(v)) { errors.push(what); return; }
    radios[group] = v;
  };

  if (has('row1.0')) {
    pick('biochemistry', order.glucoseTiming || 'random', Object.keys(RADIOS.biochemistry.options),
      'Glucose: choose Random or Fasting.');
  }
  if (['viralHepatits.3a', 'viralHepatits.3b', 'viralHepatits.3c'].some(has)) {
    pick('acuteHep', order.hepatitisReason, Object.keys(RADIOS.acuteHep.options),
      'Viral hepatitis: choose Acute, Chronic or Immune status.');
  }
  if (has('TotalPSA') || has('FreePSA')) {
    pick('insuredPSA', order.psaInsurance, Object.keys(RADIOS.insuredPSA.options),
      'PSA: choose Insured or Uninsured.');
  }
  if (clean(order.vitaminD)) {
    pick('insuredvitD', order.vitaminD, Object.keys(RADIOS.insuredvitD.options),
      'Vitamin D: choose Insured or Uninsured.');
  }

  const lines = [...new Set((order.otherTests || []).map(clean).filter(Boolean))].map(text => ({ text }));
  const sheets = Math.max(1, Math.ceil(lines.length / OTHER_TEST_CAPACITY));
  const lineSheets = [];
  for (let i = 0; i < sheets; i++) lineSheets.push(lines.slice(i * OTHER_TEST_CAPACITY, (i + 1) * OTHER_TEST_CAPACITY));

  if (!checkboxes.length && !lines.length && !radios.insuredvitD) errors.push('Nothing ordered: tick at least one test or write one on an Other Tests line.');

  const warnings = [];
  if (sheets > 1) warnings.push(`${lines.length} Other Tests lines: the form holds ${OTHER_TEST_CAPACITY} per sheet, so ${sheets} sheets print (tick boxes on sheet 1 only).`);
  const fasting = checkboxes.some(c => CHECKBOXES[c.field].fasting) || radios.biochemistry === 'fasting';

  return { plan: { checkboxes, radios, lines, lineSheets, sheets, derived: [], warnings, fasting }, errors };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Patient block checks. Returns a cleaned patient and the problems found. */
export function checkPatient(p = {}) {
  const errors = [];
  const patient = {
    lastName: clean(p.lastName), firstName: clean(p.firstName), middleNames: clean(p.middleNames),
    dob: clean(p.dob), sex: clean(p.sex).toUpperCase(), payer: clean(p.payer).toLowerCase() || 'ohip',
    healthNumber: String(p.healthNumber ?? '').replace(/\D/g, '').slice(0, 10),
    healthNumberVersion: clean(p.healthNumberVersion).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
    province: clean(p.province), otherProvincialNumber: clean(p.otherProvincialNumber),
    address: clean(p.address), phone: clean(p.phone),
  };
  if (!patient.lastName) errors.push('Patient last name (as on the health card) is required.');
  if (!patient.firstName) errors.push('Patient first name is required.');
  if (!ISO.test(patient.dob)) errors.push('Date of birth must be YYYY-MM-DD.');
  if (!['M', 'F'].includes(patient.sex)) errors.push('Sex must be M or F (the form has only those two boxes).');
  if (!['ohip', 'uninsured', 'wsib'].includes(patient.payer)) errors.push('Payer must be OHIP, uninsured or WSIB.');
  if (patient.payer === 'ohip' && !patient.province && patient.healthNumber.length !== 10) errors.push('An Ontario health number is 10 digits.');
  return { patient, errors };
}
