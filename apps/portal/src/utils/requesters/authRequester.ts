import axios from "@/lib/axios"
import { setAccessToken } from "@/lib/tokenStore"

// export async function login(
//   email: string,
//   password: string
// ): Promise<{ accessToken: string }> {
//   const res = await axios.post("/api/auth/login", { email, password })
//   const data = res.data as { accessToken: string }
//   console.log("access tk: ", data.accessToken)
//   if (data?.accessToken) setAccessToken(data.accessToken)
//   return data
// }
export async function warmMe() {
  try {
    console.log("access from warm")
    await axios.get("/api/auth/access")
  } catch {}
}

export async function login(email: string, password: string) {
  const res = await axios.post("/api/auth/login", { email, password })
  const { accessToken } = res.data as { accessToken: string }
  console.log("access tk: ", accessToken)
  if (accessToken) {
    setAccessToken(accessToken)
    await warmMe()
  }
  return { accessToken }
}

export async function logout(): Promise<{ ok: boolean }> {
  const res = await axios.post("/api/auth/logout")
  setAccessToken(null)
  return res.data as { ok: boolean }
}

export async function fetchAuth(): Promise<{
  id: number
  email: string
  roles: string[]
  permissions: string[]
}> {
  const res = await axios.get("/api/auth/access")
  console.log("fetch access: ", res.data)
  return res.data as {
    id: number
    email: string
    roles: string[]
    permissions: string[]
  }
}
