let token: string | null = null

// sync access token across tabs
const ch =
  typeof window !== "undefined"
    ? new BroadcastChannel("merchant_access_token")
    : null

// === NEW: track refresh state ===
let refreshing = false
const chRefresh =
  typeof window !== "undefined"
    ? new BroadcastChannel("merchant_refresh_state")
    : null

type Listener = () => void
let listeners: Listener[] = []
let refreshListeners: Listener[] = []

export function getAccessToken() {
  return token
}
export function isRefreshing() {
  return refreshing
}

export function setAccessToken(t: string | null) {
  token = t ?? null
  listeners.forEach((fn) => fn())
  if (ch) ch.postMessage({ type: "access_changed", token })
}

// NEW
export function setRefreshing(v: boolean) {
  refreshing = v
  refreshListeners.forEach((fn) => fn())
  if (chRefresh) chRefresh.postMessage({ type: "refresh_state", refreshing: v })
}

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((x) => x !== fn)
  }
}
export function subscribeRefresh(fn: Listener) {
  refreshListeners.push(fn)
  return () => {
    refreshListeners = refreshListeners.filter((x) => x !== fn)
  }
}

if (ch) {
  ch.onmessage = (e) => {
    if (e?.data?.type === "access_changed") {
      token = e.data.token ?? null
      listeners.forEach((fn) => fn())
    }
  }
}
if (chRefresh) {
  chRefresh.onmessage = (e) => {
    if (e?.data?.type === "refresh_state") {
      refreshing = !!e.data.refreshing
      refreshListeners.forEach((fn) => fn())
    }
  }
}
