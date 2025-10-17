let accessToken: string | null = null
const listeners = new Set<() => void>()
const bc: BroadcastChannel | null =
  typeof window !== "undefined" ? new BroadcastChannel("auth") : null

// เพิ่ม: โหลด token จาก localStorage ตอน init
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken")
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token

  // เพิ่ม: sync กับ localStorage
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("accessToken", token)
    } else {
      localStorage.removeItem("accessToken")
    }
  }

  listeners.forEach((l) => l())
  bc?.postMessage({ type: "accessToken", token })
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (bc) {
  bc.onmessage = (e: MessageEvent) => {
    const data = e.data as { type?: string; token?: string | null }
    if (data?.type === "accessToken") {
      accessToken = data.token ?? null

      // เพิ่ม: sync กับ localStorage
      if (typeof window !== "undefined") {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken)
        } else {
          localStorage.removeItem("accessToken")
        }
      }

      listeners.forEach((l) => l())
    }
  }
}
