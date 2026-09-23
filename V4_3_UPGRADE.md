# Tabi Family V4.3 — Email + Password + QR Family Sharing

V4.3 เปลี่ยนระบบ Login หลักเป็น **Email + Password** และเพิ่มการแชร์ Trip ผ่าน **QR Code** โดยไม่ใช้ Magic Link, Google Maps API หรือ AI API

## สิ่งที่เพิ่ม

- Login ด้วย Email + Password
- สมัครบัญชีจากหน้า Login เดียวกัน
- เปลี่ยนรหัสผ่านจากหน้า Account
- แชร์ Trip ด้วย QR Code ที่สร้างใน browser (ไม่มี QR API ภายนอก)
- Invite มีวันหมดอายุและจำกัดจำนวนคนที่ใช้ได้
- Owner / Editor / Viewer
- Owner เปลี่ยนสิทธิ์หรือนำสมาชิกออกได้
- Owner ยกเลิก QR ได้ทันที
- ผู้รับสแกน QR → Login/สมัคร → Join Trip
- Shared Trip ปรากฏใน `ทริปของฉัน`, Today, Plan, Map และ Wallet
- RLS บังคับสิทธิ์ที่ฐานข้อมูล ไม่ได้พึ่ง UI อย่างเดียว

## 1) ตั้ง Supabase Email + Password

ไปที่:

`Supabase → Authentication → Sign In / Providers → Email`

ตรวจว่า Email provider เปิดอยู่

สำหรับเวอร์ชัน Zero-cost ที่ **ไม่ต้องการ Magic Link / email confirmation** ให้ปิดตัวเลือกที่ชื่อประมาณ:

`Confirm email` / `Confirm email address`

หลังปิด ผู้ใช้สมัครด้วย Email + Password แล้วจะเข้าสู่ระบบได้ทันที โดยไม่ต้องกดลิงก์จากอีเมล

> หมายเหตุด้านความปลอดภัย: การปิด Confirm email หมายถึงระบบยังไม่ได้พิสูจน์ว่าผู้สมัครเป็นเจ้าของอีเมลจริง เหมาะกับ private beta / family use ที่ต้องการ zero-cost ก่อน หากเปิดให้สาธารณะในอนาคต แนะนำใช้ Custom SMTP แล้วเปิด Confirm email กลับมา

## 2) Run SQL Migration

ไปที่:

`Supabase → SQL Editor → New query`

เปิดไฟล์:

`supabase/migrations/20260923_v4_3_email_password_qr_sharing.sql`

Copy SQL ทั้งหมด → Run

Migration จะเพิ่ม:

- `trip_collaborators`
- `trip_invites`
- Role helpers
- Invite preview / accept RPC
- RLS สำหรับ Owner / Editor / Viewer

ข้อมูล Trip เดิมไม่ถูกลบ

## 3) Deploy

Copy V4.3 ทับโปรเจกต์เดิม โดยเก็บ `.git` และ `.env.local`

```powershell
cd C:\Users\Administrator\Desktop\japan-family-trip-planner
git add .
git commit -m "V4.3 email password and QR family sharing"
git push
```

Vercel จะติดตั้ง dependency `qrcode` และ Deploy ให้อัตโนมัติ

## 4) ทดสอบ Login

เปิด:

`https://tabi-family.vercel.app/auth/login`

1. กด `สมัครสมาชิก`
2. กรอก Email
3. รหัสผ่านอย่างน้อย 8 ตัว
4. สมัคร
5. ถ้า Supabase ปิด Confirm email แล้ว ระบบควรเข้า `/trips` ทันที

## 5) ทดสอบ QR Sharing

บัญชี Owner:

1. เปิด Trip
2. กด `แชร์ทริป`
3. เลือก Editor หรือ Viewer
4. เลือกอายุ QR และจำนวนคน
5. กด `สร้าง QR Invite`
6. ใช้มือถืออีกเครื่องสแกน QR
7. Login หรือสมัครอีกบัญชี
8. กด `เข้าร่วมทริป`

บัญชีใหม่ควรเห็น Trip นั้นในหน้า `ทริปของฉัน`

## Role

| Role | สิทธิ์ |
|---|---|
| Owner | ดู/แก้ทั้งหมด, แชร์ QR, จัดการสมาชิก, ลบทริป |
| Editor | ดูและแก้แผน Family, Packing, Booking, Expense |
| Viewer | ดู Trip, Today, Route, Packing, Wallet แต่แก้ไขไม่ได้ |

## ค่าใช้จ่ายเพิ่ม

V4.3 ไม่เพิ่มบริการ API ที่คิดเงิน:

- QR สร้างใน browser ด้วย npm package
- Login ใช้ Supabase Email/Password
- ไม่ใช้ Google Maps Platform API
- ไม่ใช้ AI API

การใช้งานยังขึ้นกับโควตาฟรีของ Supabase/Vercel ตามแพ็กเกจบัญชีของคุณ
