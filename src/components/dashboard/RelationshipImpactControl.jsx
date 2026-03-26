'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_RELATION } from '@/lib/priorityEngine'

/**
 * Relation is not stored in the DB — only overrides default 0.1 in browser (localStorage via parent).
 */
export default function RelationshipImpactControl({
  obligationId,
  relation,
  onSave,
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(String(relation ?? DEFAULT_RELATION))

  useEffect(() => {
    setValue(String(relation ?? DEFAULT_RELATION))
  }, [relation, obligationId])

  function commit() {
    const n = parseFloat(value)
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      return
    }
    onSave?.(n)
    setOpen(false)
  }

  if (!obligationId) {
    return (
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        className="secondary-button"
        style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
        onClick={() => {
          setOpen(true)
          setValue(String(relation ?? DEFAULT_RELATION))
        }}
      >
        Adjust relation
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'rgba(99, 91, 255, 0.06)',
      }}
    >
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
        Relation
        <input
          className="input-field"
          type="number"
          step="0.0001"
          min={0}
          max={10}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ marginTop: 4, maxWidth: 120, fontSize: 13 }}
        />
      </label>
      <button
        type="button"
        className="primary-button"
        style={{ width: 'auto', padding: '8px 12px', fontSize: 12, marginTop: 18 }}
        onClick={commit}
      >
        Apply
      </button>
      <button
        type="button"
        className="secondary-button"
        style={{ width: 'auto', padding: '8px 12px', fontSize: 12, marginTop: 18 }}
        onClick={() => setOpen(false)}
      >
        Cancel
      </button>
    </div>
  )
}
