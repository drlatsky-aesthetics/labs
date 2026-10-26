/**
 * Ontario Laboratory Requisition — Form Field Map
 * ===============================================
 * Form:    Ministry of Health "Laboratory Requisition" 4422-84 (2026/04)
 * Source:  the fillable PDF shipped in ./forms/on-4422-84.pdf
 *
 * The AcroForm field names in that PDF are machine-generated and mostly
 * meaningless ("row1.7", "hermatology1.12", "Other Tests - one test per line,
 * Sputum"). This file is the ground truth that turns them back into clinical
 * concepts. Every mapping below was derived from the widget rectangles in the
 * PDF and verified against a render of the printed form, so `label` is the text
 * a clinician actually sees beside that box.
 *
 * Nothing here is guessed: `on` is the literal /AP /N appearance state of the
 * widget, which is the value the PDF viewer expects when the box is ticked.
 *
 * If the ministry reissues the form, re-derive this map — do not hand-edit it.
 */

export const FORM_ID = 'ON-4422-84';
export const FORM_EDITION = '2026/04';
export const FORM_FILE = 'on-4422-84.pdf';

/**
 * Single-widget checkboxes: field name -> { label, on }
 * Grouped by the printed section of the requisition.
 */
export const CHECKBOXES = {
  // ── Biochemistry (left column) ──
  'row1.0':  { section: 'Biochemistry', label: 'Glucose',                        on: 'Yes', needs: 'glucoseTiming' },
  'row1.1':  { section: 'Biochemistry', label: 'HbA1C',                          on: 'Yes' },
  'row1.2':  { section: 'Biochemistry', label: 'Creatinine (eGFR)',              on: 'Yes' },
  'row1.3':  { section: 'Biochemistry', label: 'Uric Acid',                      on: 'Yes' },
  'row1.4':  { section: 'Biochemistry', label: 'Sodium',                         on: 'Yes' },
  'row1.5':  { section: 'Biochemistry', label: 'Potassium',                      on: 'Yes' },
  'row1.6':  { section: 'Biochemistry', label: 'ALT',                            on: 'Yes' },
  'row1.7':  { section: 'Biochemistry', label: 'Alk. Phosphatase',               on: 'Yes' },
  'row1.8':  { section: 'Biochemistry', label: 'Bilirubin',                      on: 'Yes' },
  'row1.9':  { section: 'Biochemistry', label: 'Albumin',                        on: 'Yes' },
  'row1.13': { section: 'Biochemistry', label: 'Lipid Assessment',               on: 'Yes', fasting: true },
  'row1.14': { section: 'Biochemistry', label: 'Albumin / Creatinine Ratio, Urine', on: 'Yes' },
  'row1.15': { section: 'Biochemistry', label: 'Urinalysis (Chemical)',          on: 'Yes' },
  'row1.16': { section: 'Biochemistry', label: 'Neonatal Bilirubin',             on: 'Yes' },
  'row1.19': { section: 'Biochemistry', label: 'Neonatal Bilirubin — details block', on: 'Yes' },
  'row1.20': { section: 'Biochemistry', label: 'Therapeutic Drug Monitoring',    on: 'Yes' },
  'row1.21': { section: 'Biochemistry', label: 'Therapeutic Drug Monitoring — details block', on: 'Yes' },

  // ── Hematology / Immunology (centre column) ──
  'hermatology1.0':  { section: 'Hematology',  label: 'CBC',                     on: 'fasting' },
  'hermatology1.1':  { section: 'Hematology',  label: 'Prothrombin Time (INR)',  on: 'fasting' },
  'hermatology1.3':  { section: 'Immunology',  label: 'Pregnancy Test (Urine)',  on: 'fasting' },
  'hermatology1.4':  { section: 'Immunology',  label: 'Mononucleosis Screen',    on: 'fasting' },
  'hermatology1.5':  { section: 'Immunology',  label: 'Rubella',                 on: 'fasting' },
  'hermatology1.6':  { section: 'Immunology',  label: 'Prenatal: ABO, RhD, Antibody Screen', on: 'fasting' },
  'hermatology1.7':  { section: 'Immunology',  label: 'Repeat Prenatal Antibodies', on: 'fasting' },

  // ── Microbiology ID & Sensitivities (centre column, lower) ──
  'hermatology1.8':  { section: 'Microbiology', label: 'Cervical',               on: 'fasting' },
  'hermatology1.9':  { section: 'Microbiology', label: 'Vaginal',                on: 'fasting' },
  'hermatology1.10': { section: 'Microbiology', label: 'Vaginal / Rectal – Group B Strep', on: 'fasting' },
  'hermatology1.11': { section: 'Microbiology', label: 'Chlamydia',              on: 'fasting', specify: 'specify1' },
  'hermatology1.12': { section: 'Microbiology', label: 'GC',                     on: 'fasting', specify: 'specify2' },
  'hermatology1.13': { section: 'Microbiology', label: 'Sputum',                 on: 'fasting' },
  'hermatology1.14': { section: 'Microbiology', label: 'Throat',                 on: 'fasting' },
  'hermatology1.15': { section: 'Microbiology', label: 'Wound',                  on: 'fasting', specify: 'specify3' },
  'hermatology1.16': { section: 'Microbiology', label: 'Urine',                  on: 'fasting' },
  'hermatology1.17': { section: 'Microbiology', label: 'Stool Culture',          on: 'fasting' },
  'hermatology1.18': { section: 'Microbiology', label: 'Stool Ova & Parasites',  on: 'fasting' },
  'hermatology1.19': { section: 'Microbiology', label: 'Other Swabs / Pus',      on: 'fasting', specify: 'OtherSwabs' },

  // ── Viral hepatitis serology (right column) ──
  'viralHepatits.3a': { section: 'Viral Hepatitis', label: 'Hepatitis A (immune status)', on: 'a' },
  'viralHepatits.3b': { section: 'Viral Hepatitis', label: 'Hepatitis B (immune status)', on: 'b' },
  'viralHepatits.3c': { section: 'Viral Hepatitis', label: 'Hepatitis C (immune status)', on: 'c' },

  // ── PSA (right column) ──
  'TotalPSA': { section: 'PSA', label: 'Total PSA', on: 'T', needs: 'psaInsurability' },
  'FreePSA':  { section: 'PSA', label: 'Free PSA',  on: 'F', needs: 'psaInsurability' },
};

