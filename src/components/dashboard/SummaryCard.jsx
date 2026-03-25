import { formatCurrency } from './format'

export default function SummaryCard({ title, value }) {
  return (
    <div className="card" style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h2 style={styles.value}>{formatCurrency(value)}</h2>
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
}

