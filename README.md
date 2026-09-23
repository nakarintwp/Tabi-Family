# Tabi Family — Japan Family Trip Planner

Mobile-first family trip planner built with **Next.js + Supabase + Vercel**.

## Current version: V4.3.1 Session Fix

The project now supports:

- Supabase Email + Password Auth + RLS
- QR Family Sharing (Owner / Editor / Viewer)
- Create/delete trips
- Duplicate-trip protection
- Family profiles
- Day Planner Pro
- Family Smart Pace
- Google Maps links without Maps API
- Packing checklist
- Booking Wallet
- Expense Tracker
- Mobile-first UI

## Zero-cost design

V4.3 does **not require Google Maps API, AI API, or an external QR API**.

For places and routes, the app stores place names / optional Google Maps links and opens normal Google Maps web URLs. This avoids the need to enable Google Maps Platform billing.

## Upgrade from V3.2

Read `V4_UPGRADE.md`.

Run:

`supabase/migrations/20260923_v4_zero_cost_planner.sql`

before using Packing / Booking Wallet / Maps URL fields.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Push to GitHub. Vercel will redeploy automatically.

## V4.1 — Current Location Route + Today Mode

V4.1 เพิ่ม `/today` และ Route Map ที่ใช้ Browser Geolocation จากมือถือเป็นต้นทาง จึงใช้ปลายทางเพียง 1 จุดได้ ไม่ต้องใช้ Google Maps API key ดูขั้นตอนอัปเกรดใน `V4_1_UPGRADE.md`

## V4.2 — Mobile OTP Login

หน้าเข้าสู่ระบบใช้ Email OTP 6 หลักแทนการพึ่ง Magic Link อย่างเดียว ดูขั้นตอนตั้ง Supabase Email Template ใน `V4_2_UPGRADE.md`


## V4.3 — Email + Password + QR Family Sharing

V4.3 ใช้ Email + Password เป็น Login หลักและไม่ต้องพึ่ง Magic Link สำหรับการใช้งานประจำวัน เจ้าของ Trip สามารถสร้าง QR Invite ให้สมาชิกครอบครัวเข้าร่วมเป็น Editor หรือ Viewer ได้

ก่อน Deploy ให้ Run:

`supabase/migrations/20260923_v4_3_email_password_qr_sharing.sql`

และตั้ง Supabase Email provider โดยปิด `Confirm email` หากต้องการ flow แบบ zero-cost ที่ไม่ส่งลิงก์ยืนยันอีเมล

ดูขั้นตอนทั้งหมดใน `V4_3_UPGRADE.md`

## V4.3.1 — Session Fix

V4.3.1 ป้องกันกรณี Browser ยังถือ session เก่าหลังจาก User ถูกลบ/เปลี่ยนใน Supabase โดยเปลี่ยนหน้าที่สำคัญและ Server Actions จากการเชื่อ JWT claims อย่างเดียว เป็นการตรวจ User จริงกับ Supabase Auth ผ่าน `getUser()` ก่อนทำงาน

- ถ้า User ยังมีอยู่ → ทำงานต่อปกติ
- ถ้า session เก่า / User ถูกลบ → กลับหน้า Login
- หน้า Login จะล้าง local session เก่าอัตโนมัติ
- Create Trip / Delete Trip / QR Join / Share / Day Planner / Packing / Wallet / Account ใช้ verified user
- **ไม่ต้อง Run SQL เพิ่ม**

ดูรายละเอียดใน `V4_3_1_SESSION_FIX.md`