/**
 * Radio groups: one selection per group. Values are the appearance states.
 */
export const RADIOS = {
  checkOne:     { label: 'Payer',                 options: { ohip: 'ohip', uninsured: 'un', wsib: 'wsib' } },
  sex:          { label: 'Sex',                   options: { M: 'M', F: 'F' } },
  biochemistry: { label: 'Glucose timing',        options: { random: 'ran', fasting: 'fasting' } },
  acuteHep:     { label: 'Viral hepatitis reason',options: { acute: 'ahep', chronic: 'ch', immune: 'imm' } },
  insuredPSA:   { label: 'PSA insurability',      options: { insured: 'i', uninsured: 'u' } },
  insuredvitD:  { label: 'Vitamin D insurability',options: { insured: 'i', uninsured: 'u' } },
};

/** Standalone checkbox, not part of a group. */
export const FLAGS = {
  clinician: { label: 'Copy to Clinician/Practitioner', on: 'ohip' },
};

/**
 * The "Other Tests — one test per line" column, in printed top-to-bottom order.
 * Field names are inherited from the row to their left and mean nothing; these
 * are eleven blank free-text lines. Eleven is the hard capacity of one sheet —
 * anything past line 11 has to spill onto a continuation copy.
 */
export const OTHER_TEST_LINES = [
  'Other Tests – one test per line, GC specify source',
  'Other Tests – one test per line, Sputum',
  'Other Tests – one test per line, Throat',
  'Other Tests – one test per line, Wound specify source',
  'Other Tests – one test per line, Urine',
  'Other Tests – one test per line, Stool Culture',
  'Other Tests – one test per line, Stool Ova & Parasites',
  'Other Tests – one test per line, Other Swabs  Pus specify source',
  'Other Tests – one test per line, Row 15',
  'Other Tests – one test per line, Row 16',
  'Other Tests – one test per line, Row 17',
];

export const OTHER_TEST_CAPACITY = OTHER_TEST_LINES.length;

/** Demographic / header text fields: friendly name -> raw AcroForm field name. */
export const TEXT_FIELDS = {
  clinicianName:        'name',
  clinicianAddress:     'address',
  clinicianNumber:      'ClinicianPractitioner Number',
  cpsoNumber:           'CPSO  Registration No',
  urgentContactNumber:  'contactNumber1',
  serviceYear:          'y_birth',
  serviceMonth:         'm_birth',
  serviceDay:           'd_birth',
  healthNumber:         'Health Number',
  healthNumberVersion:  'version',
  dobYear:              'y_birth2',
  dobMonth:             'm_birth2',
  dobDay:               'd_birth2',
  provinceIfNotON:      'Province',
  otherProvincialNumber:'Other Provincial Registration Number',
  patientPhone:         'patientTelephone',
  patientLastName:      'Patient’s Last Name as per OHIP Card',
  patientFirstName:     'patienFname',   // raw name is a typo in the ministry PDF
  patientMiddleNames:   'patienLname',   // ditto — this box is "middle names"
  patientAddress:       'Patient’s Address including Postal Code',
  clinicalInfo:         'Additional Clinical Information eg diagnosis',
  copyToLastName:       'lname',
  copyToFirstName:      'fname',
  copyToAddress:        'address2a',
  collectionTime:       'collectTime',
  collectionDate:       'SCollectionDate',
  signatureDate:        'Date',
};
