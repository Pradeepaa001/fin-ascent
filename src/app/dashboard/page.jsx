'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SummaryRow from '@/components/dashboard/SummaryRow'
import GanttTimeline from '@/components/dashboard/GanttTimeline'
import PayablesTable from '@/components/dashboard/PayablesTable'
import MonteCarloRisk from '@/components/dashboard/MonteCarloRisk'
import ZeroDayCard from '@/components/dashboard/ZeroDayCard'
import {
  applyTimelineWithRelationOverrides,
  DEFAULT_RELATION,
  loadRelationOverrides,
  saveRelationOverrides,
} from '@/lib/priorityEngine'
import { fetchWithTimeout, getDashboardApiBase } from '@/lib/apiBase'

export default function DashboardRoot() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [summary, setSummary] = useState({})
  const [timeline, setTimeline] = useState([])
  const [table, setTable] = useState([])
  const [zeroDay, setZeroDay] = useState()
  const [runwayBalance, setRunwayBalance] = useState(null)
  const [runwayInflow, setRunwayInflow] = useState(null)
  const [relationOverrides, setRelationOverrides] = useState({})

  useEffect(() => {
    setRelationOverrides(loadRelationOverrides())
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        router.push('/login')
        return
      }

      const { data: p, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError
      if (!p || !p.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      setProfile(p)
      setUserId(user.id)

      const apiBase = getDashboardApiBase()

      const [
        creditRes,
        payablesRes,
        receivablesRes,
        balanceRes,
        ganttRes,
        top10Res,
        zeroRes,
      ] = await Promise.all([
        fetchWithTimeout(`${apiBase}/credit-score?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/payables/summary?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/receivables/summary?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/balance?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/payables/timeline?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/payables/top10?user_id=${user.id}`),
        fetchWithTimeout(`${apiBase}/zero-day?user_id=${user.id}`),
      ])

      const [
        credit,
        payables,
        receivables,
        balance,
        gantt,
        top10,
        zeroPayload,
      ] = await Promise.all([
        creditRes.json(),
        payablesRes.json(),
        receivablesRes.json(),
        balanceRes.json(),
        ganttRes.json(),
        top10Res.json(),
        zeroRes.json(),
      ])

      setSummary({
        credit_score: credit?.credit_score ?? 0,
        payables: payables?.total_amount ?? 0,
        receivables: receivables?.total_amount ?? 0,
        balance: balance?.balance ?? 0,
      })

      setTimeline(Array.isArray(gantt) ? gantt : [])
      setTable(Array.isArray(top10) ? top10 : [])
      setZeroDay(
        zeroPayload && typeof zeroPayload.zero_day === 'number'
          ? zeroPayload.zero_day
          : null
      )
      setRunwayBalance(
        zeroPayload?.current_balance != null
          ? Number(zeroPayload.current_balance)
          : zeroPayload?.balance != null
            ? Number(zeroPayload.balance)
            : null
      )
      setRunwayInflow(
        zeroPayload?.avg_cash_inflow != null
          ? Number(zeroPayload.avg_cash_inflow)
          : zeroPayload?.average_inflow != null
            ? Number(zeroPayload.average_inflow)
            : null
      )

      const { data: refreshed } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (refreshed) {
        setProfile(refreshed)
      }
    } catch (e) {
      if (e?.name === 'AbortError') {
        setError(
          'Dashboard API timed out (30s). Start FastAPI: cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'
        )
      } else {
        setError(
          e?.message ||
            'Failed to load dashboard. Start the API on port 8000, or unset NEXT_PUBLIC_API_BASE_URL so Next proxies /api/dashboard to the backend.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleRelationChange = useCallback((obligationId, value) => {
    setRelationOverrides((prev) => {
      const next = { ...prev }
      if (Math.abs(Number(value) - DEFAULT_RELATION) < 1e-9) {
        delete next[obligationId]
      } else {
        next[obligationId] = Number(value)
      }
      saveRelationOverrides(next)
      return next
    })
  }, [])

  const timelineWithRelations = useMemo(
    () => applyTimelineWithRelationOverrides(timeline, relationOverrides),
    [timeline, relationOverrides]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>
          Welcome{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p
          style={{
            color: 'var(--primary)',
            fontWeight: 700,
            background: 'rgba(99,91,255,0.1)',
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: 16,
            margin: 0,
          }}
        >
          <span style={{ textTransform: 'capitalize' }}>
            {profile?.business_type || 'Business'}
          </span>{' '}
          Dashboard
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fee3e2',
            border: '1px solid #fecdd2',
            color: '#b91c1c',
            padding: 12,
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 20 }}>
          Loading dashboard…
        </div>
      ) : (
        <>
          <SummaryRow data={summary} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            <ZeroDayCard
              runwayDays={zeroDay}
              balance={runwayBalance}
              averageInflow={runwayInflow}
            />
          </div>
          <GanttTimeline data={timelineWithRelations} />
          <PayablesTable
            data={table}
            relationOverrides={relationOverrides}
            onRelationChange={handleRelationChange}
          />
          <MonteCarloRisk userId={userId} />
        </>
      )}
    </div>
  )
}
