# Tabi Family V3.1 — Delete Own Trip

V3.1 เพิ่มความสามารถให้ผู้ใช้ลบทริปที่ตัวเองสร้างได้อย่างปลอดภัย

## สิ่งที่เพิ่ม

- ปุ่ม **ลบทริปนี้** ที่ด้านล่างหน้า Trip Dashboard
- กล่องยืนยันก่อนลบ เพื่อป้องกันการกดพลาด
- Server Action ตรวจ `owner_id` ของบัญชีที่ล็อกอินก่อน DELETE
- ใช้ Supabase RLS เดิมซ้ำอีกชั้น ผู้ใช้จึงไม่สามารถลบทริปของบัญชีอื่นได้
- Foreign keys ใน schema เดิมเป็น `ON DELETE CASCADE` จึงลบข้อมูลลูกของทริปให้อัตโนมัติ เช่น Day, Activity, Family Member, Booking และ Expense
- หลังลบจะกลับไปหน้า `/trips` และ revalidate หน้า Home / Plan / Map / Wallet

## ต้องรัน SQL เพิ่มหรือไม่?

**ไม่ต้อง** ถ้าใช้ schema ของ V1–V3 ที่มากับโปรเจกต์ เพราะ RLS และ `ON DELETE CASCADE` มีอยู่แล้ว

## อัปเกรด

คัดลอกไฟล์ V3.1 ทับโปรเจกต์เดิม โดยเก็บ `.git` และ `.env.local` ของคุณไว้ จากนั้น:

```powershell
git add .
git commit -m "V3.1 allow owners to delete trips"
git push
```

Vercel จะ deploy อัตโนมัติ

## ทดสอบ

1. Login
2. เปิด **ทริปของฉัน**
3. เข้า Trip Dashboard ของทริปที่ต้องการลบ
4. เลื่อนลงด้านล่างสุดหัวข้อ **จัดการทริป**
5. กด **ลบทริปนี้**
6. ยืนยันใน dialog
7. ระบบต้องกลับหน้า `/trips` และทริปนั้นต้องหายไป
