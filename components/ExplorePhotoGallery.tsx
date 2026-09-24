"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CommonsPhoto = {
  url: string;
  sourceUrl: string;
  fileTitle: string;
};

type CommonsPage = {
  pageid?: number;
  title?: string;
  index?: number;
  imageinfo?: Array<{ thumburl?: string; url?: string }>;
};

const BLOCKED_IMAGE_WORDS = /\b(logo|icon|map|flag|diagram|seal|coat of arms|symbol|route map|location map)\b/i;

async function searchCommons(query: string): Promise<CommonsPhoto[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1280",
    format: "json",
    origin: "*",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
    cache: "force-cache",
  });
  if (!response.ok) throw new Error("Wikimedia Commons request failed");

  const payload = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } };
  const pages = Object.values(payload.query?.pages || {})
    .sort((a, b) => Number(a.index || 999) - Number(b.index || 999));

  const seen = new Set<string>();
  const rows: CommonsPhoto[] = [];
  for (const page of pages) {
    const fileTitle = String(page.title || "");
    if (!fileTitle || BLOCKED_IMAGE_WORDS.test(fileTitle)) continue;
    const info = page.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    rows.push({
      url,
      fileTitle,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle.replaceAll(" ", "_"))}`,
    });
    if (rows.length >= 5) break;
  }
  return rows;
}

export function ExplorePhotoGallery({
  title,
  city,
  searchQuery,
}: {
  title: string;
  city: string;
  searchQuery?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [photos, setPhotos] = useState<CommonsPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const query = useMemo(() => (searchQuery || `${title} ${city} Japan`).replaceAll("·", " ").trim(), [searchQuery, title, city]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "320px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    searchCommons(query)
      .then(async (rows) => {
        if (rows.length >= 2) return rows;
        const fallback = await searchCommons(`${title} Japan`).catch(() => []);
        const merged = [...rows, ...fallback.filter((item) => !rows.some((row) => row.url === item.url))];
        return merged.slice(0, 5);
      })
      .then((rows) => {
        if (cancelled) return;
        setPhotos(rows);
        setActiveIndex(0);
        setFailed(rows.length === 0);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, shouldLoad, title]);

  const active = photos[activeIndex];

  function move(delta: number) {
    if (!photos.length) return;
    setActiveIndex((current) => (current + delta + photos.length) % photos.length);
  }

  return (
    <div ref={rootRef} className="explore-photo-gallery">
      {active ? (
        <>
          <img
            className="explore-place-photo"
            src={active.url}
            alt={`${title} · รูปที่ ${activeIndex + 1}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              setPhotos((current) => current.filter((_, index) => index !== activeIndex));
              setActiveIndex(0);
            }}
          />
          {photos.length > 1 && (
            <>
              <button type="button" className="gallery-arrow gallery-arrow-prev" onClick={() => move(-1)} aria-label="รูปก่อนหน้า">‹</button>
              <button type="button" className="gallery-arrow gallery-arrow-next" onClick={() => move(1)} aria-label="รูปถัดไป">›</button>
              <div className="gallery-dots" aria-label={`${photos.length} รูป`}>
                {photos.map((photo, index) => (
                  <button
                    type="button"
                    aria-label={`ดูรูปที่ ${index + 1}`}
                    className={index === activeIndex ? "active" : ""}
                    key={photo.url}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
          <a className="commons-photo-credit" href={active.sourceUrl} target="_blank" rel="noreferrer" title={active.fileTitle}>Wikimedia Commons ↗</a>
        </>
      ) : (
        <div className={`explore-photo-placeholder ${loading ? "loading" : ""}`}>
          <strong>{title}</strong>
          <span>{loading ? "กำลังโหลดรูปสถานที่จริง…" : failed ? "ยังไม่พบภาพที่เหมาะสม" : "รูปสถานที่จริง"}</span>
        </div>
      )}
    </div>
  );
}
