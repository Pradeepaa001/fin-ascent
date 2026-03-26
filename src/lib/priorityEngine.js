/**
 * Must match backend/app/api/dashboard.py PRIORITY_WEIGHTS.
 * Urgency has the most influence; relation the least.
 */
export const PRIORITY_WEIGHTS = {
  urgency: 1.0,
  penalty: 0.45,
  relation: 0.12,
}

export const DEFAULT_RELATION = 0.1

/** Above this weighted priority, timeline dots show “high” (red). */
export const PRIORITY_RED_THRESHOLD = 22

const STORAGE_KEY = 'finascent_relation_overrides_v1'

export function computePriority(urgency, penalty, relation) {
  const u = Number(urgency) || 0
  const p = Number(penalty) || 0
  const r = Number(relation)
  const rel = Number.isFinite(r) ? r : DEFAULT_RELATION
  return (
    PRIORITY_WEIGHTS.urgency * u +
    PRIORITY_WEIGHTS.penalty * p +
    PRIORITY_WEIGHTS.relation * rel
  )
}

export function loadRelationOverrides() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveRelationOverrides(map) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function effectiveRelation(obligationId, overrides) {
  if (!obligationId) return DEFAULT_RELATION
  const v = overrides[obligationId]
  return v !== undefined && v !== null && Number.isFinite(Number(v))
    ? Number(v)
    : DEFAULT_RELATION
}

/** Recompute priority + color for timeline rows when relation overrides change. */
export function applyTimelineWithRelationOverrides(timeline, overrides) {
  if (!Array.isArray(timeline)) return []
  return timeline.map((row) => {
    const oid = row.obligation_id
    const rel = effectiveRelation(oid, overrides)
    const priority = computePriority(row.urgency, row.penalty, rel)
    return {
      ...row,
      priority,
      relation: rel,
      color: priority >= PRIORITY_RED_THRESHOLD ? 'red' : 'green',
    }
  })
}
