import { formatCurrency } from './format'

function creditStyle(score) {
  const s = Number(score)
  if (!Number.isFinite(s)) {
    return {
      background: 'linear-gradient(135deg, rgba(99, 91, 255, 0.12), rgba(0, 212, 255, 0.08))',
      border: '1px solid var(--border)',
      valueColor: 'var(--primary)',
      warn: null,
    }
  }
  if (s < 40) {
    return {
      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.18), rgba(251, 113, 133, 0.12))',
      border: '1px solid rgba(220, 38, 38, 0.35)',
      valueColor: '#991b1b',
      warn: 'Credit health is low — review payables timing and liquidity.',
    }
  }
  if (s < 70) {
    return {
      background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(250, 204, 21, 0.12))',
      border: '1px solid rgba(234, 179, 8, 0.4)',
      valueColor: '#854d0e',
      warn: 'Credit health is moderate — watch runway and collections.',
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(34, 197, 94, 0.1))',
    border: '1px solid rgba(22, 163, 74, 0.35)',
    valueColor: '#166534',
    warn: null,
  }
}

export default function SummaryCard({ title, value, variant = 'currency' }) {
  const cs = variant === 'score' ? creditStyle(value) : null

  return (
    <div
      className="card"
      style={{
        ...styles.card,
        ...(cs
          ? {
              background: cs.background,
              border: cs.border,
              boxShadow: 'var(--shadow-md)',
            }
          : {}),
      }}
    >
      <p style={styles.title}>{title}</p>
      {variant === 'score' ? (
        <>
          <h2 style={{ ...styles.value, color: cs.valueColor }}>{value ?? '—'}</h2>
          {cs.warn && (
            <p style={styles.warn}>{cs.warn}</p>
          )}
        </>
      ) : (
        <h2 style={styles.value}>{formatCurrency(value)}</h2>
      )}
    </div>
  )
}

const styles = {
  card: {
    padding: 20,
  },
  title: {
    color: '#666',
    fontSize: 14,
    margin: 0,
  },
  value: {
    fontSize: 24,
    fontWeight: 800,
    color: 'var(--primary)',
    margin: '8px 0 0 0',
  },
  warn: {
    margin: '10px 0 0 0',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--foreground)',
    lineHeight: 1.4,
  },
}

