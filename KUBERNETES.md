# ☸️ DigiShop Kubernetes Get Started Guide

คู่มือฉบับรวบรัดสำหรับการติดตั้งและรันระบบ DigiShop บน Kubernetes (Kind) สำหรับนักพัฒนาที่เพิ่งเริ่มต้น

---

## 🛠️ ขั้นตอนเตรียมตัว (Prerequisites)

ก่อนเริ่มรันระบบ ตรวจสอบว่าเครื่องของคุณมีเครื่องมือเหล่านี้ครบถ้วน:
- **Docker Desktop**: แนะนำให้ตั้งค่า RAM อย่างน้อย 8GB+
- **Kind**: สำหรับจำลอง Cluster (`brew install kind`)
- **Kubectl**: สำหรับสั่งการ Cluster (`brew install kubectl`)

---

## 🚀 เริ่มใช้งานใน 5 นาที (Quick Start)

### 1. ตั้งค่า Secrets (สำคัญมาก)
ระบบต้องการ API Keys และ Config บางอย่างเพื่อรันบริการพื้นฐาน ให้คัดลอกไฟล์ตัวอย่างไปสร้างไฟล์จริง:
```bash
cp .k8s/base/secrets.yaml.example .k8s/base/secrets.yaml
```
> [!WARNING]
> ตรวจสอบในไฟล์ `secrets.yaml` ว่ามีค่า `SENDGRID_API_KEY`, `SUPABASE_URL`, และ `AZURE_STORAGE_*` ให้ครบถ้วน
> **ห้าม Push ไฟล์ `secrets.yaml` ขึ้น Git เด็ดขาด** เพราะข้อมูลเป็นเพียง Base64 (ไม่ได้เข้ารหัส) ควรใช้ `secrets.yaml.example` เป็นแม่แบบเท่านั้น

### 2. รันระบบทั้งหมด
เราได้เตรียมสคริปต์ที่จัดการทุกอย่างให้ในคำสั่งเดียว (Build, Load, Apply):
```bash
./scripts/local-deploy.sh
```
*รอประมาณ 5-10 นาทีเพื่อให้ Next.js Build และโหลด Image เข้าสู่ Cluster*

---

## 🌐 ช่องทางเข้าใช้งาน (Access Endpoints)

เมื่อระบบขึ้นสถานะ `Running` ครบทุกตัว คุณสามารถเข้าใช้งานได้ที่ URL เหล่านี้:

| ส่วนงาน | URL (Local) | Health Check |
| :--- | :--- | :--- |
| **หน้าร้าน (Customer)** | [http://localhost](http://localhost) | `/healthz` |
| **ร้านค้า (Merchant)** | [http://merchant.localhost](http://merchant.localhost) | `/api/healthz` |
| **แอดมิน (Admin Portal)** | [http://portal.localhost](http://portal.localhost) | `/api/healthz` |
| **ระบบล็อกอิน (Auth API)** | [http://localhost/api/auth](http://localhost/api/auth) | `/api/auth/healthz` |

---

## 🛠️ รอบวงจรการพัฒนา (Development Workflow)

### หากมีการแก้ไขโค้ด (Manual Redeploy)
หากคุณแก้ไขโค้ดใน Service ใด Service หนึ่ง และต้องการดูผลใน Cluster ทันที:
```bash
# 1. Build & Load เข้า Kind
docker build -t ghcr.io/wiiznu/[service-name]:latest -f apps/[service-name]/Dockerfile .
kind load docker-image ghcr.io/wiiznu/[service-name]:latest --name digishop-cluster

# 2. สั่ง Restart Pod
kubectl rollout restart deployment [service-name]
```

### หากมีการแก้ไขไฟล์ใน `.k8s/`
```bash
kubectl apply -k .k8s/overlays/dev
```

---

## 🆘 การแก้ปัญหาเบื้องต้น (Troubleshooting)

### 1. ล้างฐานข้อมูลใหม่ (Reset MySQL)
หากรหัสผ่าน DB ไม่ตรงหรือต้องการเริ่มข้อมูลใหม่ทั้งหมด:
```bash
kubectl delete statefulset mysql && kubectl delete pvc mysql-data-mysql-0 && kubectl apply -k .k8s/overlays/dev
```

### 2. หยุดการทำงานชั่วคราว (Pause/Resume)
หากต้องการประหยัดทรัพยากร (CPU/RAM) โดยที่ยังไม่ต้องการลบ Cluster ทิ้ง สามารถหยุด Container ของ Kind ได้:
- **หยุดชั่วคราว**: `./scripts/local-pause.sh` (ใช้ `docker stop`)
- **กลับมาทำงานต่อ**: `./scripts/local-resume.sh` (ใช้ `docker start`)

### 3. ลบทรัพยากรทั้งหมด (Full Cleanup)
หากต้องการลบ Cluster ออกจากเครื่องถาวร:
```bash
./scripts/local-cleanup.sh
```
หรือใช้คำสั่ง: `kind delete cluster --name digishop-cluster`

### 4. ตรวจสอบสถานะและ LOGS
```bash
# ดูสถานะ Pod ทั้งหมด (ควรเป็น 1/1 Running)
kubectl get pods

# ดู Logs เมื่อแอปพัง
kubectl logs -f deployment/[service-name]
```

---
> [!TIP]
> **หมายเหตุทางเทคนิค**: 
> - **Backend**: ทุก Backend Service ถูกบังคับให้ใช้ตัวแปร `PORT` ผ่าน `deployment.yaml` และมี `readinessProbe` ที่สัมพันธ์กับ Route จริงในแอป
> - **Frontend (Assets)**: เนื่องจากใช้ Next.js Standalone mode ใน Monorepo ต้องมั่นใจว่าใน `Dockerfile` มีการ COPY โฟลเดอร์ `public` และ `static` ไปยัง Path ที่ถูกต้อง (เช่น `apps/[app]/public`) ไม่เช่นนั้นรูปภาพจะไม่แสดงผล
