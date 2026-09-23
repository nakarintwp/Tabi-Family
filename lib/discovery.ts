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
  latitude: number;
  longitude: number;
};

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
