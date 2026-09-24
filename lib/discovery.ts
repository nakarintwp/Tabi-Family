export type DiscoveryPlace = {
  slug: string;
  title: string;
  city: string;
  area: string;
  category: "attraction" | "food" | "shopping" | "nature" | "museum" | "family";
  emoji: string;
  summary: string;
  tags: string[];
  durationMinutes: number;
  childFriendly: boolean;
  seniorFriendly: boolean;
  isOutdoor: boolean;
  latitude?: number;
  longitude?: number;
  thaiPopular?: boolean;
  thaiNote?: string;
};

export type DiscoveryGuide = {
  thaiTitle?: string;
  nearestStation?: string;
  accessNote?: string;
  walkMinutes?: number;
  hoursNote?: string;
  closedNote?: string;
  budgetNote?: string;
  reservationNote?: string;
  bestTime?: string;
  familyNote?: string;
  foodGroups?: string[];
  parkingNote?: string;
  crowdNote?: string;
  weatherNote?: string;
};

export const FOOD_FILTERS = [
  { id: "all", label: "ร้านอาหารทั้งหมด" },
  { id: "thai", label: "คนไทยนิยม" },
  { id: "hida-beef", label: "เนื้อ Hida" },
  { id: "nagoya-meshi", label: "Nagoya-meshi" },
  { id: "ramen", label: "ราเมน" },
  { id: "sushi", label: "ซูชิ" },
  { id: "cafe", label: "คาเฟ่ / ของหวาน" },
  { id: "family", label: "ครอบครัว" },
  { id: "station", label: "ใกล้สถานี" },
  { id: "night", label: "มื้อเย็น / ดึก" },
] as const;

