-- BigQuery table schema for Spectra analytics events
-- Aligned with planning/events.md. Run in BigQuery (replace dataset as needed).

CREATE TABLE IF NOT EXISTS `analytics.events` (
  -- Base (required)
  event_id STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  event_name STRING NOT NULL,
  session_id STRING NOT NULL,
  -- Base (optional)
  page_url STRING,
  user_agent STRING,
  spectra_version STRING,
  account_id STRING,
  -- 1. Page Context
  page_title STRING,
  page_path STRING,
  page_hostname STRING,
  referrer STRING,
  referrer_domain STRING,
  previous_page_url STRING,
  page_type STRING,
  canonical_url STRING,
  language STRING,
  -- 2. User Context
  user_id STRING,
  anonymous_id STRING,
  user_type STRING,
  -- 3. Traffic & Attribution
  utm_source STRING,
  utm_medium STRING,
  utm_campaign STRING,
  utm_term STRING,
  utm_content STRING,
  gclid STRING,
  fbclid STRING,
  ttclid STRING,
  traffic_source STRING,
  traffic_medium STRING,
  campaign_id STRING,
  ad_group_id STRING,
  creative_id STRING,
  landing_page STRING,
  first_touch_source STRING,
  first_touch_medium STRING,
  first_touch_campaign STRING,
  -- 4. Device & Technical
  device_type STRING,
  browser STRING,
  browser_version STRING,
  operating_system STRING,
  os_version STRING,
  screen_resolution STRING,
  viewport_size STRING,
  timezone STRING,
  connection_type STRING,
  -- 5. Timestamp & Timing
  event_date STRING,
  event_time STRING,
  local_time STRING,
  time_on_page FLOAT64,
  -- Click
  element_tag STRING,
  element_id STRING,
  element_classes STRING,
  element_text STRING,
  element_href STRING,
  position_x INT64,
  position_y INT64,
  -- Scroll
  scroll_depth_pct FLOAT64,
  scroll_y FLOAT64,
  page_height INT64,
  viewport_height INT64,
  -- Form
  form_id STRING,
  form_action STRING,
  form_method STRING,
  field_count INT64
);
