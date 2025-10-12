import axios from "@/lib/axios"

export async function acceptInvite(payload: {
  token: string
  password: string
  name?: string
}) {
  await axios.post("/api/auth/invite/accept", payload, {
    withCredentials: true
  })
}

export async function confirmReset(payload: {
  token: string
  password: string
}) {
  await axios.post("/api/auth/password/reset/confirm", payload, {
    withCredentials: true
  })
}
