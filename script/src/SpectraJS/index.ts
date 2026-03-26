import { EventPayload, LogEvent, SpectraConfig, SpectraInstance } from './types';
import { SPECTRA_MISSING_CONFIG } from './constants/errors';
import { version } from '../version';
import { initTracker, Tracker } from './services/tracker/index';
import { createClickPayload, createFormSubmitPayload, createScrollPayload, prepareEvent } from './services/tracker/helpers';

let tracker: Tracker | null = null;
let config: SpectraConfig | null = null;

const maybeDebug = (p?: EventPayload | null): void => {
  if (config?.debug) {
    console.table(p ?? {})
  }
}

export const init = (conf: SpectraConfig): SpectraInstance => {
  if (!conf) throw new Error(SPECTRA_MISSING_CONFIG);
  config = conf;
  tracker = initTracker(config);
  if (!tracker) throw new Error("SPECTRA_MISSING_TRACKER");
  return {
    version: version,
    config: config,
    init: init,
    debug: debug,
    logEvent: logEvent
  }
}

export const debug = (bool?: boolean): boolean => {
  if (!config) throw new Error(SPECTRA_MISSING_CONFIG);
  return 'undefined' === typeof bool ? !!config.debug : (config.debug = bool);
}

export const logEvent: LogEvent = (eventName, eventParams) => {
  if (!config) throw new Error(SPECTRA_MISSING_CONFIG);
  if (!tracker) throw new Error("SPECTRA_MISSING_TRACKER");
  const raw = 'object' === typeof eventName
    ? eventName
    : { ...eventParams, event_name: eventName };
  const name = raw.event_name ?? 'spectra_event';
  const payload = prepareEvent(name, raw);
  tracker.add(payload);
  maybeDebug(payload);
}

export const utils = {
  createClickPayload: createClickPayload,
  createScrollPayload: createScrollPayload,
  createFormSubmitPayload: createFormSubmitPayload,
}
