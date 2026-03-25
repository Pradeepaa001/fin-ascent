import { formatCurrency } from './format'

export default function GanttTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={styles.container}>
        <h3 style={styles.header}>Payables Timeline</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>No data yet.</p>
      </div>
    )
  }

  return (
    <div className="card" style={styles.container}>
      <h3 style={styles.header}>Payables Timeline</h3>
      {data.map((item, i) => (
        <div key={`${item.entity}-${i}`} style={styles.row}>
          <div style={styles.entity}>{item.entity}</div>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.bar,
                background:
                  item.color === 'red' ? '#ef4444' : 'rgba(34, 197, 94, 1)',
              }}
            />
          </div>
          <div style={styles.due}>
            {item.due_date}
            <div style={styles.amount}>{formatCurrency(item.amount)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: {
    padding: 20,
  },
  header: {
    margin: 0,
    fontSize: 16,
    color: 'var(--foreground)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  entity: {
    width: 160,
    fontWeight: 700,
    color: 'var(--foreground)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  barContainer: {
    flex: 1,
    background: 'rgba(99, 91, 255, 0.08)',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
    width: '60%',
  },
  due: {
    width: 120,
    textAlign: 'right',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: 13,
  },
  amount: {
    fontWeight: 800,
    color: 'var(--foreground)',
    marginTop: 3,
  },
}

