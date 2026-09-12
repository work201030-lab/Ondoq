# ONDOQ — Maps & Nearby Clinics

## Current capabilities
- Clinic owners save latitude/longitude from the device GPS.
- Patients can request nearby clinics by radius (5/10/25/50 km).
- Results are sorted by distance.
- Each clinic has Google Maps search and directions links.
- The app now includes an embedded Google Maps panel for a selected clinic.

## Google Maps key
The app can display an embedded Google Maps view without a configured key using a lightweight Google Maps embed URL fallback. For production, configure `VITE_GOOGLE_MAPS_API_KEY` and restrict the key by Android app/package and API usage in Google Cloud. The app continues to provide external Google Maps links even when no key is configured.

## Privacy
Location is requested only when the user taps the location action. Do not request background location.
