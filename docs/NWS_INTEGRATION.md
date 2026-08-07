# National Weather Service integration

DisasterReady reads the public National Weather Service active-alert feed at:

```text
GET https://api.weather.gov/alerts/active?point={latitude},{longitude}
Accept: application/geo+json
```

Native requests include the NWS-required application `User-Agent`. Web requests rely on the browser user agent and send only CORS-safe headers; the public endpoint permits cross-origin GET requests but does not allow custom `X-Application` preflight headers.

## Data boundary

Raw GeoJSON is validated and normalized before it reaches UI code. Malformed features are excluded; an invalid feature collection fails the request. Unknown weather events remain visible as the `other` hazard rather than being silently discarded.

The normalized alert keeps the provider ID, source URL, official text, severity, urgency, certainty, issue/expiry times, retrieval time, and freshness state.

## Polling and failure behavior

- Requests are limited to one per saved location every 30 seconds.
- Each request times out after 10 seconds.
- The last successful response is stored locally with its retrieval timestamp.
- Saved data up to one hour old is labeled saved; older data is labeled stale.
- If live and saved data are both unavailable, the product shows an unavailable state—not an all-clear.
- Alerts that disappear from the active response remain in recent history for up to seven days.

## Action plans

Alert prose never generates safety steps. A deterministic selector uses normalized hazard, status, severity, urgency, and certainty fields to choose a reviewed, source-linked template. Unsupported hazards keep their official instructions and do not receive fabricated steps.

Official references:

- [NWS API documentation](https://www.weather.gov/documentation/services-web-api)
- [NWS alert documentation](https://www.weather.gov/documentation/services-web-alerts)