export const DISCOVERY_GUIDES: Record<string, DiscoveryGuide> = {
  "ghibli-park": { thaiTitle: "Ghibli Park / สวนจิบลิ", nearestStation: "Ai-Chikyuhaku-Kinen-Koen", accessNote: "เดินจากสถานีเข้าสวน", walkMinutes: 5, hoursNote: "เวลาเข้าชมขึ้นกับพื้นที่และตั๋ว", closedNote: "ตรวจวันปิดและรอบตั๋วก่อนเดินทาง", budgetNote: "ค่าเข้าแตกต่างตามพื้นที่", reservationNote: "ควรจองตั๋วล่วงหน้า", bestTime: "เช้า–บ่าย", familyNote: "เหมาะกับครอบครัว แต่ควรเผื่อเวลาเดิน" },
  "nagoya-castle": { thaiTitle: "Nagoya Castle / ปราสาทนาโกย่า", nearestStation: "Nagoyajo Seimon-mae / Nagoyajo", accessNote: "เดินจากสถานี/ป้ายรถบัสเข้าสวน", walkMinutes: 5, hoursNote: "เปิดช่วงกลางวัน", closedNote: "ตรวจวันปิดล่าสุด", budgetNote: "ประมาณ ¥500+", reservationNote: "โดยทั่วไปไม่ต้องจอง", bestTime: "เช้า", familyNote: "เหมาะกับเด็กและผู้สูงอายุ ถ้าไม่เร่ง" },
  "toyota-museum": { thaiTitle: "Toyota Automobile Museum / พิพิธภัณฑ์รถยนต์โตโยต้า", nearestStation: "Geidai-dori", accessNote: "เดินจาก Linimo", walkMinutes: 5, hoursNote: "เปิดช่วงกลางวัน", closedNote: "ตรวจวันปิดล่าสุด", budgetNote: "ประมาณ ¥1,000+", reservationNote: "ปกติซื้อหน้างานได้", bestTime: "สาย–บ่าย", familyNote: "Indoor เหมาะกับวันฝนตก" },
  "takayama-old-town": { thaiTitle: "Takayama Old Town / ย่านเมืองเก่าทาคายามะ", nearestStation: "Takayama Station", accessNote: "เดินไป Sanmachi", walkMinutes: 12, hoursNote: "พื้นที่สาธารณะเดินได้ทั้งวัน ร้านต่าง ๆ มีเวลาแยกกัน", closedNote: "แต่ละร้านหยุดไม่เหมือนกัน", budgetNote: "เดินเที่ยวฟรี / ค่าอาหารตามร้าน", reservationNote: "ไม่ต้องจองพื้นที่", bestTime: "เช้า ก่อนคนเยอะ", familyNote: "หน้าหนาวระวังพื้นลื่น" },
  "miyagawa-morning-market": { thaiTitle: "Miyagawa Morning Market / ตลาดเช้ามิยากาวะ", nearestStation: "Takayama Station", accessNote: "เดินไปริมแม่น้ำ Miyagawa", walkMinutes: 10, hoursNote: "ตลาดเช้า ควรไปก่อนเที่ยง", closedNote: "ร้านค้าอาจหยุดต่างกัน", budgetNote: "ของกินเริ่มหลักร้อยเยน", reservationNote: "ไม่ต้องจอง", bestTime: "08:00–10:30", familyNote: "เดินง่าย เหมาะกับครอบครัว" },
  "shirakawago": { thaiTitle: "Shirakawa-go / หมู่บ้านชิราคาวาโกะ", nearestStation: "Shirakawa-go Bus Terminal", accessNote: "เดินเข้าสู่ Ogimachi", walkMinutes: 3, hoursNote: "หมู่บ้านเที่ยวได้กลางวัน สถานที่ภายในมีเวลาปิดแยกกัน", closedNote: "ตรวจบ้าน/พิพิธภัณฑ์รายจุด", budgetNote: "พื้นที่หลักฟรี / มีค่าเข้าบางจุด", reservationNote: "รถบัสบางเที่ยวควรจอง", bestTime: "เช้า–บ่าย", familyNote: "ฤดูหนาวควรใช้รองเท้ากันลื่น" },
  "shirakawago-shiroyama-viewpoint": { thaiTitle: "Shiroyama Viewpoint / จุดชมวิวชิโรยามะ", nearestStation: "Shirakawa-go Bus Terminal", accessNote: "ขึ้นทางเดิน/รถรับส่งไปจุดชมวิว", walkMinutes: 20, hoursNote: "เหมาะกับช่วงที่ยังมีแสง", closedNote: "สภาพอากาศอาจมีผล", budgetNote: "จุดชมวิวฟรี", reservationNote: "ไม่ต้องจองพื้นที่", bestTime: "เช้า หรือก่อนเย็น", familyNote: "ผู้สูงอายุควรพิจารณารถรับส่งเมื่อมีบริการ" },
  "yabaton-esca": { thaiTitle: "Misokatsu Yabaton / ยาบะตง มิโสะคัตสึ", nearestStation: "Nagoya Station", accessNote: "ESCA underground mall", walkMinutes: 3, hoursNote: "มื้อกลางวัน–เย็น; ตรวจเวลาสาขาในวันเดินทาง", closedNote: "วันหยุดอาจเปลี่ยน", budgetNote: "ประมาณ ¥1,500–2,500/คน", reservationNote: "โดยทั่วไปไปหน้าร้านได้", bestTime: "ก่อนเที่ยงหรือก่อนมื้อเย็น", familyNote: "อยู่ใต้สถานี เหมาะกับวันที่มีสัมภาระ", foodGroups: ["nagoya-meshi","station","family"] },
  "maruya-honten-jr-nagoya": { thaiTitle: "Maruya Honten / มารุยะ ฮอนเท็น", nearestStation: "Nagoya Station", accessNote: "ภายใน/เชื่อมกับสถานี JR Nagoya", walkMinutes: 3, hoursNote: "เปิดช่วงมื้อกลางวัน–เย็น; ตรวจเวลาล่าสุด", closedNote: "วันหยุดอาจเปลี่ยน", budgetNote: "ประมาณ ¥3,000–5,000/คน", reservationNote: "ช่วงพีคอาจต้องรอคิว", bestTime: "11:00 ก่อนคิวกลางวัน", familyNote: "สะดวกสำหรับครอบครัวเพราะอยู่โซนสถานี", foodGroups: ["nagoya-meshi","station","family"] },
  "atsuta-horaiken-honten": { thaiTitle: "Atsuta Horaiken / อัตสึตะ โฮไรเค็น", nearestStation: "Temma-cho / Jingu-mae area", accessNote: "เหมาะจัดคู่กับ Atsuta Jingu", walkMinutes: 10, hoursNote: "เปิดเป็นช่วงมื้อ; ตรวจรอบรับคิวล่าสุด", closedNote: "มีวันหยุดประจำ ควรตรวจอีกครั้ง", budgetNote: "ประมาณ ¥4,000–6,000/คน", reservationNote: "ควรเผื่อเวลารอคิว", bestTime: "ก่อนช่วงมื้อ", familyNote: "ควรเผื่อเวลานั่งรอสำหรับเด็กและผู้สูงอายุ", foodGroups: ["nagoya-meshi","family"] },
  "yamamotoya-honten-nagoya": { thaiTitle: "Yamamotoya Honten / ยามาโมโตยะ ฮอนเท็น", nearestStation: "Nagoya Station", accessNote: "ย่าน Meieki ใกล้สถานี", walkMinutes: 5, hoursNote: "มื้อกลางวัน–เย็น; ตรวจเวลาสาขา", closedNote: "ตรวจวันหยุดสาขา", budgetNote: "ประมาณ ¥1,500–2,500/คน", reservationNote: "ส่วนใหญ่ไปหน้าร้านได้", bestTime: "กลางวัน", familyNote: "เมนูหม้อร้อน ระวังเด็กเล็ก", foodGroups: ["nagoya-meshi","station","family"] },
  "sekai-no-yamachan-sakae": { thaiTitle: "Sekai no Yamachan / เซไกโนะ ยามะจัง", nearestStation: "Sakae", accessNote: "หลายสาขาในย่าน Sakae", walkMinutes: 5, hoursNote: "เหมาะมื้อเย็น; เวลาขึ้นกับสาขา", closedNote: "ตรวจสาขาที่เลือก", budgetNote: "ประมาณ ¥2,000–4,000/คน", reservationNote: "กลุ่มใหญ่ควรจอง", bestTime: "เย็น", familyNote: "เลือกรสไม่เผ็ดสำหรับเด็ก", foodGroups: ["nagoya-meshi","family"] },
  "ajikura-tengoku": { thaiTitle: "Ajikura Tengoku / อาจิคุระ เท็งโกคุ", nearestStation: "Takayama Station", accessNote: "เดินจากสถานี", walkMinutes: 3, hoursNote: "มื้อกลางวัน–เย็น; ตรวจเวลาล่าสุด", closedNote: "ตรวจวันหยุดก่อนเดินทาง", budgetNote: "ประมาณ ¥3,000–6,000/คน", reservationNote: "มื้อพีคควรเผื่อคิว", bestTime: "ก่อน 12:00 หรือเย็นต้น ๆ", familyNote: "ใกล้สถานีและโต๊ะนั่ง เหมาะกับครอบครัว", foodGroups: ["hida-beef","station","family"] },
  "hidagyu-maruaki": { thaiTitle: "Hidagyu Maruaki / ฮิดะกิว มารุอากิ", nearestStation: "Takayama Station", accessNote: "เดินจากสถานี/ใจกลางเมือง", walkMinutes: 7, hoursNote: "เปิดเป็นช่วงมื้อ; ตรวจเวลาล่าสุด", closedNote: "ตรวจวันหยุดก่อนเดินทาง", budgetNote: "ประมาณ ¥3,000–7,000/คน", reservationNote: "ช่วงพีคอาจรอคิว", bestTime: "ก่อนมื้อกลางวัน", familyNote: "เหมาะกับมื้อหลักของครอบครัว", foodGroups: ["hida-beef","family"] },
  "hida-kotte-ushi": { thaiTitle: "Hida Kotte Ushi / ฮิดะ คตเตะ อุชิ", nearestStation: "Takayama Station", accessNote: "อยู่ใน Sanmachi Old Town", walkMinutes: 12, hoursNote: "เหมาะช่วงกลางวัน; อาจปิดเมื่อของหมด", closedNote: "ตรวจวันเปิดล่าสุด", budgetNote: "ประมาณ ¥1,000–2,500/คน", reservationNote: "ไม่ต้องจอง", bestTime: "สาย–บ่าย", familyNote: "เหมาะแวะเป็นของว่างระหว่างเดิน", foodGroups: ["hida-beef","sushi","family"] },
  "menya-shirakawa": { thaiTitle: "Menya Shirakawa / เมนยะ ชิราคาวะ", nearestStation: "Takayama Station", accessNote: "เดินเข้าสู่ย่านกลางเมือง", walkMinutes: 10, hoursNote: "เน้นมื้อกลางวัน; อาจปิดเมื่อขายหมด", closedNote: "ตรวจวันหยุดล่าสุด", budgetNote: "ประมาณ ¥800–1,500/คน", reservationNote: "ไม่ต้องจอง", bestTime: "ก่อน 12:00", familyNote: "ร้านขนาดไม่ใหญ่มาก ควรเลี่ยงช่วงคิวพีค", foodGroups: ["ramen"] },
  "center4-hamburgers": { thaiTitle: "Center4 Hamburgers / เซ็นเตอร์โฟร์", nearestStation: "Takayama Station", accessNote: "เดินไปย่านเมืองเก่า", walkMinutes: 15, hoursNote: "ตรวจเวลามื้อกลางวัน/เย็นล่าสุด", closedNote: "ตรวจวันหยุดก่อนเดินทาง", budgetNote: "ประมาณ ¥1,500–3,000/คน", reservationNote: "กลุ่มใหญ่ควรเช็กคิว", bestTime: "กลางวัน", familyNote: "เมนูคุ้นเคยสำหรับเด็ก", foodGroups: ["family"] },
  "shirakawago-irori": { thaiTitle: "Irori / อิโรริ ชิราคาวาโกะ", nearestStation: "Shirakawa-go Bus Terminal", accessNote: "อยู่ในโซน Ogimachi", walkMinutes: 6, hoursNote: "เหมาะมื้อกลางวัน; ตรวจเวลาล่าสุด", closedNote: "ตรวจวันหยุดก่อนเดินทาง", budgetNote: "ประมาณ ¥1,500–3,000/คน", reservationNote: "ช่วงคนเยอะควรเผื่อคิว", bestTime: "11:00–13:00", familyNote: "จัดมื้อกลางวันโดยไม่ต้องออกนอกหมู่บ้าน", foodGroups: ["family"] },
  "ochudo-cafe": { thaiTitle: "Ochūdo Cafe / คาเฟ่โอชูโด", nearestStation: "Shirakawa-go Bus Terminal", accessNote: "เดินใน Ogimachi", walkMinutes: 8, hoursNote: "เปิดช่วงกลางวัน; ตรวจเวลาล่าสุด", closedNote: "ตรวจวันเปิดในฤดูกาล", budgetNote: "ประมาณ ¥800–1,800/คน", reservationNote: "ไม่ต้องจอง", bestTime: "บ่าย", familyNote: "เหมาะพักจากอากาศหนาว", foodGroups: ["cafe","family"] },
};

export function getPlaceGuide(slug: string) {
  return DISCOVERY_GUIDES[slug] || {};
}

export function matchesFoodFilter(place: DiscoveryPlace, filter: string) {
  if (place.category !== "food") return false;
  if (!filter || filter === "all") return true;
  if (filter === "thai") return place.thaiPopular === true;
  if (filter === "family") return place.childFriendly;
  const guide = getPlaceGuide(place.slug);
  return place.tags.includes(filter) || (guide.foodGroups || []).includes(filter);
}


