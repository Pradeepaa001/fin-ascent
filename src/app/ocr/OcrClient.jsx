'use client'

import { useRef, useState } from 'react'

const UPLOAD_PATH = '/api/upload/receipt'

export default function OcrClient() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  function resolveSelectedFile() {
    return file ?? fileInputRef.current?.files?.[0] ?? null
  }

  async function handleUpload() {
    const selected = resolveSelectedFile()
    if (!selected) {
      setError('Please select an image file first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selected)

      const res = await fetch(UPLOAD_PATH, {
        method: 'POST',
        body: formData,
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg =
          payload?.detail ||
          payload?.message ||
          `Upload failed (${res.status}).`
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      setResult(payload?.data ?? payload)
    } catch (e) {
      if (e?.name === 'TypeError' && e?.message === 'Failed to fetch') {
        setError(
          'Network error. Check your connection and that the dev server is running.'
        )
      } else {
        setError(e?.message || 'OCR upload failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="card"
        style={{
          padding: 24,
          maxWidth: 820,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.6rem' }}>OCR Receipt</h1>
        <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)' }}>
          Upload an image of a receipt to extract the handwritten transcript.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Receipt image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setFile(f)
              }}
              style={{ display: 'block', marginTop: 8 }}
            />
          </label>

          <button
            className="primary-button"
            disabled={loading}
            onClick={handleUpload}
          >
            {loading ? 'Processing…' : 'Run OCR'}
          </button>

          {error && (
            <div
              style={{
                background: '#fee3e2',
                border: '1px solid #fecdd2',
                color: '#b91c1c',
                padding: 12,
                borderRadius: 10,
              }}
            >
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 10 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Result</h2>
              <pre
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  padding: 12,
                  borderRadius: 12,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
