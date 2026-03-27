import axios from '@/lib/axios'
import { FormLogin } from '@/types/props/userProp'
export async function fetchUser(): Promise<FormLogin | null> {
  try {
    const res = await axios.get(`/api/auth/me`)
    console.log('fetchUser response:', res)
    return res.data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function fetchAuth(): Promise<{
  id: number
  email: string
  roles: string[]
  permissions: string[]
}> {
  const res = await axios.get('/api/auth/access')
  console.log('fetch access: ', res.data)
  return res.data as {
    id: number
    email: string
    roles: string[]
    permissions: string[]
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<FormLogin | null> {
  try {
    const res = await axios.post(
      `/api/auth/login`,
      { email, password },
      { withCredentials: true }
    )
    // const {accessToken ,user } = res.data
    // if(accessToken) setAccessToken(accessToken)
    return (res.data?.user ?? null) as FormLogin | null
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export async function logoutUser(): Promise<{ ok: boolean }> {
  const res = await axios.post('/api/auth/logout')
  return res.data as { ok: boolean }
}
