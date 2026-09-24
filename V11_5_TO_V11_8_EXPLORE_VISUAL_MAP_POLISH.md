# V11.5–V11.8 — Explore Visual & Map Polish

## V11.5 — Real Photos
- Explore cards no longer use emoji/logo artwork as the cover.
- Photos are loaded lazily from Wikimedia Commons using each place name + city.
- If no suitable photo is found, a text-only placeholder is shown instead of a logo.
- Wikimedia Commons source links are shown on the image.

## V11.6 — Multi-photo Gallery
- Up to five Commons photos per place.
- Previous/next buttons and gallery dots.
- Lazy loading begins only when a card is near the viewport to avoid requesting images for every place at once.

## V11.7 — Focus Filters
Visible Explore filters are simplified to:
- อาหาร
- ช้อปปิ้ง
- ธรรมชาติ
- เด็ก
- คนไทยนิยม

Existing city filtering and food sub-filters remain available.

## V11.8 — Add to Trip + Map Polish
- A place can be added to the selected Trip directly from its Explore card.
- When Trip days exist, the user can choose the target day inline.
- If the Trip has no days yet, Add to Trip stores the place in the Trip wishlist so it is not lost.
- Real maps now include street/topographic layer switching, fit-all, loading state, ResizeObserver-based resizing, and fullscreen mode.
- Explore map includes category legend and up to 80 plotted places.

## Snow removal
- The global snowfall component is no longer mounted in `app/layout.tsx`.
- Legacy snow CSS classes are force-disabled for stale cached markup.
- PWA cache version is bumped to V11.8 so older shell assets are discarded on activation.
- Weather forecasts and Weather-aware Planner are unchanged.

## Database
No SQL migration is required for V11.5–V11.8.
