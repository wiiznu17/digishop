import { useEffect, useRef, useState } from 'react'

export default function useAnimatedNumber(
  value: number,
  duration = 420
): number {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(from + (to - from) * eased)
      setDisplay(v)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return display
}
