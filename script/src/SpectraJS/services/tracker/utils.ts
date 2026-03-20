import type {
  PageContext,
  UserContext,
  TrafficContext,
  DeviceContext,
} from "../../types";

const MAX_TEXT_LENGTH = 100;
const MAX_CLASSES_LENGTH = 200;

const ANON_KEY = "spectra_anonymous_id";
const FIRST_VISIT_KEY = "spectra_first_visit";

// Cached regex for parseDeviceContext (avoid re-instantiation per event)
const RE_DEVICE_MOBILE = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i;
const RE_DEVICE_TABLET = /tablet|ipad|playbook|silk/i;
const RE_BROWSER_CHROME = /(?:chrome|chromium|crios)\/(\d+)/i;
const RE_BROWSER_FIREFOX = /(?:firefox|fxios)\/(\d+)/i;
const RE_BROWSER_SAFARI = /version\/(\d+).*safari/i;
const RE_BROWSER_EDGE = /edg\/(\d+)/i;
const RE_BROWSER_MSIE = /(?:msie|trident\/\d+; rv:)(\d+)/i;
const RE_WS = /\s/g;
const RE_OS_WIN10 = /windows nt 10/i;
const RE_OS_WIN11 = /windows nt 11/i;
const RE_OS_MAC = /mac os x/i;
const RE_OS_MAC_VER = /mac os x (\d+[._]\d+)/i;
const RE_OS_IOS = /iphone|ipad|ipod/i;
const RE_OS_IOS_VER = /os (\d+[._]\d+)/i;
const RE_OS_ANDROID = /android/i;
const RE_OS_ANDROID_VER = /android (\d+\.?\d*)/i;
const RE_OS_LINUX = /linux/i;
const RE_UUID_XY = /[xy]/g;

let _pageLoadTime: number | null = null;

export function setPageLoadTime(): void {
  if (_pageLoadTime === null) {
    const perf = typeof performance !== "undefined" ? performance : null;
    const timing = perf && "timing" in perf ? (perf as Performance & { timing?: { navigationStart?: number } }).timing : null;
    _pageLoadTime = timing?.navigationStart ?? Date.now();
  }
}

export function getPageLoadTime(): number | null {
  if (_pageLoadTime === null) setPageLoadTime();
  return _pageLoadTime;
}

/**
 * Generate a UUID v4 for event deduplication.
 */
export function generateEventId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(RE_UUID_XY, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a session ID stored in sessionStorage.
 */
export function getSessionId(): string {
  const key = "spectra_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = generateEventId();
    sessionStorage.setItem(key, id);
  }
  return id;
}

/**
 * Get or create an anonymous ID in localStorage (persists across sessions).
 */
export function getAnonymousId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = generateEventId();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return generateEventId();
  }
}

/**
 * Determine user_type: "new" if first visit this session, else "returning".
 */
export function getUserType(): "new" | "returning" {
  try {
    const first = sessionStorage.getItem(FIRST_VISIT_KEY);
    if (!first) {
      sessionStorage.setItem(FIRST_VISIT_KEY, "1");
      return "new";
    }
    return "returning";
  } catch {
    return "new";
  }
}

/**
 * Get domain from URL string.
 */
function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Parse UTM and attribution params from current URL; persist for session.
 */
function getStoredTrafficParams(): TrafficContext {
  const get = (key: string): string | null =>
    sessionStorage.getItem(`spectra_${key}`);

  return {
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_term: get("utm_term"),
    utm_content: get("utm_content"),
    gclid: get("gclid"),
    fbclid: get("fbclid"),
    ttclid: get("ttclid"),
    traffic_source: get("traffic_source"),
    traffic_medium: get("traffic_medium"),
    campaign_id: get("campaign_id"),
    ad_group_id: get("ad_group_id"),
    creative_id: get("creative_id"),
    landing_page: get("landing_page"),
    first_touch_source: get("first_touch_source"),
    first_touch_medium: get("first_touch_medium"),
    first_touch_campaign: get("first_touch_campaign"),
  };
}

/**
 * Capture UTM and attribution from URL and store in sessionStorage (call on page load).
 */
export function captureAndStoreTrafficParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const set = (key: string, val: string | null) => {
    if (val) sessionStorage.setItem(`spectra_${key}`, val);
  };
  set("utm_source", params.get("utm_source"));
  set("utm_medium", params.get("utm_medium"));
  set("utm_campaign", params.get("utm_campaign"));
  set("utm_term", params.get("utm_term"));
  set("utm_content", params.get("utm_content"));
  set("gclid", params.get("gclid"));
  set("fbclid", params.get("fbclid"));
  set("ttclid", params.get("ttclid"));
  set("traffic_source", params.get("utm_source"));
  set("traffic_medium", params.get("utm_medium"));
  set("campaign_id", params.get("campaign_id"));
  set("ad_group_id", params.get("ad_group_id"));
  set("creative_id", params.get("creative_id"));

  if (!sessionStorage.getItem("spectra_landing_page")) {
    sessionStorage.setItem("spectra_landing_page", window.location.href);
  }
  if (!sessionStorage.getItem("spectra_first_touch_source")) {
    const utmSource = params.get("utm_source");
    if (utmSource) sessionStorage.setItem("spectra_first_touch_source", utmSource);
  }
  if (!sessionStorage.getItem("spectra_first_touch_medium")) {
    const utmMedium = params.get("utm_medium");
    if (utmMedium) sessionStorage.setItem("spectra_first_touch_medium", utmMedium);
  }
  if (!sessionStorage.getItem("spectra_first_touch_campaign")) {
    const utmCampaign = params.get("utm_campaign");
    if (utmCampaign) sessionStorage.setItem("spectra_first_touch_campaign", utmCampaign);
  }
}

