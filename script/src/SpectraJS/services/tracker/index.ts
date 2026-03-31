import type { EventPayload, SpectraConfig } from "../../types";
import { flush } from "./helpers";


/** Max events per batch before auto-flush */
const MAX_BATCH = 20;
                  
export interface TrackerConfig {
  /** URL of the events ingest endpoint (e.g. https://api.example.com/track) */
  endpoint?: string;
}

export interface Tracker {
  add: (payload: EventPayload) => void;
  flush: () => void;
}

/**
 * Initialize the Spectra tracker. Call once when the page loads.
 *
 * @param config - Configuration object with the ingest endpoint URL
 * @returns Tracker instance with an `add` method for queueing events
 */
export function initTracker(config: SpectraConfig): Tracker {

  const endpoint = config.endpoint ?? 'https://api.spectrajs.com/track';

  const queue: EventPayload[] = [];

  const accountId = config.accountId;
  const apiKey = config.apiKey;
  const flushWithBeacon = () => flush(endpoint, queue, true, accountId, apiKey);
  const flushWithFetch = () => flush(endpoint, queue, false, accountId, apiKey);

  const tracker: Tracker = {
    add(payload: EventPayload) {
      queue.push(payload);
      if (queue.length >= MAX_BATCH) {
        flushWithBeacon();
      }
    },
    flush: () => {
      flushWithFetch();
    },
  };
  
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushWithFetch();
    }
  });

  window.addEventListener("pagehide", flushWithBeacon);

  return tracker;
}
