export function formatCurrencyTHB(minor?: number) {
  const v = (minor ?? 0) / 100
  return v.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}
