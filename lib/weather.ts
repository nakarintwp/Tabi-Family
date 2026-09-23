export type WeatherDay = {
  date: string;
  code: number;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbability: number | null;
  precipitationSum: number | null;
};

export type WeatherResult = {
  city: string;
  country?: string;
  latitude: number;
  longitude: number;
  days: WeatherDay[];
};

export function weatherLabel(code: number) {
  if (code === 0) return { icon: "☀️", label: "ท้องฟ้าแจ่มใส" };
  if ([1,2,3].includes(code)) return { icon: "⛅", label: "มีเมฆบางส่วน" };
  if ([45,48].includes(code)) return { icon: "🌫️", label: "หมอก" };
  if ([51,53,55,56,57].includes(code)) return { icon: "🌦️", label: "ฝนปรอย" };
  if ([61,63,65,66,67,80,81,82].includes(code)) return { icon: "🌧️", label: "ฝน" };
  if ([71,73,75,77,85,86].includes(code)) return { icon: "🌨️", label: "หิมะ" };
  if ([95,96,99].includes(code)) return { icon: "⛈️", label: "พายุฝน" };
  return { icon: "☁️", label: "สภาพอากาศ" };
}

export function isWetWeather(day: WeatherDay) {
  return (day.precipitationProbability ?? 0) >= 45 || [51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(day.code);
}

export async function getWeatherForCity(city: string): Promise<WeatherResult | null> {
  const q = city.trim();
  if (!q) return null;
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", q);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");
  const geoRes = await fetch(geoUrl, { next: { revalidate: 86400 } });
  if (!geoRes.ok) return null;
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) return null;

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(place.latitude));
  forecastUrl.searchParams.set("longitude", String(place.longitude));
  forecastUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum");
  forecastUrl.searchParams.set("timezone", "Asia/Tokyo");
  forecastUrl.searchParams.set("forecast_days", "7");
  const forecastRes = await fetch(forecastUrl, { next: { revalidate: 1800 } });
  if (!forecastRes.ok) return null;
  const forecast = await forecastRes.json();
  const d = forecast.daily;
  if (!d?.time) return null;
  const days: WeatherDay[] = d.time.map((date: string, i: number) => ({
    date,
    code: Number(d.weather_code?.[i] ?? 0),
    tempMax: d.temperature_2m_max?.[i] ?? null,
    tempMin: d.temperature_2m_min?.[i] ?? null,
    precipitationProbability: d.precipitation_probability_max?.[i] ?? null,
    precipitationSum: d.precipitation_sum?.[i] ?? null,
  }));
  return { city: place.name || q, country: place.country, latitude: place.latitude, longitude: place.longitude, days };
}
