# V12.1 — Version sync + map reliability fix

- Fixes the build chip that was still hard-coded as V11.9.
- Updates Explore build label and offline shell to V12.1.
- Bundles MapLibre GL with the app instead of loading it from unpkg at runtime.
- Keeps OpenFreeMap as the primary vector style.
- Adds an OpenStreetMap raster fallback if the vector style fails to load.
- No Google API key and no Google Cloud billing required.
- No SQL migration required.
