/app หรือ /pages     ← (ขึ้นกับคุณใช้ App Router หรือ Page Router)
/components           ← ส่วนของ UI แยกเป็น component ย่อยๆ
/lib                  ← Business logic เช่น calculateTotalPrice(), taxCalculator()
/utils                ← Helper functions เช่น formatPrice(), capitalizeText()
/hooks                ← Custom React hooks เช่น useCart(), useAuth()
/contexts             ← React Context สำหรับ global state เช่น CartContext
<!-- /services             ← ฟังก์ชันเรียก API เช่น ProductService, AuthService -->
/types                ← TypeScript types/interfaces (เช่น Product, User)
/public               ← ไฟล์ static (รูปสินค้า, โลโก้ ฯลฯ)
/styles               ← CSS/SCSS/Styled components หรือ Tailwind config
/middleware.ts        ← (ถ้ามีการใช้งาน middleware auth หรือ redirect)