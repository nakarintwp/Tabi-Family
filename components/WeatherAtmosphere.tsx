"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type WeatherMode = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

type AtmosphereState = {
  mode: WeatherMode;
  temperature: number | null;
  code: number | null;
  updatedAt: number;
};

const CACHE_KEY = "tabi-weather-atmosphere-v1";
const CACHE_TTL = 20 * 60 * 1000;

function modeFromWeather(code: number, rain: number, snowfall: number, cloudCover: number): WeatherMode {
  if (snowfall > 0 || [71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  if (rain > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([45, 48].includes(code)) return "fog";
  if ([1, 2, 3].includes(code) || cloudCover >= 45) return "cloudy";
  return "clear";
}

function iconForMode(mode: WeatherMode) {
  if (mode === "snow") return "🌨️";
  if (mode === "rain") return "🌧️";
  if (mode === "storm") return "⛈️";
  if (mode === "fog") return "🌫️";
  if (mode === "cloudy") return "☁️";
  return "☀️";
}

function labelForMode(mode: WeatherMode) {
  if (mode === "snow") return "หิมะ";
  if (mode === "rain") return "ฝน";
  if (mode === "storm") return "พายุ";
  if (mode === "fog") return "หมอก";
  if (mode === "cloudy") return "มีเมฆ";
  return "แจ่มใส";
}

function readCache(): AtmosphereState | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AtmosphereState;
    if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(value: AtmosphereState) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable in private/restricted browsers; visual fallback still works.
  }
}

async function fetchCurrentWeather(latitude: number, longitude: number): Promise<AtmosphereState> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,rain,snowfall,cloud_cover");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("weather request failed");
  const json = await response.json();
  const current = json?.current;
  const code = Number(current?.weather_code ?? 0);
  const rain = Number(current?.rain ?? 0);
  const snowfall = Number(current?.snowfall ?? 0);
  const cloudCover = Number(current?.cloud_cover ?? 0);
  const temperature = Number.isFinite(Number(current?.temperature_2m)) ? Number(current.temperature_2m) : null;

  return {
    mode: modeFromWeather(code, rain, snowfall, cloudCover),
    temperature,
    code,
    updatedAt: Date.now(),
  };
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

export function WeatherAtmosphere() {
  const [weather, setWeather] = useState<AtmosphereState>({
    mode: "clear",
    temperature: null,
    code: null,
    updatedAt: 0,
  });
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setWeather(cached);
      setLive(true);
    }

    async function updateWeather() {
      try {
        // If the user already granted location permission, update silently.
        // If the permission state is unknown/prompt, request once because this feature explicitly follows local weather.
        if ("permissions" in navigator && navigator.permissions?.query) {
          try {
            const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
            if (permission.state === "denied") return;
          } catch {
            // Some mobile browsers do not support querying geolocation permission. Continue to normal geolocation.
          }
        }

        const position = await getPosition();
        const next = await fetchCurrentWeather(position.coords.latitude, position.coords.longitude);
        if (cancelled) return;
        setWeather(next);
        setLive(true);
        saveCache(next);
      } catch {
        // Keep cached/default atmosphere if location or weather is unavailable.
      }
    }

    // Cache prevents unnecessary location/weather calls while navigating between pages.
    if (!cached) updateWeather();
    else {
      const refreshDelay = Math.max(1000, CACHE_TTL - (Date.now() - cached.updatedAt));
      const timer = window.setTimeout(updateWeather, refreshDelay);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => index), []);

  return (
    <>
      <div className={`weather-atmosphere weather-${weather.mode}`} aria-hidden="true" data-weather-mode={weather.mode}>
        <div className="weather-sky-glow" />

        {(weather.mode === "clear" || weather.mode === "cloudy") && (
          <>
            <span className="cartoon-bubble bubble-a" />
            <span className="cartoon-bubble bubble-b" />
            <span className="cartoon-bubble bubble-c" />
            <span className="cartoon-bubble bubble-d" />
            <span className="cartoon-spark spark-a">✦</span>
            <span className="cartoon-spark spark-b">✧</span>
            <span className="cartoon-spark spark-c">✦</span>
          </>
        )}

        {(weather.mode === "cloudy" || weather.mode === "rain" || weather.mode === "storm" || weather.mode === "snow") && (
          <>
            <span className="weather-cloud weather-cloud-a" />
            <span className="weather-cloud weather-cloud-b" />
            <span className="weather-cloud weather-cloud-c" />
          </>
        )}

        {weather.mode === "fog" && (
          <>
            <span className="fog-band fog-band-a" />
            <span className="fog-band fog-band-b" />
            <span className="fog-band fog-band-c" />
          </>
        )}

        {weather.mode === "snow" && (
          <div className="weather-particles weather-snowfall">
            {particles.map((i) => <i key={i} style={{ "--i": i, left: `${(i * 37) % 100}%` } as CSSProperties}>❄</i>)}
          </div>
        )}

        {(weather.mode === "rain" || weather.mode === "storm") && (
          <div className="weather-particles weather-rainfall">
            {particles.map((i) => <i key={i} style={{ "--i": i, left: `${(i * 37) % 100}%` } as CSSProperties} />)}
          </div>
        )}

        {weather.mode === "storm" && <span className="weather-lightning" />}
      </div>

      {live && (
        <div className="live-weather-chip" title="เอฟเฟกต์พื้นหลังอิงสภาพอากาศจากตำแหน่งปัจจุบัน">
          <span>{iconForMode(weather.mode)}</span>
          <strong>{weather.temperature === null ? labelForMode(weather.mode) : `${Math.round(weather.temperature)}°`}</strong>
          <small>{labelForMode(weather.mode)}</small>
        </div>
      )}
    </>
  );
}