export function getPlaceIntelligence(place: DiscoveryPlace) {
  const guide = getPlaceGuide(place.slug);
  return {
    duration: `${place.durationMinutes} นาที`,
    parking: guide.parkingNote || (place.city === "Shirakawa-go" ? "ควรตรวจลานจอดรถและข้อจำกัดตามฤดูกาลก่อนขับเข้า" : "ถ้าขับรถมา ให้ตรวจที่จอดรถใกล้สถานที่ในวันเดินทาง"),
    crowd: guide.crowdNote || (guide.bestTime ? `ช่วงที่แนะนำ: ${guide.bestTime}` : "หลีกเลี่ยงช่วงพีคถ้าต้องการเดินสบายกับครอบครัว"),
    weather: guide.weatherNote || (place.isOutdoor ? "Outdoor: ตรวจฝน/หิมะ อุณหภูมิ และพื้นลื่นก่อนออก" : "Indoor: ใช้เป็นแผนสำรองได้เมื่ออากาศไม่ดี"),
    verification: "เวลาเปิด วันหยุด ราคา และการจองอาจเปลี่ยน ควรตรวจข้อมูลล่าสุดก่อนเดินทาง",
  };
}

export type TripTemplateActivity = {
  day: number;
  title: string;
  type: "attraction" | "food" | "transport" | "shopping" | "hotel";
  startTime?: string;
  placeSlug?: string;
  notes?: string;
};

export type TripTemplate = {
  id: string;
  title: string;
  subtitle: string;
  days: number;
  cities: string[];
  pace: "relaxed" | "balanced" | "packed";
  coverStyle: string;
  coverEmoji: string;
  tags: string[];
  activities: TripTemplateActivity[];
};

export const DISCOVERY_DESTINATIONS = [
  { id: "Nagoya", label: "Nagoya", subtitle: "Aichi", emoji: "🏙️" },
  { id: "Takayama", label: "Takayama", subtitle: "Gifu", emoji: "🏘️" },
  { id: "Shirakawa-go", label: "Shirakawa-go", subtitle: "Gifu", emoji: "❄️" },
  { id: "Gifu", label: "Gifu", subtitle: "Gifu", emoji: "🏯" },
  { id: "Inuyama", label: "Inuyama", subtitle: "Aichi", emoji: "🏯" },
  { id: "Gujo Hachiman", label: "Gujo Hachiman", subtitle: "Gifu", emoji: "🏞️" },
  { id: "Kanazawa", label: "Kanazawa", subtitle: "Ishikawa", emoji: "🌿" },
  { id: "Toyama", label: "Toyama", subtitle: "Toyama", emoji: "🏔️" },
  { id: "Matsumoto", label: "Matsumoto", subtitle: "Nagano", emoji: "🏯" },
  { id: "Nagano", label: "Nagano", subtitle: "Nagano", emoji: "🏔️" },
  { id: "Tokyo", label: "Tokyo", subtitle: "Kanto", emoji: "🗼" },
  { id: "Yokohama", label: "Yokohama", subtitle: "Kanagawa", emoji: "🌉" },
  { id: "Kamakura", label: "Kamakura", subtitle: "Kanagawa", emoji: "⛩️" },
  { id: "Nikko", label: "Nikko", subtitle: "Tochigi", emoji: "🌲" },
  { id: "Hakone", label: "Hakone", subtitle: "Kanagawa", emoji: "♨️" },
  { id: "Fuji", label: "Fuji / Kawaguchiko", subtitle: "Yamanashi", emoji: "🗻" },
  { id: "Kyoto", label: "Kyoto", subtitle: "Kansai", emoji: "⛩️" },
  { id: "Osaka", label: "Osaka", subtitle: "Kansai", emoji: "🐙" },
  { id: "Nara", label: "Nara", subtitle: "Kansai", emoji: "🦌" },
  { id: "Kobe", label: "Kobe", subtitle: "Hyogo", emoji: "⚓" },
  { id: "Himeji", label: "Himeji", subtitle: "Hyogo", emoji: "🏯" },
  { id: "Uji", label: "Uji", subtitle: "Kyoto", emoji: "🍵" },
  { id: "Sapporo", label: "Sapporo", subtitle: "Hokkaido", emoji: "❄️" },
  { id: "Otaru", label: "Otaru", subtitle: "Hokkaido", emoji: "🕯️" },
  { id: "Hakodate", label: "Hakodate", subtitle: "Hokkaido", emoji: "🌃" },
  { id: "Furano", label: "Furano", subtitle: "Hokkaido", emoji: "🌾" },
  { id: "Asahikawa", label: "Asahikawa", subtitle: "Hokkaido", emoji: "🐧" },
  { id: "Sendai", label: "Sendai", subtitle: "Miyagi", emoji: "🌳" },
  { id: "Aomori", label: "Aomori", subtitle: "Tohoku", emoji: "🍎" },
  { id: "Hiroshima", label: "Hiroshima", subtitle: "Chugoku", emoji: "🕊️" },
  { id: "Miyajima", label: "Miyajima", subtitle: "Hiroshima", emoji: "⛩️" },
  { id: "Okayama", label: "Okayama", subtitle: "Chugoku", emoji: "🌸" },
  { id: "Kurashiki", label: "Kurashiki", subtitle: "Okayama", emoji: "🏘️" },
  { id: "Takamatsu", label: "Takamatsu", subtitle: "Kagawa", emoji: "🍜" },
  { id: "Matsuyama", label: "Matsuyama", subtitle: "Ehime", emoji: "♨️" },
  { id: "Fukuoka", label: "Fukuoka", subtitle: "Kyushu", emoji: "🍜" },
  { id: "Beppu", label: "Beppu", subtitle: "Oita", emoji: "♨️" },
  { id: "Yufuin", label: "Yufuin", subtitle: "Oita", emoji: "🌿" },
  { id: "Kumamoto", label: "Kumamoto", subtitle: "Kyushu", emoji: "🏯" },
  { id: "Nagasaki", label: "Nagasaki", subtitle: "Kyushu", emoji: "🌉" },
  { id: "Kagoshima", label: "Kagoshima", subtitle: "Kyushu", emoji: "🌋" },
  { id: "Naha", label: "Naha / Okinawa", subtitle: "Okinawa", emoji: "🌺" },
] as const;

export const TRIP_INTERESTS = [
  { id: "snow", label: "หิมะ / Winter", emoji: "❄️", subtitle: "หิมะ วิวฤดูหนาว กระเช้า และหมู่บ้านหิมะ" },
  { id: "theme-park", label: "สวนสนุก / Theme Park", emoji: "🎡", subtitle: "สวนสนุก ธีมพาร์ก และกิจกรรมสำหรับครอบครัว" },
  { id: "shopping", label: "ช้อปปิ้ง", emoji: "🛍️", subtitle: "ห้าง ถนนช้อปปิ้ง ของฝาก และย่านการค้า" },
  { id: "sightseeing", label: "สถานที่เที่ยวชม", emoji: "📍", subtitle: "แลนด์มาร์ก จุดชมวิว ปราสาท วัด และย่านเมืองเก่า" },
  { id: "market", label: "ตลาด", emoji: "🍎", subtitle: "ตลาดเช้า ตลาดท้องถิ่น และของกินพื้นเมือง" },
  { id: "food", label: "อาหาร", emoji: "🍜", subtitle: "ร้านอาหาร ของกินท้องถิ่น และคาเฟ่" },
  { id: "museum", label: "พิพิธภัณฑ์", emoji: "🏛️", subtitle: "วิทยาศาสตร์ รถยนต์ ศิลปะ ประวัติศาสตร์ และกิจกรรมในร่ม" },
  { id: "nature", label: "ธรรมชาติ / วิว", emoji: "🏔️", subtitle: "ภูเขา สวน จุดชมวิว และพื้นที่ธรรมชาติ" },
  { id: "train", label: "รถไฟ / สถานี", emoji: "🚄", subtitle: "รถไฟ ชินคันเซ็น พิพิธภัณฑ์รถไฟ และจุดเกี่ยวกับการเดินทาง" },
  { id: "culture", label: "วัฒนธรรม / เมืองเก่า", emoji: "⛩️", subtitle: "วัด ศาลเจ้า ปราสาท บ้านเก่า และมรดกท้องถิ่น" },
  { id: "kids", label: "เด็ก / ครอบครัว", emoji: "👨‍👩‍👧", subtitle: "สถานที่เหมาะกับเด็กและครอบครัว" },
  { id: "onsen", label: "ออนเซ็น", emoji: "♨️", subtitle: "บ่อน้ำพุร้อนและจุดพักผ่อน" },
] as const;

