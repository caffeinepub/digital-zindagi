# Digital Zindagi

## Current State
- App has active providers loaded via `useActiveProviders()` (from backend) and also stored in `dz_providers` localStorage
- HomePage shows up to 6 featured providers without any location filtering
- CategoryPage shows all providers for a given category, no location filter
- ProviderCard shows WhatsApp and Contact buttons; no navigation/directions button
- SignupPage saves provider registration data to `dz_providers` localStorage; no GPS fields
- `ProviderProfile` backend type has `address: string` but no `lat`/`lng` fields
- There is an existing Search bar on the homepage that navigates to `/search`
- No GPS or geolocation logic exists anywhere

## Requested Changes (Diff)

### Add
- `useUserLocation` hook: requests browser GPS permission on mount, returns `{ lat, lng, status, error }`
- `locationUtils.ts`: Haversine distance calculation function `getDistanceKm(lat1,lng1,lat2,lng2)`
- GPS location in provider localStorage data: `lat` and `lng` fields stored when provider detects shop location
- 'Detect My Shop Location' button in SignupPage provider form: uses browser GPS to capture & save shop lat/lng
- 'Get Directions' button on ProviderCard: opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` in new tab
- 2KM radius filter on HomePage for featured providers section
- Fallback logic: if 0 providers within 2KM, show message and expand to 5KM then 10KM
- Search bar on HomePage enhanced to also filter by shop name, category (already exists but just navigates to /search — keep it)
- Category + Location Sync: CategoryPage filters providers by location (2KM → 5KM fallback)
- Location status indicator: small pill showing 'GPS चालू है' or 'Location Off'

### Modify
- `SignupPage.tsx`: add lat/lng to provider registration data; add 'Detect My Shop Location' GPS button
- `HomePage.tsx`: add location-based filtering for featuredProviders; show radius fallback message
- `CategoryPage.tsx`: add location-based filtering for category providers
- `ProviderCard.tsx`: add 'Get Directions' button that links to Google Maps

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/utils/locationUtils.ts` — Haversine formula + distance helper
2. Create `src/frontend/src/hooks/useUserLocation.ts` — GPS permission + coordinates hook
3. Update `SignupPage.tsx` — add lat/lng state, 'Detect My Shop Location' button, save to localStorage
4. Update `ProviderCard.tsx` — accept optional `distance` prop, add 'Get Directions' button when lat/lng available on profile
5. Update `HomePage.tsx` — import useUserLocation, filter featuredProviders by 2KM radius, fallback messaging, pass distance to ProviderCard
6. Update `CategoryPage.tsx` — import useUserLocation, filter providers by 2KM radius with fallback
