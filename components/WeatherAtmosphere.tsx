"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

/**
 * V7.1 Snow-only atmosphere.
 *
 * The decorative background intentionally no longer follows live weather.
 * Real weather and Rain Plan remain available on the Weather page, while
 * the app shell keeps the user's preferred snowfall effect at all times.
 *
 * Keeping the existing export name avoids touching layout.tsx and makes
 * this a UI-only upgrade with no database migration.
 */
export function WeatherAtmosphere() {
  const frontFlakes = useMemo(() => Array.from({ length: 34 }, (_, index) => index), []);
  const backFlakes = useMemo(() => Array.from({ length: 26 }, (_, index) => index + 41), []);

  return (
    <div
      className="weather-atmosphere weather-snow snow-only-atmosphere"
      aria-hidden="true"
      data-weather-mode="snow"
    >
      <div className="weather-sky-glow" />

      <div className="weather-particles weather-snowfall snow-depth-back">
        {backFlakes.map((i) => (
          <i
            key={`back-${i}`}
            style={{ "--i": i, left: `${(i * 43 + 11) % 100}%` } as CSSProperties}
          >
            ❄
          </i>
        ))}
      </div>

      <div className="weather-particles weather-snowfall snow-depth-front">
        {frontFlakes.map((i) => (
          <i
            key={`front-${i}`}
            style={{ "--i": i, left: `${(i * 37 + 3) % 100}%` } as CSSProperties}
          >
            ❄
          </i>
        ))}
      </div>
    </div>
  );
}