export type TripInterestId = (typeof TRIP_INTERESTS)[number]["id"];

export const DEFAULT_TRIP_INTERESTS: TripInterestId[] = [
  "snow",
  "theme-park",
  "shopping",
  "sightseeing",
  "market",
];

const INTEREST_RULES: Record<TripInterestId, (place: DiscoveryPlace) => boolean> = {
  snow: (place) => place.tags.some((tag) => ["snow", "winter"].includes(tag)),
  "theme-park": (place) => place.tags.includes("theme-park") || ["ghibli-park", "legoland-japan"].includes(place.slug),
  shopping: (place) => place.category === "shopping" || place.tags.includes("shopping"),
  sightseeing: (place) => place.category === "attraction" || place.tags.some((tag) => ["view", "photo", "castle", "temple", "old-town"].includes(tag)),
  market: (place) => place.slug.includes("market") || place.title.toLowerCase().includes("market") || place.tags.includes("market"),
  food: (place) => place.category === "food" || place.tags.includes("food"),
  museum: (place) => place.category === "museum" || place.tags.includes("museum"),
  nature: (place) => place.category === "nature" || place.tags.some((tag) => ["nature", "mountain", "river", "garden"].includes(tag)),
  train: (place) => place.tags.includes("train") || /railway|train|station|shinkansen/i.test(`${place.title} ${place.summary}`),
  culture: (place) => place.tags.some((tag) => ["culture", "heritage", "history", "castle", "temple"].includes(tag)) || ["attraction", "museum"].includes(place.category),
  kids: (place) => place.childFriendly && (place.category === "family" || place.tags.some((tag) => ["kids", "family"].includes(tag))),
  onsen: (place) => place.tags.some((tag) => ["onsen", "hot-spring"].includes(tag)) || /onsen|hot spring/i.test(`${place.title} ${place.summary}`),
};

export function getMatchingTripInterests(place: DiscoveryPlace, interests: string[]) {
  const valid = new Set(TRIP_INTERESTS.map((item) => item.id));
  return interests.filter((interest): interest is TripInterestId => valid.has(interest as TripInterestId))
    .filter((interest) => INTEREST_RULES[interest](place));
}

export function getInterestMeta(id: string) {
  return TRIP_INTERESTS.find((item) => item.id === id);
}

export const CHUBU_ROUTE_CITIES = ["Nagoya", "Takayama", "Shirakawa-go"] as const;

