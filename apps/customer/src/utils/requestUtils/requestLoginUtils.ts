import axios from "@/lib/axios"
import { setAccessToken } from "@/lib/tokenStore"
import { FormLogin } from "@/types/props/userProp"
export async function fetchUser(): Promise<FormLogin | null> {
  try {
    const res = await axios.get(`/api/auth/me`, { withCredentials: true })
    return res.data.user
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<FormLogin| null> {
  try {
    const res = await axios.post(
      `/api/auth/login`,
      { email, password },
      { withCredentials: true }
    )
    const {accessToken ,user } = res.data
    if(accessToken) setAccessToken(accessToken)
    return user
  } catch (error) {
    console.error("Login error:", error)
    return null
  }
}


export async function logoutUser(): Promise<void> {
  try {
    await axios.post(`/api/auth/logout`, null, { withCredentials: true })
  } catch (error) {
    console.error("Logout error:", error)
  }
}

