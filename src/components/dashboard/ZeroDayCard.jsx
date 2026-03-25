'use client'

export default function ZeroDayCard({ runwayDays, balance, averageInflow }) {
  const n =
    typeof runwayDays === 'number' && Number.isFinite(runwayDays) ? runwayDays : null

  let tone = 'var(--text-muted)'
  let label = 'Runway (current balance ÷ avg cash inflow)'
  if (n != null) {
    if (n < 7) {
      tone = '#b91c1c'
      label = 'Critical runway'
    } else if (n < 30) {
      tone = '#a16207'
      label = 'Tight runway'
    } else {
      tone = '#166534'
      label = 'Runway headroom'
    }
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 900, color: tone }}>
        {n != null ? `${n.toFixed(1)} days` : '—'}
      </p>
      <p style={{ margin: '10px 0 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
        Current balance ÷ avg cash inflow (missing inflow defaults to $50,000).{' '}
        {balance != null && averageInflow != null && (
          <>
            {' '}
            (
            <strong>{formatMoney(balance)}</strong> ÷{' '}
            <strong>{formatMoney(averageInflow)}</strong>
            ).
          </>
        )}
      </p>
    </div>
  )
}

function formatMoney(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}
