# 🛒 DigiShop - E-commerce Monorepo Platform

**DigiShop** เป็นระบบอีคอมเมิร์ซแบบครบวงจรที่พัฒนาด้วยสถาปัตยกรรม Microservices และ Micro-frontends ภายใต้โครงสร้าง Monorepo ที่ทันสมัย จัดการด้วย **Turborepo** เพื่อประสิทธิภาพและความคล่องตัวสูงสุดในการพัฒนา

---

## 🏗️ โครงสร้างระบบ (Architecture)

โปรเจ็คนี้ใช้โครงสร้างแบบ Monorepo โดยแบ่งออกเป็น 2 ส่วนหลักคือ `apps/` (Applications) และ `packages/` (Shared Modules)

### 📱 Applications (`apps/`)

| ประเภท | ชื่อ Service | เทคโนโลยี | รายละเอียด |
| :--- | :--- | :--- | :--- |
| **Frontend** | `customer` | Next.js 15 | หน้าเว็บสำหรับลูกค้าสั่งซื้อสินค้า (Port 3000) |
| | `merchant` | Next.js 15 | ระบบจัดการสำหรับผู้ขาย (Port 3002) |
| | `portal` | Next.js 15 | ระบบจัดการหลังบ้านส่วนกลาง (Admin Portal) (Port 3003) |
| **Backend** | `authen-service` | Express | ระบบจัดการ Authentication & Authorization (Port 4001) |
| | `customer-service` | Express | บริการข้อมูลสำหรับฝั่งลูกค้า (Port 4002) |
| | `merchant-service` | Express | บริการข้อมูลสำหรับผู้ขาย (Port 4003) |
| | `portal-service` | Express | ระบบ API สำหรับผู้ดูแลระบบ (Port 4004) |
| **Mobile** | `customer-mobile`| Expo (RN) | แอปพลิเคชันมือถือสำหรับลูกค้า |
| **Worker** | `merchant-worker`| Node.js | จัดการงานเบื้องหลังและ Queue |

### 📦 Shared Packages (`packages/`)

- `db`: Shared Database Client & Schema (Sequelize + MySQL)
- `ui`: ชุดคอมโพเนนต์ UI พื้นฐาน (Re-usable Components)
- `typescript-config`: รวมการตั้งค่า TypeScript ของทั้งโปรเจ็ค
- `eslint-config`: มาตรฐานการเขียนโค้ดและ Linting rules

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion, Radix UI
- **Backend**: Node.js, Express, TypeScript, Zod (Schema Validation)
- **Database/Storage**: MySQL (Sequelize ORM), Redis (Queue & Cache)
- **Infrastructure**: Nginx (API Gateway), Docker, Turborepo

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### 1. การติดตั้ง (Installation)
ติดตั้ง dependencies ทั้งหมดของ monorepo ในครั้งเดียว:
```bash
npm install
```

### 2. การจัดการฐานข้อมูล (Database Management)

ก่อนเริ่มรันโปรเจ็คหลัก ต้องทำการ Migration และ Seed ข้อมูลพื้นฐานลงใน MySQL:
```bash
# รัน migration เพื่อสร้างตาราง
npm run db:migrate

# รัน seed เพื่อเพิ่มข้อมูลเริ่มต้น
npm run db:seed

# หากต้องการยกเลิกการแก้ไขล่าสุด (Undo)
npm run db:undo
```

#### การสร้าง Version ฐานข้อมูลใหม่ (Create Migration)
หากต้องการแก้ไข Schema หรือเพิ่มตารางใหม่ ให้สร้างไฟล์ Migration ใหม่โดยระบุโฟลเดอร์เวอร์ชันที่ต้องการ (เช่น `v1.0`, `v1.1` เป็นต้น):

```bash
# สร้างไฟล์ migration ใหม่ในเวอร์ชันที่กำหนด (เช่น v1.1)
npx sequelize-cli migration:generate --name [ชื่อ-migration] --migrations-path packages/db/src/migrations/v1.1
```
*หลังจากรันคำสั่ง ระบบจะสร้างไฟล์ `.js` ให้ทำการเปลี่ยนนามสกุลเป็น `.ts` และย้าย/เขียนโค้ดตามรูปแบบเดิม*

> [!IMPORTANT]
> ระบบจะรัน Migration จากทุกโฟลเดอร์ใน `packages/db/src/migrations/` โดยเรียงตามลำดับชื่อเวอร์ชัน (v1.0 -> v1.1 -> v1.2) โดยอัตโนมัติเมื่อรันคำสั่ง `npm run db:migrate`

---
### 3. การรันโปรเจ็ค (Running)

#### ➤ โหมดการพัฒนา (Local Development)
รันทุกบริการ (Frontend + Backend) พร้อมกัน:
```bash
npm run dev
```

รันเฉพาะส่วนที่ต้องการ (Selective Run):
```bash
# รัน Merchant Web + Service
npm run dev:merchant

# รัน Customer Web + Service
npm run dev:customer

# รัน Admin Portal + Service
npm run dev:portal

# รันระบบ Authentication อย่างเดียว
npm run dev:authen

# รัน Background Workers สำหรับ Queue
npm run dev:queues
```

#### ➤ โหมดจำลอง Production (Docker Mode)
รันทั้งระบบด้วย Docker Compose:
```bash
docker-compose -f docker-compose.prod.yml up -d
```
*ระบบจะเปิดใช้งาน Gateway ที่พอร์ต **4000***

---

## ⚙️ คำสั่งอื่นๆ ที่ควรรู้ (Others)

### ตรวจสอบมาตรฐานโค้ด:
```bash
# เช็กความถูกต้องของ Types
npm run check-types

# รัน Linting
npm run lint

# จัดฟอร์แมตโค้ดอัตโนมัติ
npm run format
```

---
*จัดทำโดยทีมพัฒนา DigiShop*
