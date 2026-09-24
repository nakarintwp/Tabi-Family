# V12.1 — Map display fix

Fixes the zero-height regression that made Explore Map and Trip Map invisible in V12.0.

## Changes
- Removed the later `height:100%` rule that collapsed MapLibre containers inside an auto-height shell.
- Added explicit responsive heights for Explore Map and Trip Map.
- Preserved full-screen map height.
- Added a second MapLibre CDN fallback and a 12-second loader timeout.
- Bumped PWA shell cache to V12.1.
- No SQL migration required.
