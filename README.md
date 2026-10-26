# Lab requisitions under Dr. Latsky

A one-page website that prepares the Ontario Ministry of Health **Laboratory
Requisition, form 4422-84 (2026/04)**, printed under:

> **Dr. Jason Latsky** · 2896 Dundas Street W, Toronto ON M6P 1Y8
> Billing 052360 · CPSO 143244

It is for an allied provider to fill in the patient and the tests, print the
form, and have Dr. Latsky sign it. It is not an EMR: nothing is stored, no
patient list, no login. The page sends one order, gets one PDF back, and that
is all.

## What it does

1. **Patient** — name as on the health card, date of birth, sex, health number
   and version code, address, phone, payer (OHIP / uninsured / WSIB).
2. **Tests** — every tick box on the form, grouped as printed (Biochemistry,
   Hematology, Immunology, Microbiology, Viral Hepatitis, PSA), the vitamin D
   insured / uninsured choice, and the eleven "Other Tests" free-text lines
   with quick-add chips for common tests. A twelfth line prints a second sheet.
3. **Clinical information**, date of service, the date beside the signature,
   and an optional "copy of results to" block so the lab also sends the report
   to the provider.
4. **Print** — the ministry's own PDF, filled and flattened, previewed on the
   page with Print / Download / Open buttons.

The form's own rules are enforced before anything prints: glucose needs Random
or Fasting; a hepatitis box needs Acute, Chronic or Immune status; PSA needs
Insured or Uninsured; Chlamydia, GC, Wound and Other Swabs need a specimen
source.

The **signature box is always left empty.** The PDF is unsigned; Dr. Latsky
signs by hand after review.

## Running it

```bash
npm install
npm start          # http://localhost:3000
npm run verify     # form map vs. the ministry PDF, builder rules, end-to-end fill
npm run demo       # writes out/demo.pdf
```

Node 18 or newer. One dependency, `@cantoo/pdf-lib`, which opens the
ministry's encrypted-with-an-empty-password form.

### On Vercel

The repo deploys as-is: `public/` is static and `api/requisition.js` is a
serverless function (`vercel.json` makes sure the PDF ships with it).

### Changing the clinician block

`config.js`, or environment variables `CLINICIAN_NAME`, `CLINICIAN_ADDRESS`,
`CLINICIAN_BILLING`, `CLINICIAN_CPSO`, `CLINICIAN_PHONE` (urgent contact
number, blank by default). The browser cannot change it.

## Layout

```
public/index.html      the page
api/requisition.js     GET: form description · POST: the filled PDF
config.js              who it prints under
lib/form-map.js        ministry PDF field names ↔ clinical meaning (ground truth)
lib/build.js           ticked boxes + lines → plan, with the form's rules
lib/fill.js            plan → filled, flattened PDF (one page per sheet)
lib/acroform.js        load the encrypted blank, set states, flatten
lib/forms/on-4422-84.pdf   the ministry's file, byte-for-byte
scripts/verify-forms.mjs   every mapped field exists in the PDF
scripts/verify-build.mjs   builder rules and a two-sheet render
```

`form-map.js`, `fill.js` and `acroform.js` are copied from the Orilume MD EMR's
`lib/lab-requisition/` module. If the ministry reissues the form, re-derive the
map there and copy it over; `verify-forms.mjs` fails until it matches.
