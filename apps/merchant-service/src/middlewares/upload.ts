import multer from 'multer'

// ใช้ memory storage เพื่อเก็บไฟล์ใน buffer
const storage = multer.memoryStorage()

// File filter สำหรับรูปภาพ
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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
    fileSize: 1 * 1024 * 1024, // 1MB limit
    files: 10 // Maximum 10 files
  }
})
