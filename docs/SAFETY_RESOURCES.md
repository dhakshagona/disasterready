# FEMA Safety Resource Integration

## Provider

DisasterReady uses the public FEMA National Shelter System ArcGIS FeatureServer open-shelter layer:

https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/FeatureServer/0

The endpoint is public and does not require a client credential. The application requests feature data near the selected location, with a default search radius of 100 miles.

When Supabase is configured, the client first sends the bounded coordinate query to the `shelter-proxy` Edge Function. The proxy validates the exact request shape, applies per-client and global rate limits, calls the same official FEMA layer, limits response size, and returns the provider payload for client-side normalization. If the proxy fails, the app falls back to the direct public FEMA request. The core shelter flow therefore does not depend on Supabase.

## Normalized fields

The provider boundary validates and normalizes:

- Shelter identity and name
- Reported open, closed, or unknown status
- Street address, city, state, and postal code
- Latitude and longitude
- Last update time
- Evacuation and post-impact capacity when reported
- ADA and wheelchair information when reported
- Pet accommodation notes when reported
- Organization and phone information when reported

Invalid records are discarded instead of being shown as verified resources. Distance is calculated locally from the saved location and results are sorted nearest first.

The Edge Function does not write search coordinates to analytics or PostgreSQL. Analytics records only provider state, result count, and stale status.

## Freshness and failures

Live results are cached by saved location. A cached response older than 30 minutes is marked stale. If both the network and cache are unavailable, the screen says safety resource data is unavailable. It does not present that state as an empty live result.

The FEMA source can legitimately return zero reported open shelters for a search area. DisasterReady presents that as a live empty result, not as an all-clear or proof that no local shelter exists.

## Safety language

Provider records may be delayed or incomplete. The app labels status as reported, links to the official source, displays retrieval freshness, and advises users to confirm availability with local authorities before traveling.
