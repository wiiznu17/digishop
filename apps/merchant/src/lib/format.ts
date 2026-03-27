export function formatMoneyFromMinor(minor?: number | null, currency = 'THB') {
  const m = typeof minor === 'number' ? minor : 0
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency }).format(
    m / 100
  )
}
