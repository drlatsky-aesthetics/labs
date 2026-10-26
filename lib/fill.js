/**
 * Requisition Filler
 * ==================
 * Writes an order plan onto the real ministry PDF (forms/on-4422-84.pdf) using
 * its own AcroForm fields — no redrawn lookalike, no overlay. What comes out is
 * the ministry form with boxes ticked, so a lab receiving it by fax or paper
 * sees exactly the document it expects.
 *
 * Overflow: the form holds eleven free-text tests. When the plan needs more, we
 * fill one copy of the form per sheet, stamp "Page n of m" into the clinical
 * information box, and merge them into a single PDF. Merging requires flattening
 * (two copies of the same form would otherwise collide on field names), which is
 * also what you want for anything being faxed or printed.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument } from '@cantoo/pdf-lib';
import { loadBlank, setState, setTextField, flattenForPrint } from './acroform.js';
import { CHECKBOXES, RADIOS, FLAGS, OTHER_TEST_LINES, TEXT_FIELDS, FORM_FILE, FORM_ID, FORM_EDITION } from './form-map.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The ministry ships this form AES-256 encrypted with an *empty* user password
 * and form-filling permitted — the same thing every PDF viewer opens with. We
 * keep the distributed file byte-for-byte and decrypt in memory at fill time.
 */
async function blankForm() {
  return loadBlank(join(HERE, 'forms', FORM_FILE));
}

/** Write one of the friendly-named demographic fields. */
function setText(form, friendly, value) {
  setTextField(form, TEXT_FIELDS[friendly], value);
}

/** Comb fields (health number, dates) accept digits only — anything else shifts the boxes. */
const digitsOnly = (v, len) => String(v ?? '').replace(/\D/g, '').slice(0, len);

/** The pre-printed "( )" sits inside the phone boxes; don't double it up. */
const plainPhone = (v) => String(v ?? '').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

/** The form asks for yyyy/mm/dd in its single-box date fields. */
const formDate = (v) => String(v ?? '').replace(/-/g, '/');

/** Split yyyy-mm-dd into the form's three-box date layout. */
function splitDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? { y: m[1], m: m[2], d: m[3] } : null;
}

/**
 * Fill one sheet.
 * @param {object} plan          from planOrder()
 * @param {object} ctx           { patient, clinician, clinicalInfo, collection }
 * @param {number} sheetIndex    0-based
 */
async function fillSheet(plan, ctx, sheetIndex) {
  const pdf = await blankForm();
  const form = pdf.getForm();
  const { patient = {}, clinician = {}, collection = {} } = ctx;

  // ── Requisitioning clinician ──
  setText(form, 'clinicianName', clinician.name);
  setText(form, 'clinicianAddress', clinician.address);
  setText(form, 'clinicianNumber', clinician.billingNumber);
  setText(form, 'cpsoNumber', clinician.cpso);
  setText(form, 'urgentContactNumber', plainPhone(clinician.urgentPhone));

  // ── Patient ──
  setText(form, 'patientLastName', patient.lastName);
  setText(form, 'patientFirstName', patient.firstName);
  setText(form, 'patientMiddleNames', patient.middleNames);
  setText(form, 'patientAddress', patient.address);
  setText(form, 'patientPhone', plainPhone(patient.phone));
  setText(form, 'healthNumber', digitsOnly(patient.healthNumber, 10));
  setText(form, 'healthNumberVersion', patient.healthNumberVersion);
  setText(form, 'provinceIfNotON', patient.province);
  setText(form, 'otherProvincialNumber', patient.otherProvincialNumber);

  const dob = splitDate(patient.dob);
  if (dob) {
    setText(form, 'dobYear', dob.y);
    setText(form, 'dobMonth', dob.m);
    setText(form, 'dobDay', dob.d);
  }
  const service = splitDate(collection.serviceDate);
  if (service) {
    setText(form, 'serviceYear', service.y);
    setText(form, 'serviceMonth', service.m);
    setText(form, 'serviceDay', service.d);
  }
  setText(form, 'collectionDate', formDate(collection.collectionDate));
  setText(form, 'collectionTime', collection.collectionTime);
  setText(form, 'signatureDate', formDate(collection.signatureDate));

  // ── Payer + sex radios ──
  const radios = { ...plan.radios };
  if (patient.payer) radios.checkOne = patient.payer;
  if (patient.sex) radios.sex = patient.sex;

  // Tick boxes only belong on sheet 1; repeating them would double-order.
  if (sheetIndex === 0) {
    for (const box of plan.checkboxes) {
      const spec = CHECKBOXES[box.field];
      if (spec) { setState(form, box.field, spec.on); if (box.specifyText && spec.specify) setTextField(form, spec.specify, box.specifyText); }
    }
  } else {
    for (const k of Object.keys(radios)) if (k === 'biochemistry') delete radios[k];
  }

  for (const [group, choice] of Object.entries(radios)) {
    const spec = RADIOS[group];
    if (!spec) continue;
    const value = spec.options[choice] ?? choice;
    setState(form, group, value);
  }
  if (ctx.copyToClinician) {
    setState(form, 'clinician', FLAGS.clinician.on);
    setText(form, 'copyToLastName', ctx.copyToClinician.lastName);
    setText(form, 'copyToFirstName', ctx.copyToClinician.firstName);
    setText(form, 'copyToAddress', ctx.copyToClinician.address);
  }

  // ── "Other Tests" free lines for this sheet ──
  const sheetLines = plan.lineSheets[sheetIndex] || [];
  sheetLines.forEach((line, i) => {
    const field = OTHER_TEST_LINES[i];
    if (!field) return;
    try { form.getTextField(field).setText(line.text); } catch { /* skip */ }
  });

  // ── Clinical information ──
  const pageNote = plan.sheets > 1 ? `  [Page ${sheetIndex + 1} of ${plan.sheets}]` : '';
  setText(form, 'clinicalInfo', `${ctx.clinicalInfo || ''}${pageNote}`.trim());

  flattenForPrint(form);
  return pdf;
}

/**
 * @returns {Promise<Uint8Array>} the filled requisition, one page per sheet
 */
export async function fillRequisition(plan, ctx = {}) {
  const out = await PDFDocument.create();
  out.setTitle(`Laboratory Requisition ${FORM_ID} (${FORM_EDITION})`);
  out.setSubject(ctx.clinicalInfo || 'Laboratory Requisition');
  out.setProducer('Latsky Labs');

  for (let i = 0; i < plan.sheets; i++) {
    const sheet = await fillSheet(plan, ctx, i);
    const [page] = await out.copyPages(sheet, [0]);
    out.addPage(page);
  }
  return out.save();
}
