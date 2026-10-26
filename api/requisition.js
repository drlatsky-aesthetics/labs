/**
 * /api/requisition
 * ================
 * GET  → what the page needs to draw itself: the form's sections and tick
 *        boxes, the radio choices, and the clinician block the PDF prints under.
 * POST → the filled ministry form as application/pdf.
 *        Body: { patient, order, clinicalInfo, serviceDate, signatureDate, copyTo }
 *        With { dryRun: true } the plan and any errors come back as JSON instead.
 *
 * Works as a Vercel serverless function and under server.mjs locally. Stateless:
 * nothing is stored anywhere.
 */

import { CLINICIAN } from '../config.js';
import { describeForm, buildPlan, checkPatient } from '../lib/build.js';
import { fillRequisition } from '../lib/fill.js';
import { FORM_ID, FORM_EDITION } from '../lib/form-map.js';

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ form: `${FORM_ID} (${FORM_EDITION})`, clinician: CLINICIAN, ...describeForm() });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Body must be JSON' }); }

  const { patient, errors: patientErrors } = checkPatient(body.patient);
  const { plan, errors: orderErrors } = buildPlan(body.order);
  const errors = [...patientErrors, ...orderErrors];

  const serviceDate = clean(body.serviceDate);
  const signatureDate = clean(body.signatureDate);
  if (serviceDate && !ISO.test(serviceDate)) errors.push('Date of service must be YYYY-MM-DD.');
  if (signatureDate && !ISO.test(signatureDate)) errors.push('Signature date must be YYYY-MM-DD.');

  let copyToClinician = null;
  const c = body.copyTo || {};
  if (clean(c.lastName) || clean(c.firstName) || clean(c.address)) {
    if (!clean(c.lastName)) errors.push('Copy to: a last name is needed.');
    copyToClinician = { lastName: clean(c.lastName), firstName: clean(c.firstName), address: clean(c.address) };
  }

  if (body.dryRun) return res.status(errors.length ? 400 : 200).json({ plan, errors, patient, clinician: CLINICIAN });
  if (errors.length) return res.status(400).json({ errors });

  try {
    const pdf = await fillRequisition(plan, {
      patient,
      clinician: CLINICIAN,
      clinicalInfo: String(body.clinicalInfo ?? '').trim(),
      collection: { serviceDate, signatureDate, collectionDate: '', collectionTime: '' },
      copyToClinician,
    });
    const stem = `${patient.lastName}-${patient.firstName}`.replace(/[^A-Za-z0-9-]+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="requisition-${stem}.pdf"`);
    res.setHeader('X-Requisition-Sheets', String(plan.sheets));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(pdf));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
