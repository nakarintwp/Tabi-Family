"use client";

import { useId, useRef, useState } from "react";

type Props = {
  apiKey?: string;
  name?: string;
  initialName?: string | null;
  initialLat?: number | null;
  initialLng?: number | null;
  placeholder?: string;
};

type SearchResult = { id: string; name: string; lat: number; lng: number; type?: string };

export function PlacePicker({ name = "location_name", initialName, initialLat, initialLng, placeholder = "ค้นหาสถานที่ในญี่ปุ่น" }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [lat, setLat] = useState(initialLat == null ? "" : String(initialLat));
  const [lng, setLng] = useState(initialLng == null ? "" : String(initialLng));
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("กดค้นหาเมื่อพิมพ์ชื่อสถานที่ · ไม่ค้นหาอัตโนมัติ");

  async function searchPlace() {
    const q = inputRef.current?.value.trim() || "";
    if (q.length < 2 || loading) return;
    setLoading(true);
    setResults([]);
    setMessage("กำลังค้นหา…");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await response.json();
      const next = Array.isArray(data?.results) ? data.results : [];
      setResults(next);
      setMessage(next.length ? `พบ ${next.length} รายการ · แตะเพื่อเลือก` : "ไม่พบสถานที่ ลองใช้ชื่ออังกฤษหรือชื่อเมืองร่วมด้วย");
    } catch {
      setMessage("ค้นหาสถานที่ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  function choose(result: SearchResult) {
    setLat(String(result.lat));
    setLng(String(result.lng));
    if (inputRef.current) inputRef.current.value = result.name;
    setResults([]);
    setMessage("✓ เลือกพิกัดแล้ว");
  }

  return (
    <div className="place-picker openstreetmap-place-picker">
      <div className="place-search-row">
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
            setResults([]);
            setMessage("กดค้นหาเมื่อพิมพ์ชื่อสถานที่ · ไม่ค้นหาอัตโนมัติ");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchPlace();
            }
          }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void searchPlace()} disabled={loading}>
          {loading ? "ค้นหา…" : "ค้นหา"}
        </button>
      </div>
      <input type="hidden" name="latitude" value={lat} readOnly />
      <input type="hidden" name="longitude" value={lng} readOnly />
      <small className="place-hint">{message}</small>
      {results.length > 0 && (
        <div className="place-search-results" role="listbox" aria-label="ผลการค้นหาสถานที่">
          {results.map((result) => (
            <button key={result.id} type="button" onClick={() => choose(result)}>
              <strong>{result.name.split(",")[0]}</strong>
              <span>{result.name}</span>
            </button>
          ))}
          <small>Search data © OpenStreetMap contributors</small>
        </div>
      )}
    </div>
  );
}
