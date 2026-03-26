import { formatCurrency } from './format'
import RelationshipImpactControl from './RelationshipImpactControl'
import {
  computePriority,
  DEFAULT_RELATION,
  effectiveRelation,
  PRIORITY_WEIGHTS,
} from '@/lib/priorityEngine'

function fmtPri(x) {
  if (x == null || Number.isNaN(Number(x))) return '—'
  return Number(x).toFixed(2)
}

export default function PayablesTable({ data, relationOverrides, onRelationChange }) {
  return (
    <div className="card" style={styles.container}>
      <div style={styles.top}>
        <h3 style={styles.header}>Top Payables &amp; priority</h3>
      </div>
      <p style={styles.hint}>
        Priority = {PRIORITY_FORMULA}. Relation defaults to{' '}
        <strong>{DEFAULT_RELATION}</strong>; use <strong>Adjust relation</strong> to
        change it for this row only (saved in this browser, not the database). Priority
        updates immediately.
      </p>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Due Date</th>
            <th style={styles.th}>Company</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Urgency</th>
            <th style={styles.th}>Penalty</th>
            <th style={styles.th}>Relation</th>
            <th style={styles.th}> </th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row, i) => {
            const oid = row.obligation_id
            const rel = effectiveRelation(oid, relationOverrides || {})
            const priority = computePriority(row.urgency, row.penalty, rel)
            return (
              <tr key={`${row.company}-${oid || i}`}>
                <td style={styles.td}>{row.due_date}</td>
                <td style={styles.td}>{row.company}</td>
                <td style={{ ...styles.td, color: '#ef4444', fontWeight: 800 }}>
                  {formatCurrency(row.amount)}
                </td>
                <td style={styles.tdMono}>{fmtPri(priority)}</td>
                <td style={styles.tdNum}>{fmtPri(row.urgency)}</td>
                <td style={styles.tdNum}>{fmtPri(row.penalty)}</td>
                <td style={styles.tdNum}>{fmtPri(rel)}</td>
                <td style={styles.tdAction}>
                  <RelationshipImpactControl
                    obligationId={oid}
                    relation={rel}
                    onSave={(v) => oid && onRelationChange?.(oid, v)}
                  />
                </td>
              </tr>
            )
          })}
          {(data || []).length === 0 && (
            <tr>
              <td style={styles.empty} colSpan={8}>
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const PRIORITY_FORMULA = `${PRIORITY_WEIGHTS.urgency}×Urgency + ${PRIORITY_WEIGHTS.penalty}×Penalty + ${PRIORITY_WEIGHTS.relation}×Relation`

const styles = {
  container: {
    padding: 20,
  },
  top: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 8,
  },
  header: {
    margin: 0,
    fontSize: 16,
    color: 'var(--foreground)',
  },
  hint: {
    margin: '0 0 12px 0',
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.45,
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
  tdMono: {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(227, 232, 238, 0.8)',
    color: 'var(--primary)',
    fontWeight: 800,
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums',
  },
  tdNum: {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(227, 232, 238, 0.8)',
    color: 'var(--foreground)',
    fontWeight: 600,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
  },
  tdAction: {
    padding: '10px 8px',
    borderBottom: '1px solid rgba(227, 232, 238, 0.8)',
    verticalAlign: 'top',
    minWidth: 140,
  },
  empty: {
    padding: 16,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
}
