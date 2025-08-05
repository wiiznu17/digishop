import multer from 'multer'

// ใช้ memory storage เพื่อเก็บไฟล์ใน buffer
const storage = multer.memoryStorage()

// File filter สำหรับรูปภาพ
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
})