import type { BaseEventFields, ClickFields, EventPayload, FormSubmitFields, ScrollFields } from "../../types";
import {
  generateEventId,
  getSessionId,
  getElementText,
  getElementClasses,
  getPageContext,
  getUserContext,
  getTrafficContext,
  getDeviceContext,
  captureAndStoreTrafficParams,
  setPageLoadTime,
  getPageLoadTime,
} from "./utils";
import { version } from "../../../version";

const SESSION_ID = getSessionId();

let _trafficCaptured = false;

function ensureTrafficCaptured(): void {
  if (!_trafficCaptured && typeof window !== "undefined") {
    captureAndStoreTrafficParams();
    setPageLoadTime();
    _trafficCaptured = true;
  }
}

/**
 * Build base event fields shared by all event types.
 * Aligned with planning/events.md schema.
 */
export function basePayload(eventName: string): BaseEventFields {
  ensureTrafficCaptured();

  const now = new Date();
  const loadTime = getPageLoadTime();
  const timeOnPage =
    loadTime !== null ? (Date.now() - loadTime) / 1000 : null;

  const page = getPageContext();
  const user = getUserContext();
  const traffic = getTrafficContext();
  const device = getDeviceContext();

  return {
    event_id: generateEventId(),
    event_timestamp: now.toISOString(),
    event_name: eventName || "spectra_event",
    session_id: SESSION_ID,
    spectra_version: version,
    account_id: window.Spectra?.config?.accountId,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    event_date: now.toISOString().slice(0, 10),
    event_time: now.toISOString().slice(11, 19),
    local_time: now.toLocaleTimeString("en-GB", { hour12: false }) || null,
    time_on_page: timeOnPage,
    ...page,
    ...user,
    ...traffic,
    ...device,
  };
}

/**
 * Create a click event payload from a MouseEvent.
 */
export function createClickPayload(event: MouseEvent): ClickFields & { event_type: 'click' } {
  const target = event.target;
  const tag = target instanceof Element ? target.tagName.toLowerCase() : null;
  const link =
    target instanceof HTMLAnchorElement ? target.getAttribute("href") : null;
  const id = target instanceof Element ? target.getAttribute("id") : null;
  const classes = target instanceof Element ? getElementClasses(target) : null;
  const text = target instanceof Element ? getElementText(target) : null;
  return {
    event_type: 'click',
    element_tag: tag,
    element_id: id,
    element_classes: classes,
    element_text: text,
    element_href: link,
    position_x: Math.round(event.clientX),
    position_y: Math.round(event.clientY),
  };
}

/**
 * Create a scroll event payload from a scroll Event.
 */
export function createScrollPayload(_event: Event): ScrollFields & { event_type: 'scroll' } {
  const scrollY = window.scrollY;
  const pageHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(pageHeight - viewportHeight, 0);
  const scrollDepthPct =
    maxScroll > 0 ? Math.min(100, (scrollY / maxScroll) * 100) : 0;

  return {
    event_type: 'scroll',
    scroll_depth_pct: Math.round(scrollDepthPct * 100) / 100,
    scroll_y: scrollY,
    page_height: pageHeight,
    viewport_height: viewportHeight,
  };
}

/**
 * Create a form submission event payload from a SubmitEvent.
 */
export function createFormSubmitPayload(event: SubmitEvent): FormSubmitFields & { event_type: 'submit' } {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Form submit event target is not a HTMLFormElement");
  }
  const inputs = form.querySelectorAll("input, textarea, select");
  return {
    event_type: 'submit',
    form_id: form.id || null,
    form_action: form.action || null,
    form_method: form.method || null,
    field_count: inputs.length,
  };
}

export function isExternalLink(el: Element): boolean {
  const anchor = el.closest("a");
  if (!anchor?.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  try {
    return new URL(anchor.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Flush queued events to the server. Uses sendBeacon when reliable during
 * page unload; otherwise uses fetch. Defaults to using sendBeacon.
 * Payload: { account_id?: string, api_key?: string, events: [...] }
 * sendBeacon includes account_id and api_key in body (cannot set custom headers);
 * fetch sends X-Account-ID and Authorization: Bearer headers.
 */
export function flush(
  endpoint: string,
  queue: EventPayload[],
  useBeacon: boolean = true,
  accountId?: string,
  apiKey?: string
): void {
  if (queue.length === 0) return;

  try {
    const batch = queue.splice(0, queue.length);
    const payload: { account_id?: string; api_key?: string; events: EventPayload[] } = { events: batch };
    if (accountId) payload.account_id = accountId;
    if (apiKey) payload.api_key = apiKey;
    const body = JSON.stringify(payload);

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: "text/plain" })
      );
    } else {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accountId) headers["X-Account-ID"] = accountId;
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      fetch(endpoint, { method: "POST", headers, body });
    }
  } catch (err) {
    console.warn(
      "[Spectra] Failed to send events:",
      err instanceof Error ? err.message : String(err)
    );
  }
}

/**
 * Prepare an event payload for the server. Ensures required fields
 * (event_id, event_timestamp, event_name, session_id) are present.
 * Does not depend on DOM event types; only validates and merges payloads.
 */
export function prepareEvent(
  eventName: string,
  partialPayload?: Partial<EventPayload> | null
): EventPayload {
  const defaults = basePayload(eventName);
  return {
    ...defaults,
    ...partialPayload,
    event_id: partialPayload?.event_id ?? defaults.event_id,
    event_timestamp: partialPayload?.event_timestamp ?? defaults.event_timestamp,
    event_name: eventName,
    session_id: partialPayload?.session_id ?? defaults.session_id,
  };
}