export const DISCOVERY_PLACES: DiscoveryPlace[] = [
  {
    slug: "sensoji",
    title: "Senso-ji",
    city: "Tokyo",
    area: "Asakusa",
    category: "attraction",
    emoji: "⛩️",
    summary: "วัดเก่าแก่ในอาซากุสะ เดินง่ายและจัดคู่กับ Nakamise ได้ในช่วงเช้า",
    tags: ["family", "culture", "photo"],
    durationMinutes: 90,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.714765,
    longitude: 139.796655,
  },
  {
    slug: "tokyo-skytree",
    title: "Tokyo Skytree",
    city: "Tokyo",
    area: "Sumida",
    category: "family",
    emoji: "🗼",
    summary: "จุดชมวิวพร้อมห้าง Solamachi เหมาะกับครอบครัวและมีพื้นที่ในร่มเยอะ",
    tags: ["family", "indoor", "view"],
    durationMinutes: 150,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    latitude: 35.710063,
    longitude: 139.8107,
  },
  {
    slug: "ueno-park",
    title: "Ueno Park",
    city: "Tokyo",
    area: "Ueno",
    category: "nature",
    emoji: "🌳",
    summary: "สวนขนาดใหญ่ ใกล้พิพิธภัณฑ์และสวนสัตว์ ปรับแผนได้ง่ายตามอากาศ",
    tags: ["family", "nature", "museum"],
    durationMinutes: 120,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.714047,
    longitude: 139.77407,
  },
  {
    slug: "ghibli-park",
    thaiPopular: true,
    thaiNote: "จุดยอดนิยมของครอบครัวไทยที่วางแผนเที่ยว Nagoya และ Aichi",
    title: "Ghibli Park",
    city: "Nagoya",
    area: "Aichi",
    category: "family",
    emoji: "🎠",
    summary: "ธีมพาร์กใน Aichi Expo Memorial Park เหมาะกับครอบครัว ควรวางเวลาครึ่งวันถึงเต็มวัน",
    tags: ["kids", "family", "reservation"],
    durationMinutes: 300,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.17733,
    longitude: 137.08954,
  },
  {
    slug: "nagoya-castle",
    title: "Nagoya Castle",
    city: "Nagoya",
    area: "Naka Ward",
    category: "attraction",
    emoji: "🏯",
    summary: "แลนด์มาร์กกลางเมือง เหมาะกับการจับคู่กับย่าน Sakae ในวันเดียวกัน",
    tags: ["culture", "photo", "family"],
    durationMinutes: 120,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.185565,
    longitude: 136.899212,
  },
  {
    slug: "toyota-museum",
    title: "Toyota Automobile Museum",
    city: "Nagoya",
    area: "Nagakute",
    category: "museum",
    emoji: "🚗",
    summary: "พิพิธภัณฑ์รถยนต์ในร่ม เหมาะเป็นแผนวันฝนตกและเด็กที่ชอบรถ",
    tags: ["indoor", "kids", "museum"],
    durationMinutes: 150,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    latitude: 35.17539,
    longitude: 137.05898,
  },
  {
    slug: "takayama-old-town",
    thaiPopular: true,
    thaiNote: "ย่านเมืองเก่าที่ปรากฏบ่อยในรีวิวทริป Takayama ของนักท่องเที่ยวไทย",
    title: "Takayama Old Town",
    city: "Takayama",
    area: "Sanmachi",
    category: "attraction",
    emoji: "🏘️",
    summary: "ย่านเมืองเก่าที่เดินชมร้านและบ้านไม้ เหมาะกับทริปฤดูหนาวแต่ควรเผื่อพื้นลื่น",
    tags: ["winter", "food", "culture"],
    durationMinutes: 180,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 36.14077,
    longitude: 137.26148,
  },
  {
    slug: "shirakawago",
    thaiPopular: true,
    thaiNote: "หนึ่งในไฮไลต์เส้นทาง Chubu ที่นักท่องเที่ยวไทยนิยมจัดคู่กับ Takayama",
    title: "Shirakawa-go",
    city: "Shirakawa-go",
    area: "Gifu",
    category: "nature",
    emoji: "❄️",
    summary: "หมู่บ้านมรดกโลก เหมาะกับทริปครอบครัวฤดูหนาว ควรเตรียมรองเท้ากันลื่น",
    tags: ["winter", "nature", "photo"],
    durationMinutes: 240,
    childFriendly: true,
    seniorFriendly: false,
    isOutdoor: true,
    latitude: 36.26052,
    longitude: 136.90689,
  },
  {
    slug: "fushimi-inari",
    title: "Fushimi Inari Taisha",
    city: "Kyoto",
    area: "Fushimi",
    category: "attraction",
    emoji: "⛩️",
    summary: "ศาลเจ้าเสาโทริอิ ถ้าเดินกับเด็กหรือผู้สูงอายุควรเที่ยวเฉพาะช่วงล่าง",
    tags: ["culture", "photo", "walking"],
    durationMinutes: 120,
    childFriendly: true,
    seniorFriendly: false,
    isOutdoor: true,
    latitude: 34.96714,
    longitude: 135.77267,
  },
  {
    slug: "kyoto-railway-museum",
    title: "Kyoto Railway Museum",
    city: "Kyoto",
    area: "Shimogyo",
    category: "family",
    emoji: "🚂",
    summary: "พิพิธภัณฑ์รถไฟขนาดใหญ่ เหมาะกับเด็กและเป็นกิจกรรมในร่มเมื่ออากาศไม่ดี",
    tags: ["kids", "indoor", "train"],
    durationMinutes: 180,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    latitude: 34.98734,
    longitude: 135.74169,
  },
  {
    slug: "osaka-aquarium",
    title: "Osaka Aquarium Kaiyukan",
    city: "Osaka",
    area: "Tempozan",
    category: "family",
    emoji: "🐋",
    summary: "พิพิธภัณฑ์สัตว์น้ำในร่ม ใช้งานง่ายกับเด็กและผู้สูงอายุ",
    tags: ["kids", "indoor", "family"],
    durationMinutes: 180,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    latitude: 34.65452,
    longitude: 135.42896,
  },
  {
    slug: "dotonbori",
    title: "Dotonbori",
    city: "Osaka",
    area: "Namba",
    category: "food",
    emoji: "🍜",
    summary: "ย่านอาหารและแสงสี เหมาะช่วงเย็นและจัดต่อกับ Namba ได้",
    tags: ["food", "shopping", "night"],
    durationMinutes: 150,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 34.66872,
    longitude: 135.50131,
  },
  {
    slug: "oshino-hakkai",
    title: "Oshino Hakkai",
    city: "Fuji",
    area: "Yamanashi",
    category: "nature",
    emoji: "🗻",
    summary: "หมู่บ้านบ่อน้ำพร้อมวิวฟูจิ เหมาะกับวันฟ้าเปิดและทริปเช่ารถ",
    tags: ["fuji", "nature", "photo"],
    durationMinutes: 120,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.46008,
    longitude: 138.8325,
  },
  {
    slug: "kawaguchiko",
    title: "Lake Kawaguchiko",
    city: "Fuji",
    area: "Yamanashi",
    category: "nature",
    emoji: "🏔️",
    summary: "ทะเลสาบวิวฟูจิ เหมาะกับครอบครัวและสามารถใช้รถบัสหรือรถเช่าเที่ยวรอบทะเลสาบ",
    tags: ["fuji", "nature", "family"],
    durationMinutes: 180,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: true,
    latitude: 35.51703,
    longitude: 138.75175,
  },
  {
    slug: "nagoya-city-science-museum",
    title: "Nagoya City Science Museum",
    city: "Nagoya", area: "Fushimi", category: "museum", emoji: "🔭",
    summary: "พิพิธภัณฑ์วิทยาศาสตร์ขนาดใหญ่ เหมาะกับเด็กและเป็นตัวเลือกในร่มสำหรับวันอากาศไม่ดี",
    tags: ["kids", "indoor", "science"], durationMinutes: 180, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1651, longitude: 136.8997,
  },
  {
    slug: "atsuta-jingu", title: "Atsuta Jingu", city: "Nagoya", area: "Atsuta", category: "attraction", emoji: "⛩️",
    summary: "ศาลเจ้าสำคัญของ Nagoya บรรยากาศสงบ มีพื้นที่ร่มไม้ เหมาะวางครึ่งวันแบบไม่เร่ง",
    tags: ["culture", "quiet", "family"], durationMinutes: 90, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 35.1274, longitude: 136.9084,
  },
  {
    slug: "osu-shopping-street",
    thaiPopular: true,
    thaiNote: "ย่านช้อปปิ้งและของกินที่เหมาะกับนักท่องเที่ยวไทยซึ่งอยากเดินเลือกของหลายแบบ", title: "Osu Shopping Street", city: "Nagoya", area: "Osu", category: "shopping", emoji: "🛍️",
    summary: "ย่านช้อปปิ้งและของกินที่เดินสนุก ร้านหลากหลาย เหมาะกับช่วงบ่ายถึงเย็น",
    tags: ["shopping", "food", "arcade"], durationMinutes: 150, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1594, longitude: 136.9055,
  },
  {
    slug: "osu-kannon", title: "Osu Kannon", city: "Nagoya", area: "Osu", category: "attraction", emoji: "🏮",
    summary: "วัดใจกลางย่าน Osu จัดคู่กับถนนช้อปปิ้งได้ง่ายโดยไม่ต้องย้ายพื้นที่หลายครั้ง",
    tags: ["culture", "shopping", "easy"], durationMinutes: 60, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 35.1599, longitude: 136.9009,
  },
  {
    slug: "port-of-nagoya-aquarium", title: "Port of Nagoya Public Aquarium", city: "Nagoya", area: "Nagoya Port", category: "family", emoji: "🐬",
    summary: "Aquarium ขนาดใหญ่ เหมาะกับครอบครัวและวันที่ต้องการกิจกรรมในร่มหลายชั่วโมง",
    tags: ["kids", "indoor", "aquarium"], durationMinutes: 240, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.0906, longitude: 136.8783,
  },
  {
    slug: "scmaglev-railway-park", title: "SCMAGLEV and Railway Park", city: "Nagoya", area: "Kinjo-futo", category: "family", emoji: "🚄",
    summary: "พิพิธภัณฑ์รถไฟและชินคันเซ็น เหมาะมากกับเด็กหรือคนชอบระบบขนส่ง",
    tags: ["kids", "train", "indoor"], durationMinutes: 180, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.0487, longitude: 136.8504,
  },
  {
    slug: "toyota-industry-museum", title: "Toyota Commemorative Museum of Industry and Technology", city: "Nagoya", area: "Noritake", category: "museum", emoji: "⚙️",
    summary: "เรียนรู้ประวัติ Toyota ตั้งแต่สิ่งทอถึงรถยนต์ อยู่ไม่ไกลจาก Nagoya Station และใช้เวลาครึ่งวันได้",
    tags: ["indoor", "technology", "family"], durationMinutes: 180, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1839, longitude: 136.8769,
  },
  {
    slug: "tokugawa-art-museum", title: "Tokugawa Art Museum", city: "Nagoya", area: "Higashi", category: "museum", emoji: "🖼️",
    summary: "พิพิธภัณฑ์ศิลปะและสมบัติของตระกูล Tokugawa เหมาะกับวันที่ต้องการจังหวะเที่ยวสบาย",
    tags: ["culture", "indoor", "senior"], durationMinutes: 120, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1831, longitude: 136.9322,
  },
  {
    slug: "oasis-21",
    thaiPopular: true,
    thaiNote: "รีวิวท่องเที่ยวไทยมักจัดคู่ Oasis 21 กับ Sakae และจุดชมวิวใจกลางเมือง", title: "Oasis 21", city: "Nagoya", area: "Sakae", category: "attraction", emoji: "💧",
    summary: "แลนด์มาร์กสมัยใหม่ใน Sakae เชื่อมกับแหล่งช้อปปิ้งและจุดชมวิว เหมาะช่วงเย็น",
    tags: ["sakae", "photo", "shopping"], durationMinutes: 75, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 35.1707, longitude: 136.9090,
  },
  {
    slug: "mirai-tower", title: "Chubu Electric Power MIRAI TOWER", city: "Nagoya", area: "Sakae", category: "attraction", emoji: "🗼",
    summary: "จุดชมวิวใจกลาง Sakae สามารถจัดต่อกับ Oasis 21 และ Hisaya-odori Park ได้",
    tags: ["view", "sakae", "night"], durationMinutes: 75, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1722, longitude: 136.9080,
  },
  {
    slug: "noritake-garden", title: "Noritake Garden", city: "Nagoya", area: "Noritake", category: "shopping", emoji: "☕",
    summary: "พื้นที่สวน พิพิธภัณฑ์ และร้านเครื่องเซรามิก ใกล้ Nagoya Station เหมาะกับวันเดินทางเบา ๆ",
    tags: ["shopping", "craft", "easy"], durationMinutes: 120, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 35.1818, longitude: 136.8792,
  },
  {
    slug: "legoland-japan", title: "LEGOLAND Japan", city: "Nagoya", area: "Kinjo-futo", category: "family", emoji: "🧱",
    summary: "ธีมพาร์กสำหรับครอบครัว โดยเฉพาะเด็กเล็กถึงประถม ควรเผื่อเกือบเต็มวัน",
    tags: ["kids", "theme-park", "full-day"], durationMinutes: 360, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 35.0504, longitude: 136.8455,
  },
  {
    slug: "sakae-shopping", title: "Sakae Shopping District", city: "Nagoya", area: "Sakae", category: "shopping", emoji: "✨",
    summary: "ย่านใจกลางเมืองสำหรับห้าง ร้านอาหาร และช้อปปิ้ง เหมาะใส่ท้ายวันหลังเที่ยวจุดหลัก",
    tags: ["shopping", "food", "night"], durationMinutes: 180, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 35.1682, longitude: 136.9066,
  },
  {
    slug: "inuyama-castle-day-trip", title: "Inuyama Castle", city: "Nagoya", area: "Inuyama · Day trip", category: "attraction", emoji: "🏯",
    summary: "Day trip จาก Nagoya ไปเมืองปราสาทเก่า เหมาะกับคนที่อยากได้บรรยากาศเมืองเล็กเพิ่มจากตัวเมือง",
    tags: ["day-trip", "castle", "culture"], durationMinutes: 300, childFriendly: true, seniorFriendly: false, isOutdoor: true,
    latitude: 35.3885, longitude: 136.9396,
  },
  {
    slug: "miyagawa-morning-market",
    thaiPopular: true,
    thaiNote: "ตลาดเช้าที่ถูกพูดถึงบ่อยในรีวิว Takayama ของคนไทย", title: "Miyagawa Morning Market", city: "Takayama", area: "Miyagawa River", category: "food", emoji: "🍎",
    summary: "ตลาดเช้าริมแม่น้ำ เหมาะเริ่มวันก่อนเดินเข้าย่านเมืองเก่า มีของกินและผลิตผลท้องถิ่น",
    tags: ["morning", "food", "local"], durationMinutes: 75, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.1430, longitude: 137.2590,
  },
  {
    slug: "takayama-jinya", title: "Takayama Jinya", city: "Takayama", area: "Hachiken-machi", category: "attraction", emoji: "🏛️",
    summary: "อาคารราชการประวัติศาสตร์ใกล้เมืองเก่า เหมาะจัดต่อกับ Morning Market และ Sanmachi",
    tags: ["history", "culture", "central"], durationMinutes: 90, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 36.1391, longitude: 137.2585,
  },
  {
    slug: "hida-folk-village", title: "Hida Folk Village", city: "Takayama", area: "Hida-no-Sato", category: "nature", emoji: "🏡",
    summary: "หมู่บ้านกลางแจ้งรวมบ้านโบราณของ Hida ให้บรรยากาศชนบทโดยไม่ต้องเดินทางไกลจาก Takayama",
    tags: ["culture", "winter", "open-air"], durationMinutes: 150, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.1351, longitude: 137.2366,
  },
  {
    slug: "takayama-festival-floats", title: "Takayama Festival Floats Exhibition Hall", city: "Takayama", area: "Sakuramachi", category: "museum", emoji: "🎎",
    summary: "ชมรถแห่เทศกาล Takayama ในอาคาร เหมาะเป็นกิจกรรมในร่มช่วงหนาวหรือฝน",
    tags: ["indoor", "culture", "festival"], durationMinutes: 90, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 36.1450, longitude: 137.2607,
  },
  {
    slug: "hida-kokubunji", title: "Hida Kokubunji", city: "Takayama", area: "Sowa-machi", category: "attraction", emoji: "🛕",
    summary: "วัดเก่าใกล้สถานี Takayama แวะง่าย ใช้เวลาไม่นานและเหมาะกับวัน arrival/departure",
    tags: ["temple", "easy", "central"], durationMinutes: 45, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.1420, longitude: 137.2547,
  },
  {
    slug: "hida-furukawa-day-trip", title: "Hida Furukawa", city: "Takayama", area: "Hida · Day trip", category: "attraction", emoji: "🐟",
    summary: "เมืองเล็กสงบใกล้ Takayama มีคลอง บ้านไม้ และบรรยากาศเดินเล่น เหมาะกับคนที่ไม่ชอบความเร่งรีบ",
    tags: ["day-trip", "quiet", "old-town"], durationMinutes: 240, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.2376, longitude: 137.1899,
  },
  {
    slug: "shinhotaka-ropeway", title: "Shinhotaka Ropeway", city: "Takayama", area: "Okuhida · Day trip", category: "nature", emoji: "🚡",
    summary: "กระเช้าชมเทือกเขาแอลป์ญี่ปุ่น เหมาะกับวันอากาศเปิดและควรเผื่อเวลาเดินทางจาก Takayama",
    tags: ["mountain", "snow", "day-trip"], durationMinutes: 360, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.2854, longitude: 137.5755,
  },
  {
    slug: "shirakawago-shiroyama-viewpoint",
    thaiPopular: true,
    thaiNote: "จุดถ่ายภาพมุมสูงที่เหมาะกับทริป Shirakawa-go โดยเฉพาะฤดูหนาว", title: "Shiroyama Viewpoint", city: "Shirakawa-go", area: "Ogimachi", category: "nature", emoji: "📸",
    summary: "จุดชมวิวหมู่บ้านจากมุมสูง เหมาะกับช่วงหิมะ แต่ควรเช็กสภาพทางและเผื่อการเดินขึ้น",
    tags: ["view", "snow", "photo"], durationMinutes: 75, childFriendly: true, seniorFriendly: false, isOutdoor: true,
    latitude: 36.2615, longitude: 136.9045,
  },
  {
    slug: "wada-house", title: "Wada House", city: "Shirakawa-go", area: "Ogimachi", category: "museum", emoji: "🏠",
    summary: "บ้านกัสโชสึคุริสำคัญที่เข้าชมภายในได้ เหมาะกับการทำความเข้าใจชีวิตในหมู่บ้าน",
    tags: ["heritage", "indoor", "culture"], durationMinutes: 60, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 36.2607, longitude: 136.9063,
  },
  {
    slug: "gassho-zukuri-minkaen", title: "Gassho-zukuri Minkaen", city: "Shirakawa-go", area: "Ogimachi", category: "museum", emoji: "🏘️",
    summary: "พิพิธภัณฑ์กลางแจ้งรวมบ้านกัสโชหลายหลัง เหมาะกับคนที่อยากชมรายละเอียดสถาปัตยกรรมมากขึ้น",
    tags: ["heritage", "open-air", "family"], durationMinutes: 120, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.2579, longitude: 136.9078,
  },
  {
    slug: "kanda-house", title: "Kanda House", city: "Shirakawa-go", area: "Ogimachi", category: "museum", emoji: "🪵",
    summary: "บ้านกัสโชเก่าแก่ที่เปิดให้เข้าชม เหมาะจัดต่อกับ Wada House ระหว่างเดินในหมู่บ้าน",
    tags: ["heritage", "indoor", "history"], durationMinutes: 45, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 36.2588, longitude: 136.9076,
  },
  {
    slug: "myozenji", title: "Myozenji Temple Museum", city: "Shirakawa-go", area: "Ogimachi", category: "museum", emoji: "🛕",
    summary: "วัดและอาคารแบบกัสโชที่มีเอกลักษณ์ เป็นจุดพักชมวัฒนธรรมระหว่างเดินหมู่บ้าน",
    tags: ["culture", "heritage", "quiet"], durationMinutes: 60, childFriendly: true, seniorFriendly: true, isOutdoor: false,
    latitude: 36.2583, longitude: 136.9073,
  },
  {
    slug: "deai-bridge", title: "Deai Bridge", city: "Shirakawa-go", area: "Ogimachi", category: "attraction", emoji: "🌉",
    summary: "สะพานทางเข้าหมู่บ้านและจุดถ่ายภาพริมแม่น้ำ เหมาะแวะระหว่างเข้าออกพื้นที่หลัก",
    tags: ["photo", "river", "walk"], durationMinutes: 30, childFriendly: true, seniorFriendly: true, isOutdoor: true,
    latitude: 36.2565, longitude: 136.9049,
  },
  {
    slug: "yabaton-esca",
    title: "Misokatsu Yabaton · ESCA",
    city: "Nagoya",
    area: "Nagoya Station · ESCA",
    category: "food",
    emoji: "🍖",
    summary: "หมูทอดราดมิโสะสไตล์ Nagoya สาขาใต้สถานี เดินทางง่าย เหมาะกับมื้อแรกหรือมื้อก่อนขึ้นรถไฟ",
    tags: ["food", "nagoya-meshi", "station", "misokatsu"],
    durationMinutes: 75,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "มีรีวิวภาษาไทยและถูกแนะนำบ่อยว่าเป็นร้านมิโสะคัตสึดังของ Nagoya",
  },
  {
    slug: "maruya-honten-jr-nagoya",
    title: "Maruya Honten · JR Nagoya Station",
    city: "Nagoya",
    area: "JR Nagoya Station",
    category: "food",
    emoji: "🍱",
    summary: "ร้าน hitsumabushi ข้าวหน้าปลาไหลแบบ Nagoya อยู่ในสถานี เหมาะกับคนที่อยากลองเมนูประจำเมืองโดยไม่ต้องเดินทางไกล",
    tags: ["food", "nagoya-meshi", "unagi", "station"],
    durationMinutes: 90,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "ร้านปลาไหลใกล้สถานีที่สะดวกสำหรับนักท่องเที่ยวและมีรีวิวจำนวนมาก",
  },
  {
    slug: "atsuta-horaiken-honten",
    title: "Atsuta Horaiken Honten",
    city: "Nagoya",
    area: "Atsuta",
    category: "food",
    emoji: "🍚",
    summary: "ร้าน hitsumabushi เก่าแก่ใกล้ Atsuta Jingu เหมาะจัดเป็นมื้อหลักในวันที่เที่ยวโซน Atsuta",
    tags: ["food", "nagoya-meshi", "unagi", "atsuta"],
    durationMinutes: 120,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "ร้านดังของ Nagoya ที่นักท่องเที่ยวมักจับคู่กับ Atsuta Jingu",
  },
  {
    slug: "yamamotoya-honten-nagoya",
    title: "Yamamotoya Honten · Nagoya Station",
    city: "Nagoya",
    area: "Meieki",
    category: "food",
    emoji: "🍲",
    summary: "มิโสะนิโคมิอุด้งเสิร์ฟในหม้อดิน เมนูท้องถิ่นของ Nagoya และเดินจากสถานีได้สะดวก",
    tags: ["food", "nagoya-meshi", "udon", "station"],
    durationMinutes: 75,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "เหมาะสำหรับลองอาหารท้องถิ่นแบบ Nagoya-meshi ใกล้สถานี",
  },
  {
    slug: "sekai-no-yamachan-sakae",
    title: "Sekai no Yamachan · Sakae",
    city: "Nagoya",
    area: "Sakae",
    category: "food",
    emoji: "🍗",
    summary: "ปีกไก่ทอด tebasaki รสพริกไทยจัด เป็นอาหารขึ้นชื่อของ Nagoya เหมาะกับมื้อเย็นหลังเที่ยว Sakae",
    tags: ["food", "nagoya-meshi", "tebasaki", "night"],
    durationMinutes: 90,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "มีรีวิวไทยพูดถึงรสพริกไทยชัดและเป็นร้านดังที่ควรลองเมื่อมา Nagoya",
  },
  {
    slug: "ajikura-tengoku",
    title: "Ajikura Tengoku",
    city: "Takayama",
    area: "ใกล้ Takayama Station",
    category: "food",
    emoji: "🥩",
    summary: "ร้านยากินิกุเนื้อ Hida ใกล้สถานี เหมาะกับมื้อหลักสำหรับคนที่อยากลองเนื้อฮิดะแบบย่าง",
    tags: ["food", "hida-beef", "yakiniku", "station"],
    durationMinutes: 100,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "มีรีวิว Pantip ระบุว่าคนไทยไปร้านนี้จำนวนมาก และเป็นร้านที่ถูกพูดถึงในชุมชนไทย",
  },
  {
    slug: "hidagyu-maruaki",
    title: "Hidagyu Maruaki",
    city: "Takayama",
    area: "Tenmanmachi",
    category: "food",
    emoji: "🥩",
    summary: "ร้านเนื้อ Hida ที่มีทั้งปิ้งย่างและเมนูเนื้อ เหมาะกับครอบครัวที่ต้องการมื้อเนื้อฮิดะแบบจริงจัง",
    tags: ["food", "hida-beef", "yakiniku", "popular"],
    durationMinutes: 100,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "รีวิวท่องเที่ยวไทยหลายกระทู้แนะนำ Maruaki เมื่อต้องการกินเนื้อ Hida ใน Takayama",
  },
  {
    slug: "hida-kotte-ushi",
    title: "Hida Kotte Ushi",
    city: "Takayama",
    area: "Sanmachi Old Town",
    category: "food",
    emoji: "🍣",
    summary: "ซูชิเนื้อ Hida แบบกินง่ายระหว่างเดินเมืองเก่า เหมาะเป็นของว่างหรือมื้อเบาใน Sanmachi",
    tags: ["food", "hida-beef", "sushi", "old-town"],
    durationMinutes: 45,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "มีรีวิวจากผู้ใช้ไทยและเป็นหนึ่งในจุดกินเนื้อ Hida ที่นิยมแวะในย่านเมืองเก่า",
  },
  {
    slug: "menya-shirakawa",
    title: "Menya Shirakawa",
    city: "Takayama",
    area: "Aioimachi",
    category: "food",
    emoji: "🍜",
    summary: "ร้าน Takayama ramen เมนูไม่ซับซ้อน เหมาะกับมื้อกลางวันระหว่างเดินเที่ยวใจกลางเมือง",
    tags: ["food", "ramen", "central"],
    durationMinutes: 60,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "ร้านราเมนยอดนิยมที่เหมาะกับการแทรกในวันเดิน Old Town",
  },
  {
    slug: "center4-hamburgers",
    title: "Center4 Hamburgers",
    city: "Takayama",
    area: "Kamiichinomachi",
    category: "food",
    emoji: "🍔",
    summary: "ร้านเบอร์เกอร์ในบรรยากาศ Takayama เหมาะสำหรับวันที่อยากสลับจากอาหารญี่ปุ่นหรือมากับเด็ก",
    tags: ["food", "burger", "family"],
    durationMinutes: 75,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: false,
  },
  {
    slug: "shirakawago-irori",
    title: "Irori · Shirakawa-go",
    city: "Shirakawa-go",
    area: "Ogimachi",
    category: "food",
    emoji: "🍲",
    summary: "ร้านอาหารท้องถิ่นในหมู่บ้าน มีชุดอาหารญี่ปุ่นและเมนูภูมิภาค เหมาะกับมื้อกลางวันระหว่างเที่ยว Shirakawa-go",
    tags: ["food", "local", "teishoku", "shirakawago"],
    durationMinutes: 75,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "เป็นร้านที่อยู่ในโซนเที่ยวหลักและเหมาะกับการวางมื้อกลางวันโดยไม่ออกนอกหมู่บ้าน",
  },
  {
    slug: "ochudo-cafe",
    title: "Ochūdo Cafe",
    city: "Shirakawa-go",
    area: "Ogimachi",
    category: "food",
    emoji: "☕",
    summary: "คาเฟ่ในบรรยากาศบ้านเก่า เหมาะสำหรับพักระหว่างเดินหมู่บ้าน โดยเฉพาะวันที่อากาศหนาว",
    tags: ["food", "cafe", "rest", "shirakawago"],
    durationMinutes: 60,
    childFriendly: true,
    seniorFriendly: true,
    isOutdoor: false,
    thaiPopular: true,
    thaiNote: "ตัวเลือกพักกินระหว่างเดิน Shirakawa-go ที่มีรีวิวผู้เดินทางจำนวนมาก",
  },

];

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: "nagoya-winter-family-5d",
    title: "Nagoya Winter Family",
    subtitle: "Nagoya • Takayama • Shirakawa-go แบบสมดุลสำหรับครอบครัว",
    days: 5,
    cities: ["Nagoya", "Takayama", "Shirakawa-go"],
    pace: "balanced",
    coverStyle: "aqua",
    coverEmoji: "❄️",
    tags: ["winter", "family", "5 days"],
    activities: [
      { day: 1, title: "Nagoya Castle", type: "attraction", startTime: "10:00", placeSlug: "nagoya-castle" },
      { day: 1, title: "Sakae evening", type: "shopping", startTime: "16:00", notes: "เดินเล่นและทานมื้อเย็น" },
      { day: 2, title: "Ghibli Park", type: "attraction", startTime: "10:00", placeSlug: "ghibli-park" },
      { day: 3, title: "Nagoya → Takayama", type: "transport", startTime: "08:30", notes: "เพิ่มเที่ยวรถจริงใน Transport Segments" },
      { day: 3, title: "Takayama Old Town", type: "attraction", startTime: "12:00", placeSlug: "takayama-old-town" },
      { day: 4, title: "Shirakawa-go", type: "attraction", startTime: "09:00", placeSlug: "shirakawago" },
      { day: 5, title: "Toyota Automobile Museum", type: "attraction", startTime: "10:00", placeSlug: "toyota-museum" },
    ],
  },
  {
    id: "tokyo-family-5d",
    title: "Tokyo Family Easy 5D",
    subtitle: "โตเกียวสำหรับเด็กและผู้สูงอายุ เน้นเดินทางง่ายและมีแผนในร่ม",
    days: 5,
    cities: ["Tokyo"],
    pace: "relaxed",
    coverStyle: "sky",
    coverEmoji: "🗼",
    tags: ["kids", "senior", "easy"],
    activities: [
      { day: 1, title: "Senso-ji", type: "attraction", startTime: "09:30", placeSlug: "sensoji" },
      { day: 1, title: "Tokyo Skytree", type: "attraction", startTime: "13:30", placeSlug: "tokyo-skytree" },
      { day: 2, title: "Ueno Park", type: "attraction", startTime: "09:30", placeSlug: "ueno-park" },
      { day: 3, title: "Free day / Shopping", type: "shopping", startTime: "11:00" },
      { day: 4, title: "Family indoor day", type: "attraction", startTime: "10:00", notes: "เลือกพิพิธภัณฑ์หรือ Aquarium ตามความสนใจ" },
      { day: 5, title: "Souvenir & airport preparation", type: "shopping", startTime: "10:00" },
    ],
  },
  {
    id: "golden-route-family-7d",
    title: "Tokyo • Kyoto • Osaka 7D",
    subtitle: "Golden Route สำหรับครอบครัว เน้นไฮไลต์และพักจังหวะระหว่างเมือง",
    days: 7,
    cities: ["Tokyo", "Kyoto", "Osaka"],
    pace: "balanced",
    coverStyle: "lavender",
    coverEmoji: "🚄",
    tags: ["first trip", "family", "7 days"],
    activities: [
      { day: 1, title: "Senso-ji", type: "attraction", startTime: "10:00", placeSlug: "sensoji" },
      { day: 2, title: "Tokyo Skytree", type: "attraction", startTime: "10:00", placeSlug: "tokyo-skytree" },
      { day: 3, title: "Tokyo → Kyoto", type: "transport", startTime: "09:00" },
      { day: 4, title: "Fushimi Inari", type: "attraction", startTime: "08:30", placeSlug: "fushimi-inari" },
      { day: 5, title: "Kyoto Railway Museum", type: "attraction", startTime: "10:00", placeSlug: "kyoto-railway-museum" },
      { day: 6, title: "Osaka Aquarium Kaiyukan", type: "attraction", startTime: "10:00", placeSlug: "osaka-aquarium" },
      { day: 6, title: "Dotonbori", type: "food", startTime: "17:00", placeSlug: "dotonbori" },
      { day: 7, title: "Namba shopping", type: "shopping", startTime: "10:00" },
    ],
  },
  {
    id: "fuji-family-4d",
    title: "Tokyo + Fuji Family 4D",
    subtitle: "เมือง + ธรรมชาติ เหมาะกับครอบครัวที่อยากเห็นฟูจิโดยไม่ย้ายเมืองหลายครั้ง",
    days: 4,
    cities: ["Tokyo", "Fuji"],
    pace: "balanced",
    coverStyle: "mint",
    coverEmoji: "🗻",
    tags: ["fuji", "nature", "4 days"],
    activities: [
      { day: 1, title: "Tokyo arrival & easy evening", type: "food", startTime: "17:00" },
      { day: 2, title: "Lake Kawaguchiko", type: "attraction", startTime: "09:30", placeSlug: "kawaguchiko" },
      { day: 2, title: "Oshino Hakkai", type: "attraction", startTime: "14:00", placeSlug: "oshino-hakkai" },
      { day: 3, title: "Senso-ji", type: "attraction", startTime: "09:30", placeSlug: "sensoji" },
      { day: 3, title: "Tokyo Skytree", type: "attraction", startTime: "13:30", placeSlug: "tokyo-skytree" },
      { day: 4, title: "Shopping & departure", type: "shopping", startTime: "10:00" },
    ],
  },
];

export const COVER_STYLES = [
  { id: "sky", label: "Sky Blue", emoji: "☁️" },
  { id: "aqua", label: "Aqua", emoji: "💧" },
  { id: "mint", label: "Mint", emoji: "🌿" },
  { id: "lavender", label: "Lavender", emoji: "✨" },
  { id: "night", label: "Night Blue", emoji: "🌙" },
] as const;

export function getPlace(slug: string) {
  return DISCOVERY_PLACES.find((place) => place.slug === slug);
}

export function getTemplate(id: string) {
  return TRIP_TEMPLATES.find((template) => template.id === id);
}

export function googleMapsSearchUrl(title: string, city?: string) {
  const q = [title, city, "Japan"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
