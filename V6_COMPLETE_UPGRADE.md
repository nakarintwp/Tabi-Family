# Tabi Family V6 — Complete Trip Experience

V6 รวม roadmap ที่ขอไว้ทั้งหมดใน release เดียว:

- V5.2 PWA + Offline
- V5.3 Today Mode Pro
- V5.4 Collaboration
- V5.5 Export / Backup
- V6 Weather / Rain Plan

## 1) Run SQL migration ก่อน

Supabase → SQL Editor → New query → วางไฟล์:

`supabase/migrations/20260923_v6_complete_trip_experience.sql`

แล้วกด Run

Migration นี้เพิ่ม:
- `activities.status`
- `activities.completed_at`
- `activities.is_outdoor`
- `activities.rain_alternative`
- `trip_activity_log`
- activity audit triggers
- `get_trip_activity_feed()`

ข้อมูลทริปเดิมไม่ถูกลบ

## 2) Deploy code

Copy ไฟล์ V6 ทับโปรเจกต์เดิม โดยเก็บ `.git` และ `.env.local` แล้ว:

```powershell
git add .
git commit -m "V6 PWA Today collaboration export weather"
git push
```

Vercel จะ deploy อัตโนมัติ

## 3) ทดสอบ PWA

เปิด `https://tabi-family.vercel.app` บนมือถือ

- Android/Chrome: เมนู Install app หรือหน้า Account → ติดตั้งแอป
- iPhone/Safari: Share → Add to Home Screen

เปิดหน้า Today ออนไลน์อย่างน้อยหนึ่งครั้ง จากนั้นปิดเน็ตและเปิดแอปใหม่ จะเห็น Offline snapshot ล่าสุด

## 4) Today Mode Pro

หน้า `/today` รองรับ:
- เสร็จแล้ว
- ไว้ทีหลัง
- ข้าม
- กลับเป็นรอทำ
- progress ของวัน
- Current Location navigation

## 5) Collaboration

ของเดิม Owner / Editor / Viewer + QR invite ยังอยู่ และเพิ่ม Activity Feed ใน Trip Dashboard เพื่อดูการแก้ไขล่าสุด

## 6) Export / Backup

Trip Dashboard → Export

- Print / Save PDF (ใช้ browser print)
- JSON backup
- Itinerary CSV
- Expense CSV

ไม่มี API หรือ service เสียเงิน

## 7) Weather / Rain Plan

Trip Dashboard → Weather

ใช้ Open-Meteo แบบไม่ต้อง API key

ใน Day Planner ให้ติ๊ก “กลางแจ้ง / อ่อนไหวต่ออากาศ” และใส่ “แผนสำรองถ้าฝนตก” ระบบ Weather จะจับคู่ forecast กับวันเดินทางและเตือนกิจกรรมกลางแจ้ง

หมายเหตุ: Forecast แสดง 7 วันข้างหน้า จึงมีประโยชน์ที่สุดเมื่อใกล้วันเดินทาง
