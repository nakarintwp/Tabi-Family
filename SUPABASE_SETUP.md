# Supabase setup checklist — Tabi Family V4.3

1. สร้าง Supabase Project
2. ตั้ง `NEXT_PUBLIC_SUPABASE_URL`
3. ตั้ง `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Run `supabase/schema.sql` สำหรับ Project ใหม่ หรือ migrations ตามลำดับสำหรับ Project เดิม
5. สำหรับ Project ที่อยู่ V4 แล้ว ให้ Run `supabase/migrations/20260923_v4_3_email_password_qr_sharing.sql`
6. Authentication → Sign In / Providers → Email → เปิด Email provider
7. สำหรับ zero-cost login แบบไม่ใช้ Magic Link ให้ปิด `Confirm email`
8. Vercel → Environment Variables ใช้ Supabase 2 ตัวเดิม ไม่ต้องเพิ่ม key ใหม่
9. V4.3 ไม่ต้องใช้ Google Maps API key
10. ทดสอบด้วย 2 บัญชี: Owner สร้าง QR → บัญชีที่สองสแกน → Join

ดูรายละเอียดใน `V4_3_UPGRADE.md`

## V6 migration

หลังจาก V5.1 ให้รัน:

`supabase/migrations/20260923_v6_complete_trip_experience.sql`

เพื่อเปิดใช้ Today statuses, Rain Plan metadata และ Collaboration Activity Feed

## V7 migration

After V6, run:

`supabase/migrations/20260923_v7_discovery_planning.sql`

This adds Trip Cover metadata, Wishlist, Transport Segments and their RLS policies. No new environment variable is required.
