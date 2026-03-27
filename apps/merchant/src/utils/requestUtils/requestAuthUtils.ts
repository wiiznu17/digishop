import axios from '@/lib/axios'
import { RegisterData, StoreStatus, UserAuth } from '@/types/props/userProp'

export const createMerchant = async (data: RegisterData) => {
  return await new Promise((resolve, reject) => {
    axios
      .post('/api/merchant/register', data)
      .then((res) => resolve(res.data))
      .catch((err) => reject(err))
  })
}

export async function fetchUser(): Promise<UserAuth | null> {
  try {
    const res = await axios.get('/api/auth/me')
    console.log('fetchUser response:', res)
    return (res.data ?? null) as UserAuth | null
  } catch {
    return null
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserAuth | null> {
  try {
    const res = await axios.post('/api/auth/login', { email, password })
    // คุกกี้ถูกตั้งโดย server แล้ว
    return (res.data?.user ?? null) as UserAuth | null
  } catch {
    return null
  }
}

export async function logoutUser() {
  try {
    await axios.post('/api/auth/logout')
  } finally {
    // ไม่มีอะไรต้องเคลียร์ฝั่ง FE (คุกกี้ล้างโดย server)
  }
}

export async function fetchStoreStatus(): Promise<StoreStatus | null> {
  try {
    const res = await axios.get('/api/merchant/store/status')
    return (res.data?.status ?? null) as StoreStatus | null
  } catch {
    return null
  }
}
