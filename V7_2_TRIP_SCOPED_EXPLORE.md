# V7.2 — Trip-Scoped Explore

## แนวคิด
Explore ต้องเริ่มจาก Trip ไม่ใช่เปิดข้อมูลทั่วญี่ปุ่นโดยไม่มีบริบท

## Flow ใหม่

1. ตอนสร้าง Trip เลือกเมือง/พื้นที่ที่จะไป
2. ระบบบันทึกลง `trips.cities` ซึ่งมีอยู่แล้ว
3. จาก Trip Dashboard กด Explore → `/explore?trip=<trip-id>`
4. Explore จะแสดงเฉพาะเมืองที่อยู่ใน Trip
5. กด Wishlist จะบันทึกเข้าทริปนั้นโดยตรง ไม่ต้องเลือก Trip ซ้ำ
6. Owner แก้เมืองภายหลังได้ที่ `/trips/[id]/destinations`

## Chubu dataset ที่ขยาย

- Nagoya: 17 จุด
- Takayama: 8 จุด
- Shirakawa-go: 7 จุด

รวมทั้ง landmark, family, museum, shopping, food, indoor/outdoor และ day-trip ใกล้เมืองหลัก

## Compatibility

ลิงก์แบบเดิมยังใช้ได้:

- `/explore?city=Nagoya`
- `/explore?city=Takayama`
- `/explore?city=Shirakawa-go`

หากเปิด `/explore` โดยไม่ใส่ city ระบบจะใช้ Trip ถัดไป/Trip แรกที่เข้าถึงได้เป็น scope อัตโนมัติ และสามารถสลับ Trip จากหน้า Explore ได้

## Database

V7.2 ไม่เพิ่มตารางหรือ column ใหม่ จึงไม่ต้อง Run SQL เพิ่ม เพราะใช้ `trips.cities` จากระบบเดิม
