# ☸️ DigiShop Kubernetes Technical Guide

เอกสารนี้รวบรวมรายละเอียดทางเทคนิคทั้งหมดเกี่ยวกับโครงสร้างพื้นฐาน **Kubernetes** ของโปรเจ็ค DigiShop ตั้งแต่การรันในเครื่อง (Local) ไปจนถึงการขึ้นระบบจริง (Production)

---

## 🏗️ สถาปัตยกรรม (Architecture)

ระบบถูกออกแบบมาให้เป็น **Cloud-Native** 100% โดยใช้หลักการแยกส่วน (Decoupling) ดังนี้:

- **Orchestration**: Kubernetes (Kind ในเครื่อง dev / Managed K8s ใน prod)
- **Ingress Controller**: NGINX Ingress (ทำหน้าที่เป็นทางเข้าหน้าด่านและ Load Balancer)
- **Configuration**: Managed by **Kustomize** (แยก `base/` และ `overlays/`)
- **Package Registry**: GitHub Container Registry (GHCR)

### โครงสร้างไฟล์ (.k8s/)
```text
.k8s/
├── base/                # ค่าตั้งค่าหลักที่ใช้ร่วมกันทุกระบบ (Deployments, Services, HPA)
├── overlays/
│   ├── dev/             # ปรับแต่งสำหรับการรันในเครื่อง (ใช้ Image :latest, 1 replica)
│   └── prod/            # ปรับแต่งสำหรับระบบจริง (ใช้ Image SHA-tag, Scaling สูงสุด)
```

---

## 🛠️ การติดตั้งสำหรับนักพัฒนา (Local Setup)

เราใช้ **Kind (Kubernetes in Docker)** เพื่อจำลอง Cluster จริงบนเครื่องคุณ

### 1. เครื่องมือที่ต้องมี
- **Docker Desktop** (RAM 8GB+)
- **Kind**, **Kubectl**, **Kustomize**

### 2. การรันระบบ
เราได้จัดเตรียมสคริปต์อัตโนมัติไว้ให้แล้ว:
```bash
# รันทุกอย่างตั้งแต่ Build ไปจนถึง Deploy
./scripts/local-deploy.sh
```

---

## 🚀 ระบบ CI/CD และการจัดการ Image

ระบบใช้ **GitHub Actions** (`.github/workflows/ghcr-pro-build.yml`) ในการจัดการวงจรชีวิตของแอป:

1. **Build**: สร้าง Docker Image จาก `Dockerfile` ของแต่ละ Service
2. **Tagging**: ติดแท็กด้วย **Commit SHA** (เช่น `auth:a1b2c3d`) เพื่อให้ระบุเวอร์ชันที่แน่นอนได้
3. **Push**: ส่งภาพไปเก็บที่ **GHCR (ghcr.io/wiiznu/...)**

---

## 🔐 ความปลอดภัยและการตั้งค่า (Security & Secrets)

- **Non-Root User**: ทุก Service ถูกกำหนดให้รันด้วย User ที่ไม่ใช่ root เพื่อความปลอดภัย
- **Kubernetes Secrets**: ข้อมูลสำคัญ (เช่น DB Password) จะถูกจัดการผ่านทรัพยากร `Secret` เท่านั้น
- **Resource Limits**: มีการจำกัด CPU และ Memory ของแต่ละแอป เพื่อป้องกันแอปใดแอปหนึ่งกินทรัพยากรจนระบบล่ม

---

## 📈 การขยายตัวและความเสถียร (Auto-scaling & HA)

- **HPA (Horizontal Pod Autoscaler)**: ระบบจะขยายจำนวน Pods อัตโนมัติเมื่อ CPU ใช้งานเกิน 80% (ตั้งค่าได้ใน `hpa.yaml`)
- **PDB (Pod Disruption Budget)**: รับประกันว่าจะมีแอปอย่างน้อย 1 ตัวรันอยู่เสมอขณะทำการบำรุงรักษา
- **Rolling Update**: การอัปเดตโค้ดแบบ Zero-downtime โดย Kubernetes จะรอให้ Pod ใหม่พร้อมใช้งานจริง (Readiness Probe) ก่อนปิดตัวเก่า

---

## 🔍 คำสั่งที่ใช้บ่อย (Common Commands)

```bash
# ดูสถานะภาพรวม
kubectl get all

# ตรวจสอบ LOGS ของแอป
kubectl logs -f deployment/[service-name]

# เข้าไปรันคำสั่งใน Container
kubectl exec -it [pod-name] -- /bin/sh

# ดูค่าสถานะการ Scalings (HPA)
kubectl get hpa
```

---
*จัดทำโดยทีม DevOps - DigiShop*
