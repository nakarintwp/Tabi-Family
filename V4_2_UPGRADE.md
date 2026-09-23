# Tabi Family V4.2 — Mobile OTP Login

V4.2 เปลี่ยนหน้า Login จาก Magic Link เป็น **Email OTP** เพื่อให้ใช้งานบนมือถือได้ง่ายขึ้น

## สิ่งที่เปลี่ยน

- ส่งรหัส OTP ทางอีเมล
- กรอกรหัส OTP ในหน้า Tabi Family เดิมได้เลย
- รองรับ `autocomplete="one-time-code"` บนมือถือ
- มีปุ่มส่งรหัสใหม่พร้อม countdown 60 วินาที
- เปลี่ยนอีเมลได้โดยไม่ต้อง reload
- Magic Link callback เดิมยังคงอยู่เป็น fallback
- ไม่ต้องเพิ่ม API และไม่มีค่าใช้จ่าย API ใหม่

## สำคัญ — ตั้ง Supabase Email Template 1 ครั้ง

Supabase `signInWithOtp()` จะส่งรูปแบบอีเมลตาม Email Template ของโปรเจกต์ ถ้า Template เดิมใช้เฉพาะ `{{ .ConfirmationURL }}` ผู้ใช้จะยังเห็น Magic Link แต่จะไม่เห็นรหัส OTP

ไปที่:

`Supabase Dashboard → Authentication → Email Templates → Magic Link`

จากนั้นแก้ Body ให้มี `{{ .Token }}` ตัวอย่าง:

```html
<h2>รหัสเข้าสู่ระบบ Tabi Family</h2>
<p>กรอกรหัสนี้ในหน้า Tabi Family:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px;">{{ .Token }}</p>
<p>หากคุณไม่ได้ขอรหัสนี้ สามารถละเว้นอีเมลได้</p>
<hr />
<p>หรือใช้ลิงก์สำรอง:</p>
<p><a href="{{ .ConfirmationURL }}">เข้าสู่ระบบด้วย Magic Link</a></p>
```

จากนั้นกด **Save**

> แนะนำให้เก็บ `{{ .ConfirmationURL }}` ไว้ด้วย เพื่อให้ Magic Link ยังเป็น fallback ได้

## ตรวจ URL Configuration

`Supabase → Authentication → URL Configuration`

Site URL:

```text
https://tabi-family.vercel.app
```

Redirect URLs:

```text
https://tabi-family.vercel.app/**
http://localhost:3000/**
```

## Deploy

V4.2 **ไม่ต้อง Run SQL migration เพิ่ม**

Copy โปรเจกต์ทับ V4.1 โดยเก็บ `.git` และ `.env.local` แล้วรัน:

```powershell
git add .
git commit -m "V4.2 mobile OTP login"
git push
```

Vercel จะ deploy อัตโนมัติ

## ทดสอบบนมือถือ

1. เปิด `https://tabi-family.vercel.app/auth/login`
2. กรอกอีเมล
3. กด **ส่งรหัสเข้าสู่ระบบ**
4. เปิด Gmail/Mail แล้วดูรหัส OTP
5. กลับ Chrome/Safari ที่เปิด Tabi Family
6. กรอกรหัส
7. กด **ยืนยันและเข้าสู่ระบบ**

ไม่จำเป็นต้องเปิดลิงก์จากอีเมล ทำให้ session อยู่ใน browser ที่กำลังใช้งาน Tabi Family โดยตรง
