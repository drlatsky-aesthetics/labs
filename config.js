/**
 * Who the requisition is printed under.
 * =====================================
 * Every requisition this site produces carries this block in the
 * "Requisitioning Clinician / Practitioner" box of form 4422-84. Change it here
 * (or override with environment variables) — nothing in the browser can alter it.
 *
 * The signature box is always left empty. Dr. Latsky signs by hand after review.
 */

const e = (key, fallback) => (process.env[key] && process.env[key].trim()) || fallback;

export const CLINICIAN = {
  name:          e('CLINICIAN_NAME',    'Dr. Jason Latsky'),
  address:       e('CLINICIAN_ADDRESS', '2896 Dundas Street W, Toronto ON M6P 1Y8'),
  billingNumber: e('CLINICIAN_BILLING', '052360'),
  cpso:          e('CLINICIAN_CPSO',    '143244'),
  /** Printed in "Urgent contact number" when set; blank otherwise. */
  urgentPhone:   e('CLINICIAN_PHONE',   ''),
};
