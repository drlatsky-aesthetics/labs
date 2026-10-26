/**
 * Fill strategy: AcroForm
 * ======================
 * For requisitions that ship as real PDF forms — write named fields, set widget
 * appearance states. Used by the Ontario lab requisition (4422-84).
 *
 * Shared with the overlay strategy only through the profile shape; the two never
 * need to know about each other.
 */

import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName, PDFButton } from '@cantoo/pdf-lib';

/** Load a blank form, decrypting with an empty user password when needed. */
export async function loadBlank(path) {
  return PDFDocument.load(await readFile(path), { password: '' });
}

/**
 * Set a field to a specific appearance state.
 *
 * Tick boxes are not uniform across ministry forms: on-states may be "/Yes",
 * "/fasting", "/M" — and several multi-widget groups report as checkboxes rather
 * than radio groups. Writing the value and each widget's /AS directly is what a
 * viewer does, and it works for every variant.
 */
export function setState(form, fieldName, state) {
  let field;
  try { field = form.getField(fieldName); } catch { return false; }
  const acro = field.acroField;
  const on = PDFName.of(state);
  acro.dict.set(PDFName.of('V'), on);
  for (const widget of acro.getWidgets()) {
    const normal = widget.getAppearances()?.normal;
    const has = normal && typeof normal.keys === 'function' && normal.keys().some(k => k === on);
    widget.dict.set(PDFName.of('AS'), has ? on : PDFName.of('Off'));
  }
  return true;
}

/** Write a text field, ignoring fields a future edition may have renamed. */
export function setTextField(form, fieldName, value) {
  if (value == null || value === '' || !fieldName) return false;
  try { form.getTextField(fieldName).setText(String(value)); return true; } catch { return false; }
}

/**
 * Prepare a filled form for print/fax: drop interactive buttons, clear rich-text
 * flags pdf-lib refuses to render, and flatten.
 */
export function flattenForPrint(form) {
  for (const field of form.getFields()) {
    if (field instanceof PDFButton) {
      try { form.removeField(field); } catch { /* leave it if the fork won't */ }
    }
  }
  for (const field of form.getFields()) {
    if (typeof field.isRichFormatted === 'function' && field.isRichFormatted()) {
      field.disableRichFormatting();
    }
  }
  form.flatten();
}
