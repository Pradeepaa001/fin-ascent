'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatCurrency } from './format'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

function pct(n) {
  return `${(n * 100).toFixed(1)}%`
}

function riskVerdict(pDefault) {
  const p = pDefault ?? 0
  if (p < 0.05) {
    return {
      label: 'Looks stable',
      tone: '#166534',
      bg: 'rgba(22, 101, 52, 0.08)',
      plain:
        'In most simulated scenarios you still have cash left after paying bills. That is reassuring, but it is not a guarantee—real surprises can still happen.',
    }
  }
  if (p < 0.2) {
    return {
      label: 'Worth watching',
      tone: '#a16207',
      bg: 'rgba(161, 98, 7, 0.1)',
      plain:
        'A noticeable share of scenarios end in the red. You may want a small buffer, earlier collections, or to trim near-term payables.',
    }
  }
  return {
    label: 'Higher stress',
    tone: '#b91c1c',
    bg: 'rgba(185, 28, 28, 0.08)',
    plain:
      'Many scenarios show you running out of cash. Treat this as a signal to review timing of money in vs. money out, not as a personal judgment.',
  }
}

function defaultInPlainEnglish(pDefault, nSim) {
  const n = nSim ?? 8000
  const approx = Math.round((pDefault ?? 0) * 100)
  if (pDefault <= 0) {
    return 'None of the simulated futures left you below zero in this model. Reality can still differ.'
  }
  return `Roughly ${approx} out of every 100 simulated futures (${n.toLocaleString()} total) ended with less than $0 cash after this period’s inflow and expenses.`
}

const DEFAULT_INFLOW_CV = 0.15
const DEFAULT_EXPENSE_CV = 0.15

