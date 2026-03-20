"""Event models and BigQuery ingestion."""

from pydantic import BaseModel


class Event(BaseModel):
    """Analytics event - aligned with planning/events.md schema."""

    # Base (required)
    event_id: str
    event_timestamp: str
    event_name: str
    session_id: str

    # Base (optional)
    page_url: str | None = None
    user_agent: str | None = None
    spectra_version: str | None = None
    account_id: str | None = None

    # 1. Page Context
    page_title: str | None = None
    page_path: str | None = None
    page_hostname: str | None = None
    referrer: str | None = None
    referrer_domain: str | None = None
    previous_page_url: str | None = None
    page_type: str | None = None
    canonical_url: str | None = None
    language: str | None = None

    # 2. User Context
    user_id: str | None = None
    anonymous_id: str | None = None
    user_type: str | None = None

    # 3. Traffic & Attribution
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_term: str | None = None
    utm_content: str | None = None
    gclid: str | None = None
    fbclid: str | None = None
    ttclid: str | None = None
    traffic_source: str | None = None
    traffic_medium: str | None = None
    campaign_id: str | None = None
    ad_group_id: str | None = None
    creative_id: str | None = None
    landing_page: str | None = None
    first_touch_source: str | None = None
    first_touch_medium: str | None = None
    first_touch_campaign: str | None = None

    # 4. Device & Technical
    device_type: str | None = None
    browser: str | None = None
    browser_version: str | None = None
    operating_system: str | None = None
    os_version: str | None = None
    screen_resolution: str | None = None
    viewport_size: str | None = None
    timezone: str | None = None
    connection_type: str | None = None

    # 5. Timestamp & Timing
    event_date: str | None = None
    event_time: str | None = None
    local_time: str | None = None
    time_on_page: float | None = None

    # Click-specific
    element_tag: str | None = None
    element_id: str | None = None
    element_classes: str | None = None
    element_text: str | None = None
    element_href: str | None = None
    position_x: int | None = None
    position_y: int | None = None

    # Scroll-specific
    scroll_depth_pct: float | None = None
    scroll_y: int | None = None
    page_height: int | None = None
    viewport_height: int | None = None

    # Form-specific
    form_id: str | None = None
    form_action: str | None = None
    form_method: str | None = None
    field_count: int | None = None


def event_to_row(event: Event) -> dict:
    """Convert event to BigQuery row. None stays as null."""
    return event.model_dump()
