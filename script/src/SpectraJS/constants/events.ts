import {
  SPECTRA_FORM_SELECTOR,
  SPECTRA_CLICKABLE_SELECTOR,
  SPECTRA_WINDOW_SELECTOR,
} from './globals';

export const SPECTRA_INIT_EVENT = 'spectra_init';

export const SPECTRA_READY_EVENT = 'spectra_ready';

export const SPECTRA_EVENT = 'spectra_event';
export const SPECTRA_PAGE_SHOW_EVENT = 'spectra_page_view_event';
export const SPECTRA_ERROR_EVENT = 'spectra_error_event';
export const SPECTRA_FORM_EVENT = 'spectra_form_event';
export const SPECTRA_CLICK_EVENT = 'spectra_click_event';
export const SPECTRA_WINDOW_CLICK_EVENT = 'spectra_window_click_event';
export const SPECTRA_FORM_FIELD_EVENT = 'spectra_form_field_event';
export const SPECTRA_SCROLL_EVENT = 'spectra_scroll_event';

export const SPECTRA_CC_READY = 'spectra_cc_ready';

export const SPECTRA_NOTIFICATIONS_READY = 'spectra_notifications_ready';

export const SPECTRA_NOTIFICATIONS_RECEIVED = 'spectra_notification_received';

export const SPECTRA_NOTIFICATIONS_EVENT = 'spectra_notifications_event';

export const SPECTRA_NOTIFICATION_TOKEN_ISSUED = 'notification_token_issued';

export const SPECTRA_GA_EVENTS = {
  ADD_PAYMENT_INFO: 'add_payment_info',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_TO_CART: 'add_to_cart',
  ADD_TO_WISHLIST: 'add_to_wishlist',
  BEGIN_CHECKOUT: 'begin_checkout',
  CHECKOUT_PROGRESS: 'checkout_progress',
  EXCEPTION: 'exception',
  GENERATE_LEAD: 'generate_lead',
  LOGIN: 'login',
  PAGE_VIEW: 'page_view',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  REMOVE_FROM_CART: 'remove_from_cart',
  SCREEN_VIEW: 'screen_view',
  SEARCH: 'search',
  SELECT_CONTENT: 'select_content',
  SELECT_ITEM: 'select_item',
  SELECT_PROMOTION: 'select_promotion',
  SET_CHECKOUT_OPTION: 'set_checkout_option',
  SHARE: 'share',
  SIGN_UP: 'sign_up',
  TIMING_COMPLETE: 'timing_complete',
  VIEW_CART: 'view_cart',
  VIEW_ITEM: 'view_item',
  VIEW_ITEM_LIST: 'view_item_list',
  VIEW_PROMOTION: 'view_promotion',
  VIEW_SEARCH_RESULTS: 'view_search_results',
} as const;

export interface SpectraEventConfig {
  selector: string;
  type: string | string[];
  name: string;
  paramFilter?: (e: Event) => Record<string, unknown>;
}

export const SPECTRA_DEFAULT_EVENTS: SpectraEventConfig[] = [
  {
    selector: SPECTRA_FORM_SELECTOR,
    type: ['submit', 'reset'],
    name: SPECTRA_FORM_EVENT,
  },
  {
    selector: SPECTRA_WINDOW_SELECTOR,
    type: 'pageshow',
    name: SPECTRA_PAGE_SHOW_EVENT,
  },
  {
    selector: SPECTRA_CLICKABLE_SELECTOR,
    type: 'click',
    name: SPECTRA_CLICK_EVENT,
  },
];

export const SPECTRA_SHOPIFY_EVENTS: SpectraEventConfig[] = [
  {
    selector: 'form[action="/cart/add"]',
    type: 'submit',
    name: 'add_to_cart',
  },
  {
    selector: 'form[action="/cart"]',
    type: 'submit',
    name: 'begin_checkout',
  },
  {
    selector: 'form[action="*/checkouts"]',
    type: 'submit',
    name: 'checkout_progress',
  },
];
