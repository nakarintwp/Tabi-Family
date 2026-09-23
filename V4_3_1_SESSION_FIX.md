# Tabi Family V4.3.1 — Session Fix

รุ่นนี้แก้ปัญหา session เก่าหลังจากลบ User ใน Supabase ซึ่งอาจทำให้ UI เหมือนยัง Login อยู่ แต่ action เช่น Create Trip ถูก RLS ปฏิเสธ

## สิ่งที่แก้

เดิมหลายหน้าตรวจผู้ใช้ด้วย `auth.getClaims()` ซึ่งตรวจ JWT ได้เร็ว แต่ถ้า User ถูกลบจาก Supabase ขณะที่ Browser ยังมี JWT เก่า claims อาจยังอยู่ชั่วคราว

V4.3.1 เพิ่ม `lib/supabase/auth.ts` และใช้ `auth.getUser()` กับงานที่ต้องยืนยันตัวตนจริง เช่น:

- Create Trip
- Delete Trip
- Day Planner / Family / Packing / Wallet
- QR Join
- Share Trip / จัดการสมาชิก
- Account / เปลี่ยนรหัสผ่าน
- Today / Map / Trip pages

ถ้า User ไม่มีอยู่จริง ระบบจะส่งกลับ `/auth/login?session=expired...` และหน้า Login จะล้าง local auth session เก่าใน Browser ก่อนให้ Login ใหม่

## ต้อง Run SQL ไหม?

**ไม่ต้อง** — V4.3.1 เป็น application/session patch เท่านั้น และใช้ RLS เดิมของ V4.3 ต่อได้

## วิธีอัปเดต

แตก ZIP แล้ว Copy ทับโปรเจกต์เดิม โดยเก็บ `.git` และ `.env.local` ไว้ จากนั้น:

```powershell
cd C:\Users\Administrator\Desktop\japan-family-trip-planner
git add .
git commit -m "V4.3.1 verify auth user and clear stale sessions"
git push
```

Vercel จะ Deploy อัตโนมัติ

## วิธีทดสอบ

1. เปิด Tabi Family แล้ว Login ด้วย Email + Password
2. สร้าง Trip ใหม่ ต้องสร้างได้
3. เปิด Supabase → Authentication → Users
4. สำหรับบัญชีทดสอบเท่านั้น ลบ User ขณะ Browser ยังเปิดอยู่
5. กลับมา Refresh หน้า protected เช่น `/trips`
6. ระบบควรพากลับ Login พร้อมข้อความว่า session ใช้ไม่ได้แล้ว แทนการปล่อยให้ชน RLS
7. สมัคร/Login ด้วย User ที่มีอยู่จริง แล้วลอง Create Trip อีกครั้ง

## ถ้ายังเจอ RLS ตอน Create Trip

หลัง V4.3.1 หาก `getUser()` ผ่านแล้วแต่ยังขึ้น `new row violates row-level security policy for table "trips"` ให้ตรวจว่าได้ Run migration V4.3 และ V3.2 ใน Supabase project เดียวกับ `NEXT_PUBLIC_SUPABASE_URL` ของ Vercel เพราะกรณีนั้นจะเป็นปัญหา schema/policy มากกว่า stale session
