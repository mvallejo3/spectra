declare global {
  interface Window {
    Spectra: SpectraInstance;
  }
}

export type LogEvent = (eventName: string, eventParams?: EventPayload | null) => void;

export interface SpectraInstance {
  version: string;
  config: SpectraConfig;
  init: (config: SpectraConfig) => SpectraInstance;
  logEvent: LogEvent;
  debug: (bool?: boolean) => boolean;
}
export interface SpectraConfig {
  debug?: boolean;
  endpoint?: string;
  accountId: string;
  apiKey?: string;
}


/** Page context (planning/events.md §1) */
export interface PageContext {
  page_title: string | null;
  page_path: string | null;
  page_hostname: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  previous_page_url: string | null;
  page_type: string | null;
  canonical_url: string | null;
  language: string | null;
}

/** User context (planning/events.md §2) */
export interface UserContext {
  user_id: string | null;
  anonymous_id: string | null;
  user_type: "new" | "returning" | null;
}

/** Traffic & attribution (planning/events.md §3) */
export interface TrafficContext {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  traffic_source: string | null;
  traffic_medium: string | null;
  campaign_id: string | null;
  ad_group_id: string | null;
  creative_id: string | null;
  landing_page: string | null;
  first_touch_source: string | null;
  first_touch_medium: string | null;
  first_touch_campaign: string | null;
  a_token: string | null;
}

/** Device & technical (planning/events.md §4) */
export interface DeviceContext {
  device_type: string | null;
  browser: string | null;
  browser_version: string | null;
  operating_system: string | null;
  os_version: string | null;
  screen_resolution: string | null;
  viewport_size: string | null;
  timezone: string | null;
  connection_type: string | null;
}

/** Timestamp & timing (planning/events.md §5) */
export interface TimingContext {
  event_timestamp: string;
  event_date: string | null;
  event_time: string | null;
  local_time: string | null;
  time_on_page: number | null;
}

/** Required fields for every event */
export interface RequiredEventFields {
  event_id: string;
  event_timestamp: string;
  event_name: string;
  session_id: string;
}

/** Base fields present on all events (required + optional) */
export interface BaseEventFields
  extends RequiredEventFields,
    Partial<PageContext>,
    Partial<UserContext>,
    Partial<TrafficContext>,
    Partial<DeviceContext>,
    Partial<Omit<TimingContext, "event_timestamp">> {
  spectra_version?: string | null;
  account_id?: string | null;
  page_url?: string | null;
  user_agent?: string | null;
}

/** Click-specific fields */
export interface ClickFields {
  element_tag: string | null;
  element_id: string | null;
  element_classes: string | null;
  element_text: string | null;
  element_href: string | null;
  position_x: number | null;
  position_y: number | null;
}

/** Scroll-specific fields */
export interface ScrollFields {
  scroll_depth_pct: number | null;
  scroll_y: number | null;
  page_height: number | null;
  viewport_height: number | null;
}

/** Form-specific fields */
export interface FormSubmitFields {
  form_id: string | null;
  form_action: string | null;
  form_method: string | null;
  field_count: number | null;
}

/** Full event payload sent to the server */
export type EventPayload = Partial<BaseEventFields> &
  Partial<ClickFields> &
  Partial<ScrollFields> &
  Partial<FormSubmitFields>;
