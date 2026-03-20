import { EventPayload, LogEvent, type SpectraConfig, type SpectraInstance } from './types';
import { SPECTRA_DEBUG_VAR } from './constants/globals';
import { SPECTRA_MISSING_CONFIG } from './constants/errors';
import { version } from '../version';
import { initTracker } from './services/tracker/index';
import { createClickPayload, createFormSubmitPayload, createScrollPayload, prepareEvent } from './services/tracker/helpers';

function SpectraJS(this: SpectraInstance, config: SpectraConfig): void {

  if (!config) throw new Error(SPECTRA_MISSING_CONFIG);
  
  let _debug = config.debug ?? window.location.search.indexOf(SPECTRA_DEBUG_VAR) > -1;

  const tracker = initTracker(config);
  this.config = config;
  this.version = version;

  this.logEvent = (eventName, eventParams) => {
    const raw = 'object' === typeof eventName
        ? eventName
        : { ...eventParams, event_name: eventName };
    const name = raw.event_name ?? 'spectra_event';
    const payload = prepareEvent(name, raw);
    tracker.add(payload);
    maybeDebug(name, payload);
  }

  this.debug = (bool?: boolean): boolean => ('undefined' === typeof bool ? _debug : (_debug = bool));

  const maybeDebug = (n: string, p?: EventPayload | null): void => {
    if (config.debug) {
      console.log(n)
      console.table(p ?? {})
    }
  }
}

let _instance: SpectraInstance | null = null;

export const init = (config: SpectraConfig): SpectraInstance => {
  if (_instance) return _instance;
  _instance = Object.create(SpectraJS.prototype);
  if (_instance) SpectraJS.call(_instance, config);
  return _instance as SpectraInstance;
}

export const logEvent: LogEvent = (eventName, eventParams) => {
  if (!_instance) return;
  _instance.logEvent(eventName, eventParams);
}

export const utils = {
  createClickPayload: createClickPayload,
  createScrollPayload: createScrollPayload,
  createFormSubmitPayload: createFormSubmitPayload,
}