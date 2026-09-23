# Tabi Family V4.1 — Current Location Route + Today Mode

V4.1 ต่อจาก V4 โดยไม่เพิ่มบริการเสียเงินและไม่ต้องรัน SQL migration เพิ่ม

## สิ่งที่เพิ่ม

- Route Map ใช้ตำแหน่งปัจจุบันจากมือถือเป็นต้นทาง
- มีสถานที่ปลายทางเพียง 1 จุดก็เปิดเส้นทางได้
- Browser Geolocation (`navigator.geolocation`) ทำงานบน HTTPS ของ Vercel
- ปุ่มเปิด Google Maps แบบขนส่งสาธารณะและเดิน โดยใช้ URL โดยตรง ไม่ใช้ Maps API
- ถ้ามีพิกัดปลายทาง ระบบแสดงระยะเส้นตรงจากตำแหน่งมือถือ
- ถ้าไม่มี lat/lng แต่มีชื่อสถานที่ ยังเปิดเส้นทางด้วยชื่อสถานที่ได้
- Today Mode `/today`
  - ตรวจวันปัจจุบันจากมือถือ
  - แสดงกิจกรรมถัดไป
  - Route จาก Current Location ไปจุดถัดไป
  - Timeline วันนี้
  - ถ้ายังไม่ถึงวันเดินทาง แสดงวันทริปถัดไป
- Bottom Navigation เพิ่ม Today

## วิธีอัปเกรด

1. Copy ไฟล์ V4.1 ทับโปรเจกต์ V4 เดิม โดยเก็บ `.git` และ `.env.local`
2. ไม่ต้องรัน SQL เพิ่ม
3. Push GitHub

```powershell
git add .
git commit -m "V4.1 current location route and today mode"
git push
```

4. รอ Vercel Deploy
5. เปิดบนมือถือ `https://tabi-family.vercel.app/today`
6. เมื่อกด `ใช้ตำแหน่งปัจจุบัน` ให้เลือก Allow/อนุญาต Location

## หมายเหตุเรื่อง Location

- Vercel เป็น HTTPS จึงรองรับ Browser Geolocation
- Tabi Family ไม่บันทึกตำแหน่งปัจจุบันลง Supabase ใน V4.1 ตำแหน่งถูกใช้ใน browser เพื่อสร้างลิงก์นำทางเท่านั้น
- ถ้าผู้ใช้ไม่อนุญาต Location ยังสามารถกดเปิด Google Maps ได้ โดย Google Maps อาจเลือกตำแหน่งปัจจุบันของอุปกรณ์เป็นต้นทางเอง
- ไม่มี Google Maps API key และไม่มี Google Maps Platform billing เพิ่มจากฟีเจอร์นี้
