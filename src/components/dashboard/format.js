export function formatCurrency(value, currency = 'USD') {
  const num = typeof value === 'number' ? value : Number(value)
  const safe = Number.isFinite(num) ? num : 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(safe)
}

