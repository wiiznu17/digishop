import axios from "@/lib/axios"

// ใช้คุกกี้ล้วน — ไม่ต้อง setAccessToken / localStorage แล้ว

export async function login(email: string, password: string) {
  const res = await axios.post("/api/auth/login", { email, password })
  // server จะตั้งคุกกี้ให้เอง (access + refresh)
  // ถ้าบางหน้าอยาก prime session ก็เรียก /api/auth/access ได้
  return res.data as { ok: true }
}

export async function logout(): Promise<{ ok: boolean }> {
  const res = await axios.post("/api/auth/logout")
  return res.data as { ok: boolean }
}

export async function fetchAuth(): Promise<{
  id: number
  email: string
  roles: string[]
  permissions: string[]
}> {
  const res = await axios.get("/api/auth/access")
  return res.data as {
    id: number
    email: string
    roles: string[]
    permissions: string[]
  }
}
