// let token: string | null = null

// use BraodcastChannel to sync token across tabs
// const ch =
//   typeof window !== "undefined"
//     ? new BroadcastChannel("merchant_access_token")
//     : null

// type Listener = () => void
// let listeners: Listener[] = []

// export function getAccessToken() {
//   return null
// }

// export function setAccessToken(t: string | null) {
//   token = t ?? null
//   listeners.forEach((fn) => fn())
//   if (ch) ch.postMessage({ type: "access_changed", token })
// }

// export function subscribe(_listener: Listener) {
//   return () => {}

// }

// if (ch) {
//   ch.onmessage = (e) => {
//     if (e?.data?.type === "access_changed") {
//       token = e.data.token ?? null
//       listeners.forEach((fn) => fn())
//     }
//   }
// }
