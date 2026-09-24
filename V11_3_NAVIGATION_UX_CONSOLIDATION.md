# V11.3 — Navigation & UX Consolidation

เป้าหมาย: ลดจำนวนเมนูหลักโดยไม่ลบความสามารถเดิมของ Tabi Family

## Primary navigation ใหม่

เหลือ 5 เมนูหลักเท่านั้น:

1. Today
2. Plan
3. Explore
4. Trip Wallet
5. More

Bottom navigation บนมือถือและ desktop ใช้โครงสร้างเดียวกัน

## Today

รวมแนวคิด Smart Dashboard / Today Mode / Live Status / Timeline / Delay เข้าด้วยกัน
Today Command Center เหลือทางลัดหลักไป Plan, Trip Wallet, Drive และ Emergency

## Plan

หน้า Plan ใช้ Master Plan เป็น Hub หลัก และมี 4 tabs:

- Itinerary
- Map
- Route
- Check

เครื่องมือ Calendar, Smart Day, Route Optimizer, Transport, Destinations และ Weather ถูกย้ายไว้ใน "เครื่องมือวางแผน" แบบพับเก็บได้

## Explore

คง Explore, Thai popular places, restaurant filters, Place Intelligence, Map และ Wishlist ไว้ในกลุ่มเดียว

## Trip Wallet

มี tabs เดียวสำหรับ:

- Overview
- Bookings
- Documents
- Expenses
- Inbox

Auto Import / OCR กลายเป็น action ภายใน Wallet แทนการเป็นเมนูหลัก

## More

รวมฟังก์ชันที่ไม่ได้เปิดทุกวันเป็นหมวด:

- Trip setup: All Trips, Destinations, Family, Packing, Cover, Share, Account
- Drive & transport tools: Drive, Route Cost
- Offline & safety: Offline Pack, Emergency
- Data & export: Backup/Restore, Export
- Advanced: Readiness, Smart Alerts

## Compatibility

- ไม่ลบ route เดิมหรือข้อมูลเดิม
- Command Center เดิม redirect ไป Today เพื่อไม่ให้เกิด Dashboard ซ้ำซ้อน
- ไม่มี SQL migration ใหม่
- Supabase schema เดิมของ V11.2 ใช้ต่อได้
- PWA cache bump เป็น V11.3