export default function MonteCarloRisk({ userId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/dashboard/risk/monte-carlo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            inflow_variability: DEFAULT_INFLOW_CV,
            expense_variability: DEFAULT_EXPENSE_CV,
            n_simulations: 8000,
          }),
        }
      )
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        const d = payload?.detail
        const msg =
          typeof d === 'string'
            ? d
            : Array.isArray(d)
              ? d.map((x) => x?.msg || x).join('; ')
              : `Request failed (${res.status})`
        throw new Error(msg)
      }
      setData(payload)
    } catch (e) {
      setError(e?.message || 'Monte Carlo request failed.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined
    const t = setTimeout(() => {
      run()
    }, 400)
    return () => clearTimeout(t)
  }, [userId, run])

  if (!userId) {
    return null
  }

  function VerdictPanel() {
    if (!data) return null
    const verdict = riskVerdict(data.probability_of_default)
    return (
      <div
        style={{
          ...styles.verdict,
          borderColor: verdict.tone,
          background: verdict.bg,
        }}
      >
        <div style={{ ...styles.verdictLabel, color: verdict.tone }}>
          {verdict.label}
        </div>
        <p style={styles.verdictPlain}>{verdict.plain}</p>
        <p style={styles.verdictPlain}>
          {defaultInPlainEnglish(
            data.probability_of_default,
            data.n_simulations
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={styles.card}>
      <h3 style={styles.title}>Liquidity risk — Monte Carlo</h3>
      <p style={styles.lead}>
        This tool runs many “what if” futures using your dashboard numbers. It
        does not predict the future—it shows how fragile your cash position could
        be if income and bills bounce around.
      </p>

      <details style={styles.details}>
        <summary style={styles.summary}>How to read this (simple)</summary>
        <ul style={styles.bullets}>
          <li>
            <strong>Inflow / expense variability</strong> — the model uses a
            fixed moderate “wobble” around your profile average inflows and
            outflows (same scale as before the sliders were removed).
          </li>
          <li>
            <strong>Probability of default</strong> — here it means the share of
            simulated scenarios where cash ends below zero after this single
            step—not a bank “default” score.
          </li>
          <li>
            <strong>Best / worst cash inflow</strong> — optimistic vs. harsh
            income draws from the simulation (about the top 5% and bottom 5% of
            income outcomes), not a promise or threat.
          </li>
          <li>
            <strong>The bar chart</strong> — taller bars mean more scenarios
            finished with cash in that range (left = tighter, right = more
            comfortable).
          </li>
        </ul>
      </details>

      <p style={styles.fixedCv}>
        Variability for this run is fixed at{' '}
        <strong>{(DEFAULT_INFLOW_CV * 100).toFixed(0)}%</strong> inflow CV and{' '}
        <strong>{(DEFAULT_EXPENSE_CV * 100).toFixed(0)}%</strong> expense CV,
        based on your dashboard baselines.
      </p>

      {error && (
        <div style={styles.errBox}>{error}</div>
      )}

      {loading && !data && !error && (
        <p style={{ margin: '12px 0 0', color: 'var(--text-muted)' }}>
          Running simulations…
        </p>
      )}

      {data && (
        <>
          <VerdictPanel />

          <div style={styles.metrics}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Probability of default</span>
              <strong style={styles.metricValueDanger}>
                {pct(data.probability_of_default ?? 0)}
              </strong>
              <span style={styles.metricHint}>
                Technical: share of paths where ending cash &lt; 0 (balance +
                shocked inflow − shocked expenses).
              </span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Best-case cash inflow</span>
              <strong style={styles.metricValue}>
                {formatCurrency(data.best_case_cash_inflow ?? 0)}
              </strong>
              <span style={styles.metricHint}>
                Strong income draw (~95th percentile)—a rosy leg of the model, not
                a forecast.
              </span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Worst-case cash inflow</span>
              <strong style={styles.metricValue}>
                {formatCurrency(data.worst_case_cash_inflow ?? 0)}
              </strong>
              <span style={styles.metricHint}>
                Weak income draw (~5th percentile)—a stress leg, not a prophecy.
              </span>
            </div>
          </div>

          <p style={styles.baselineNote}>
            What we held fixed for this run: starting cash{' '}
            <strong>{formatCurrency(data.starting_balance ?? 0)}</strong> ·
            typical money in <strong>
              {formatCurrency(data.mean_inflow_baseline ?? 0)}
            </strong>{' '}
            · typical bills{' '}
            <strong>{formatCurrency(data.mean_expense_baseline ?? 0)}</strong> ·{' '}
            {data.n_simulations?.toLocaleString?.() ?? data.n_simulations}{' '}
            random futures.
          </p>

          {Array.isArray(data.distribution) && data.distribution.length > 0 && (
            <div style={styles.vizWrap}>
              <div style={styles.vizTitle}>Ending liquidity distribution</div>
              <p style={styles.vizExplain}>
                Each bar is a bucket of “how much cash is left.” More height =
                more simulated futures landed there.
              </p>
              <div style={styles.bars} aria-hidden>
                {data.distribution.map((bin, i) => (
                  <div
                    key={`b-${i}-${bin.start}`}
                    title={`${formatCurrency(bin.start)} – ${formatCurrency(bin.end)}: ${bin.frequency}`}
                    style={{
                      ...styles.bar,
                      height: `${Math.max(8, (bin.relative_height ?? 0) * 120)}px`,
                      opacity: 0.75 + (bin.relative_height ?? 0) * 0.25,
                    }}
                  />
                ))}
              </div>
              <div style={styles.vizAxis}>
                <span>Lower outcomes ←</span>
                <span>→ Higher outcomes</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  card: {
    padding: 20,
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: 'var(--foreground)',
  },
  lead: {
    margin: '8px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.45,
  },
  details: {
    marginTop: 14,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'rgba(99, 91, 255, 0.04)',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--foreground)',
    userSelect: 'none',
  },
  bullets: {
    margin: '12px 0 0 0',
    paddingLeft: 20,
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  verdict: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    border: '2px solid',
  },
  verdictLabel: {
    fontSize: 13,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  verdictPlain: {
    margin: '8px 0 0 0',
    fontSize: 14,
    color: 'var(--foreground)',
    lineHeight: 1.5,
  },
  fixedCv: {
    marginTop: 16,
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.45,
  },
  errBox: {
    marginTop: 12,
    background: '#fee3e2',
    border: '1px solid #fecdd2',
    color: '#b91c1c',
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginTop: 20,
  },
  metric: {
    background: 'rgba(99, 91, 255, 0.06)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  metricValue: {
    fontSize: 20,
    color: 'var(--foreground)',
  },
  metricValueDanger: {
    fontSize: 20,
    color: '#b91c1c',
  },
  metricHint: {
    fontSize: 11,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
  },
  baselineNote: {
    margin: '16px 0 0',
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  vizWrap: {
    marginTop: 20,
  },
  vizTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--foreground)',
    marginBottom: 6,
  },
  vizExplain: {
    margin: '0 0 10px 0',
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  bars: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
    height: 128,
    padding: '8px 4px',
    background: 'rgba(99, 91, 255, 0.05)',
    borderRadius: 10,
    border: '1px solid var(--border)',
  },
  bar: {
    flex: 1,
    minWidth: 4,
    background: 'linear-gradient(180deg, var(--primary), rgba(99, 91, 255, 0.45))',
    borderRadius: 4,
    transition: 'height 0.2s ease',
  },
  vizAxis: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 8,
    fontSize: 11,
    color: 'var(--text-muted)',
  },
}
