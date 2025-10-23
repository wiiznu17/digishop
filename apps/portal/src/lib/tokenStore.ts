type Listener = () => void
export function getAccessToken() {
  return null
}
export function setAccessToken(_t: string | null) {
  /* no-op */
}
export function subscribe(_listener: Listener) {
  return () => {}
}