/**
 * Parse device/browser from navigator and simple UA heuristics.
 */
function parseDeviceContext(): DeviceContext {
  const ua = navigator.userAgent;
  let deviceType: string = "desktop";
  if (RE_DEVICE_MOBILE.test(ua)) {
    deviceType = "mobile";
  } else if (RE_DEVICE_TABLET.test(ua)) {
    deviceType = "tablet";
  }

  let browser = "unknown";
  let browserVersion = "";
  const m = ua.match(RE_BROWSER_CHROME) ||
    ua.match(RE_BROWSER_FIREFOX) ||
    ua.match(RE_BROWSER_SAFARI) ||
    ua.match(RE_BROWSER_EDGE) ||
    ua.match(RE_BROWSER_MSIE);
  if (m && m[0]) {
    const parts = m[0].split("/");
    const name = parts[0]?.toLowerCase() ?? "";
    const idx = name ? ua.toLowerCase().indexOf(name) : -1;
    const sliced = idx >= 0 ? ua.slice(idx).split("/")[0] : "";
    browser = (sliced ?? "").toLowerCase().replace(RE_WS, "_") || "unknown";
    browserVersion = m[1] ?? "";
  }

  let os = "unknown";
  let osVersion = "";
  if (RE_OS_WIN10.test(ua)) {
    os = "windows";
    osVersion = "10";
  } else if (RE_OS_WIN11.test(ua)) {
    os = "windows";
    osVersion = "11";
  } else if (RE_OS_MAC.test(ua)) {
    os = "macos";
    const v = ua.match(RE_OS_MAC_VER);
    osVersion = (v?.[1] ?? "").replace("_", ".");
  } else if (RE_OS_IOS.test(ua)) {
    os = "ios";
    const v = ua.match(RE_OS_IOS_VER);
    osVersion = (v?.[1] ?? "").replace("_", ".");
  } else if (RE_OS_ANDROID.test(ua)) {
    os = "android";
    const v = ua.match(RE_OS_ANDROID_VER);
    osVersion = v?.[1] ?? "";
  } else if (RE_OS_LINUX.test(ua)) os = "linux";

  let conn: string | null = null;
  const nav = navigator as Navigator & { connection?: { effectiveType?: string } };
  if (nav.connection?.effectiveType) {
    conn = nav.connection.effectiveType;
  }

  return {
    device_type: deviceType,
    browser: browser || null,
    browser_version: browserVersion || null,
    operating_system: os || null,
    os_version: osVersion || null,
    screen_resolution:
      typeof screen !== "undefined"
        ? `${screen.width}x${screen.height}`
        : null,
    viewport_size:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : null,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
    connection_type: conn,
  };
}

/**
 * Truncate a string to maxLength, appending ellipsis if truncated.
 */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 3) + "...";
}

/**
 * Safely get inner text from an element, truncated.
 */
export function getElementText(element: Element): string {
  const text = element.textContent?.trim() ?? "";
  return truncate(text, MAX_TEXT_LENGTH);
}

/**
 * Safely get class attribute, truncated.
 */
export function getElementClasses(element: Element): string {
  const classes = element.getAttribute("class") ?? "";
  return truncate(classes, MAX_CLASSES_LENGTH);
}

/** Cached context (computed once per page) */
let _pageContext: PageContext | null = null;
let _deviceContext: DeviceContext | null = null;

export function getPageContext(): PageContext {
  if (_pageContext) return _pageContext;
  const ref = document.referrer || "";
  const path = window.location.pathname || null;
  const canonical =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
  const isHomePage = path === "/" || path === "" || path === "/index.html";
  _pageContext = {
    page_title: document.title || null,
    page_path: path,
    page_hostname: window.location.hostname || null,
    referrer: ref || null,
    referrer_domain: ref ? getDomain(ref) : null,
    previous_page_url: ref || null,
    page_type: isHomePage ? "home" : "page",
    canonical_url: canonical,
    language: navigator.language || null,
  };
  return _pageContext;
}

export function getUserContext(): UserContext {
  return {
    user_id: null,
    anonymous_id: getAnonymousId(),
    user_type: getUserType(),
  };
}

export function getTrafficContext(): TrafficContext {
  return getStoredTrafficParams();
}

export function getDeviceContext(): DeviceContext {
  if (_deviceContext) return _deviceContext;
  _deviceContext = parseDeviceContext();
  return _deviceContext;
}
