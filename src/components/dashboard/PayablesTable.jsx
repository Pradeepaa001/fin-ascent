import { formatCurrency } from './format'

export default function PayablesTable({ data }) {
  return (
    <div className="card" style={styles.container}>
      <h3 style={styles.header}>Top Payables</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Due Date</th>
            <th style={styles.th}>Company</th>
            <th style={styles.th}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row, i) => (
            <tr key={`${row.company}-${i}`}>
              <td style={styles.td}>{row.due_date}</td>
              <td style={styles.td}>{row.company}</td>
              <td style={{ ...styles.td, color: '#ef4444', fontWeight: 800 }}>
                {formatCurrency(row.amount)}
              </td>
            </tr>
          ))}
          {(data || []).length === 0 && (
            <tr>
              <td style={styles.empty} colSpan={3}>
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    color: 'var(--text-muted)',
    fontSize: 13,
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(227, 232, 238, 0.8)',
    color: 'var(--foreground)',
    fontWeight: 600,
    fontSize: 14,
  },
  empty: {
    padding: 16,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
}

