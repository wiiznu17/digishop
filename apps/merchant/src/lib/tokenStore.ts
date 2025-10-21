let token: string | null = null

// use BraodcastChannel to sync token across tabs
const ch =
  typeof window !== "undefined"
    ? new BroadcastChannel("merchant_access_token")
    : null

type Listener = () => void
let listeners: Listener[] = []

export function getAccessToken() {
  return token
}

export function setAccessToken(t: string | null) {
  token = t ?? null
  // warn listeners
  listeners.forEach((fn) => fn())
  // broadcast for other tabs
  if (ch) ch.postMessage({ type: "access_changed", token })
}

export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((x) => x !== fn)
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
