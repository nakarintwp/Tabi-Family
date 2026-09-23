# Supabase setup checklist — Tabi Family V4.1

1. Create a Supabase project.
2. Fresh install: run `supabase/schema.sql` in SQL Editor.
3. Existing V2 install: run `supabase/migrations/20260923_v3_family_maps_pace.sql` once.
4. Add Supabase Project URL + Publishable Key to Vercel.
5. Redeploy.
6. Set Supabase Auth Site URL to `https://tabi-family.vercel.app`.
7. Add redirect URLs `https://tabi-family.vercel.app/**` and `http://localhost:3000/**`.
8. Login using `/auth/login`.
9. Open a trip → Family and save a detailed member profile.
10. Open Day Planner and verify activity writes.
11. V4.1 ไม่ต้องใช้ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
12. เปิด `/today` หรือ Route Map บนมือถือและอนุญาต Location เพื่อใช้ตำแหน่งปัจจุบันเป็นต้นทาง.


## V4 Zero-cost

Run `supabase/migrations/20260923_v4_zero_cost_planner.sql` after the V3.2 migration. V4 does not require a Google Maps API key; normal Google Maps links are used instead.

## V4.1 Current Location

ไม่ต้องรัน SQL เพิ่มจาก V4. Browser Geolocation ทำงานบน HTTPS ของ Vercel และตำแหน่งปัจจุบันไม่ได้ถูกบันทึกลง Supabase ในฟีเจอร์นี้.

## V4.2 — Mobile OTP Login

หน้าเข้าสู่ระบบใช้ Email OTP 6 หลักแทนการพึ่ง Magic Link อย่างเดียว ดูขั้นตอนตั้ง Supabase Email Template ใน `V4_2_UPGRADE.md`

