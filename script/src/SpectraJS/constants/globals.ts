export const SPECTRA_DEBUG_VAR = '_spectraDebug';

export const SPECTRA_WINDOW_SELECTOR = 'window';
export const SPECTRA_DOCUMENT_SELECTOR = 'document';
export const SPECTRA_CLICKABLE_SELECTOR = 'button, a, input[type="submit"]';
export const SPECTRA_FORM_SELECTOR = 'form';
export const SPECTRA_FORM_FIELD_SELECTOR = 'input:not([type="submit"]):not([type="password"]), select';

export const SPECTRA_HTML_TAGNAME = {
  FORM: 'FORM',
  BTN: 'BUTTON',
  INPUT: 'INPUT',
  LINK: 'A',
} as const;

export const SPECTRA_BANNED_INPUT_TYPES = ['password'] as const;
