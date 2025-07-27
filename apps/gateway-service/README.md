Frontend ส่ง request มาที่ Gateway

Gateway ตรวจ JWT ที่แนบใน Authorization: Bearer <token>

เช็คว่า role ตรงกับที่กำหนดไว้ไหม

ถ้าตรง → ส่งต่อไปยัง backend service ที่กำหนด

ถ้าไม่ตรง → ตอบ 403 Forbidden