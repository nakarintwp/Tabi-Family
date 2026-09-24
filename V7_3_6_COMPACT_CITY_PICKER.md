# V7.3.6 — Compact Multi-City Picker

- Removed the Trip-level **กิจกรรมที่สนใจ** selector from Create Trip, Destinations and Explore.
- Create Trip now focuses on **เมือง / พื้นที่ที่จะไป** only.
- Expanded the destination picker to 42 Japan cities/areas.
- City cards are compact: 2 columns on mobile, 4 on medium screens, 6 on desktop.
- Default route remains Nagoya + Takayama + Shirakawa-go.
- Explore follows the cities stored on the Trip, including cities that do not yet have curated place records.
- No SQL migration is required. Existing `trips.interests` data can remain in Supabase for backward compatibility; the UI no longer uses it.
