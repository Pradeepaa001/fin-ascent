import { useMemo } from 'react'
import { formatCurrency } from './format'
import { PRIORITY_RED_THRESHOLD } from '@/lib/priorityEngine'

function parseDueTime(due) {
  const t = new Date(due).getTime()
  return Number.isNaN(t) ? null : t
}

function dotColor(item) {
  if (
    item.color === 'red' ||
    (item.priority != null && item.priority >= PRIORITY_RED_THRESHOLD)
  ) {
    return '#dc2626'
  }
  return '#16a34a'
}

function buildTimelinePoints(data) {
  const rows = data
    .map((item, index) => ({
      ...item,
      t: parseDueTime(item.due_date),
      index,
    }))
    .filter((row) => row.t != null)

  if (rows.length === 0) {
    return { points: [], minLabel: '', maxLabel: '' }
  }

  const times = rows.map((r) => r.t)
  const minT = Math.min(...times)
  const maxT = Math.max(...times)
  const range = maxT - minT

  const raw = rows.map((row) => {
    let percent
    if (range === 0) {
      percent = 50
    } else {
      percent = ((row.t - minT) / range) * 100
    }
    percent = Math.max(4, Math.min(96, percent))
    return { ...row, percent }
  })

  const bucketCount = {}
  const points = raw.map((p) => {
    const key = Math.round(p.percent * 20) / 20
    const n = bucketCount[key] ?? 0
    bucketCount[key] = n + 1
    return { ...p, stack: n }
  })

  return {
    points,
    minLabel: new Date(minT).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    maxLabel: new Date(maxT).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }
}

export default function GanttTimeline({ data }) {
  const { points, minLabel, maxLabel } = useMemo(
    () => (data?.length ? buildTimelinePoints(data) : { points: [], minLabel: '', maxLabel: '' }),
    [data]
  )

  if (!data || data.length === 0) {
    return (
      <div className="card" style={styles.container}>
        <h3 style={styles.header}>Payables Timeline</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>No data yet.</p>
      </div>
    )
  }

  if (points.length === 0) {
    return (
      <div className="card" style={styles.container}>
        <h3 style={styles.header}>Payables Timeline</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          No valid due dates to show on the timeline.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={styles.container}>
      <h3 style={styles.header}>Payables Timeline</h3>
      <p style={styles.subtitle}>
        Each point is a payable; position = due date.         Weighted priority: 1.0×Urgency + 0.45×Penalty + 0.12×Relation (relation default
        0.1, adjustable per row in the table). Red = higher priority.
      </p>

      <div style={styles.axisRow}>
        <span style={styles.axisLabel}>{minLabel}</span>
        <span style={styles.axisLabel}>{maxLabel}</span>
      </div>

      <div style={styles.track}>
        <div style={styles.line} aria-hidden />
        {points.map((item, i) => {
          const fill = dotColor(item)
          const stackOffset = item.stack * 10
          const title = [
            item.entity,
            formatCurrency(item.amount),
            item.due_date,
            item.priority != null ? `Priority ${item.priority}` : null,
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <div
              key={`${item.entity}-${item.index}-${i}`}
              style={{
                ...styles.pointWrap,
                left: `${item.percent}%`,
                transform: `translateX(-50%) translateY(${stackOffset}px)`,
              }}
              title={title}
            >
              <div
                style={{
                  ...styles.dot,
                  background: fill,
                  boxShadow: `0 0 0 2px var(--surface), 0 0 0 3px ${fill}`,
                }}
              />
            </div>
          )
        })}
      </div>
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
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  axisRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 6,
  },
  axisLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  track: {
    position: 'relative',
    height: 72,
    marginTop: 4,
    marginBottom: 8,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 3,
    marginTop: -1,
    borderRadius: 2,
    background:
      'linear-gradient(90deg, rgba(99, 91, 255, 0.35), rgba(99, 91, 255, 0.15))',
  },
  pointWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    zIndex: 1,
    cursor: 'default',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
}
