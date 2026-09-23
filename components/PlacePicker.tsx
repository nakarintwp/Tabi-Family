"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __tabiGoogleMapsPromise?: Promise<void>;
  }
}

type Props = {
  apiKey?: string;
  name?: string;
  initialName?: string | null;
  initialLat?: number | null;
  initialLng?: number | null;
  placeholder?: string;
};

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__tabiGoogleMapsPromise) return window.__tabiGoogleMapsPromise;

  window.__tabiGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-tabi-google-maps="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.tabiGoogleMaps = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed"));
    document.head.appendChild(script);
  });
  return window.__tabiGoogleMapsPromise;
}

export function PlacePicker({ apiKey, name = "location_name", initialName, initialLat, initialLng, placeholder = "ค้นหาสถานที่ในญี่ปุ่น" }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lat, setLat] = useState(initialLat == null ? "" : String(initialLat));
  const [lng, setLng] = useState(initialLng == null ? "" : String(initialLng));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let listener: any;
    let autocomplete: any;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name", "place_id"],
          componentRestrictions: { country: "jp" },
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const location = place?.geometry?.location;
          if (!location) return;
          setLat(String(location.lat()));
          setLng(String(location.lng()));
          if (inputRef.current && (place.name || place.formatted_address)) {
            inputRef.current.value = place.name || place.formatted_address;
          }
        });
        setReady(true);
      })
      .catch(() => setReady(false));

    return () => {
      cancelled = true;
      if (listener?.remove) listener.remove();
    };
  }, [apiKey]);

  return (
    <div className="place-picker">
      <input
        id={id}
        ref={inputRef}
        className="input"
        name={name}
        defaultValue={initialName || ""}
        placeholder={placeholder}
        autoComplete="off"
        onChange={() => {
          setLat("");
          setLng("");
        }}
      />
      <input type="hidden" name="latitude" value={lat} readOnly />
      <input type="hidden" name="longitude" value={lng} readOnly />
      {apiKey ? <small className="place-hint">{ready ? "✓ Google Places พร้อมค้นหา" : "กำลังโหลด Google Places..."}</small> : <small className="place-hint">เพิ่ม Google Maps API key เพื่อเปิดค้นหาสถานที่อัตโนมัติ</small>}
    </div>
  );
}
