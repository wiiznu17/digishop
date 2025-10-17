// apps/portal/src/lib/tokenStore.ts
type Listener = () => void
type TokenStore = {
  accessToken: string | null
  listeners: Set<Listener>
  bc: BroadcastChannel | null
  initDone: boolean
}
declare global {
  var __tokenStore__: TokenStore
}

const store: TokenStore = globalThis.__tokenStore__ ?? {
  accessToken: null,
  listeners: new Set(),
  bc: null,
  initDone: false
}

function ensureInit() {
  if (store.initDone) return
  if (typeof window === "undefined") return

  try {
    const saved = localStorage.getItem("accessToken")
    if (saved) store.accessToken = saved
  } catch {}

  try {
    store.bc = new BroadcastChannel("auth")
    store.bc.onmessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; token?: string | null }
      if (data?.type !== "accessToken") return
      store.accessToken = data.token ?? null
      try {
        if (store.accessToken)
          localStorage.setItem("accessToken", store.accessToken)
        else localStorage.removeItem("accessToken")
      } catch {}
      store.listeners.forEach((l) => l())
    }
    window.addEventListener("beforeunload", () => {
      try {
        store.bc?.close()
      } catch {}
    })
  } catch {
    store.bc = null
  }

  // fallback sync ระหว่างแท็บ
  window.addEventListener("storage", (ev) => {
    if (ev.key !== "accessToken") return
    store.accessToken = ev.newValue ?? null
    store.listeners.forEach((l) => l())
  })

  store.initDone = true
  globalThis.__tokenStore__ = store
}

export function getAccessToken() {
  ensureInit()
  return store.accessToken
}
export function setAccessToken(token: string | null) {
  ensureInit()
  store.accessToken = token
  try {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("accessToken", token)
      else localStorage.removeItem("accessToken")
    }
  } catch {}
  store.listeners.forEach((l) => l())
  try {
    store.bc?.postMessage({ type: "accessToken", token })
  } catch {}
}
export function subscribe(listener: () => void) {
  ensureInit()
  store.listeners.add(listener)
  return () => store.listeners.delete(listener)
}
