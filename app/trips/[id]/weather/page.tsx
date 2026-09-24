import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { requireVerifiedUser } from "@/lib/supabase/auth";
import { getWeatherForCity, isWetWeather, weatherLabel } from "@/lib/weather";
import { buildWeatherSuggestions } from "@/lib/v11";

export default async function WeatherPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ city?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireVerifiedUser(`/trips/${id}/weather`);
  const { data: trip } = await supabase.from("trips").select("id,title,cities,trip_days(id,trip_date,title,activities(id,title,start_time,is_outdoor,rain_alternative,status))").eq("id", id).single();
  if (!trip) notFound();
  const cities = trip.cities || [];
  const city = query.city && cities.includes(query.city) ? query.city : (cities[0] || "Tokyo");
  let weather = null;
  let weatherError = "";
  try { weather = await getWeatherForCity(city); } catch { weatherError = "โหลดพยากรณ์อากาศไม่ได้ในขณะนี้"; }
  if (!weather && !weatherError) weatherError = `ไม่พบพิกัดของ ${city}`;
  const days = [...(trip.trip_days || [])].sort((a,b) => a.trip_date.localeCompare(b.trip_date));

  return <main className="shell"><div className="container"><AppHeader />
    <Link className="back-link" href={`/trips/${id}`}>‹ กลับ Dashboard</Link>
    <div className="page-head-row"><div><span className="eyebrow">V11.1 · FREE WEATHER · NO API KEY</span><h1 className="page-title">Weather-aware Planner</h1><p className="page-subtitle">พยากรณ์ 7 วันจาก Open-Meteo + คำแนะนำ Indoor/Outdoor จากแผนของคุณ</p></div></div>
    {cities.length > 1 && <div className="city-chip-row">{cities.map((c:string) => <Link key={c} className={`city-chip ${c===city ? "active" : ""}`} href={`/trips/${id}/weather?city=${encodeURIComponent(c)}`}>{c}</Link>)}</div>}
    {weatherError && <div className="error-box">{weatherError}</div>}
    {weather && <>
      <section className="weather-hero card"><div><span className="eyebrow">{weather.city}{weather.country ? ` · ${weather.country}` : ""}</span><h2>พยากรณ์ 7 วัน</h2></div><span className="weather-source">Open-Meteo</span></section>
      <section className="weather-days">{weather.days.map((day) => { const meta=weatherLabel(day.code); const wet=isWetWeather(day); const tripDay=days.find((d:any)=>d.trip_date===day.date); const activities=(tripDay?.activities||[]); const outdoor=activities.filter((a:any)=>a.is_outdoor && (a.status||"planned")==="planned"); const smart=buildWeatherSuggestions(day,activities); return <article className={`card weather-day ${wet ? "wet" : ""}`} key={day.date}><div className="weather-day-top"><div><strong>{new Intl.DateTimeFormat("th-TH",{weekday:"short",day:"numeric",month:"short"}).format(new Date(`${day.date}T00:00:00`))}</strong><small>{tripDay?.title || ""}</small></div><span className="weather-icon">{meta.icon}</span></div><h3>{meta.label}</h3><div className="weather-metrics"><span>{day.tempMin ?? "—"}° / {day.tempMax ?? "—"}°C</span><span>💧 {day.precipitationProbability ?? "—"}%</span></div><div className="weather-smart-tips">{smart.tips.map((tip,i)=><div className="weather-smart-tip" key={i}>✨ {tip}</div>)}</div>{wet && outdoor.length>0 && <div className="rain-plan"><strong>☔ กิจกรรมกลางแจ้งที่ควรเตรียมแผนสำรอง</strong>{outdoor.map((a:any)=><div className="rain-activity" key={a.id}><span>{a.start_time?.slice(0,5) || "—"} · {a.title}</span><small>{a.rain_alternative ? `สำรอง: ${a.rain_alternative}` : "ยังไม่ได้ระบุแผนสำรอง"}</small></div>)}</div>}</article>})}</section>
      <p className="weather-attribution">Weather data: Open-Meteo · ใช้เพื่อช่วยวางแผน ควรตรวจพยากรณ์อีกครั้งก่อนออกเดินทาง</p>
    </>}
  </div><BottomNav active="/trips" /></main>;
}
