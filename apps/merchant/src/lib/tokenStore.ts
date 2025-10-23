type Listener = () => void

export function getAccessToken() {
  return null
}

export function setAccessToken(_t: string | null) {
  // no-op
}

let listeners: Listener[] = []
export function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((x) => x !== fn)
  }
}
