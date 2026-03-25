 'use client'

 import { useMemo, useState } from 'react'

 const API_BASE_URL =
   process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

 export default function OcrClient() {
   const [file, setFile] = useState(null)
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState(null)
   const [result, setResult] = useState(null)

   const endpoint = useMemo(
     () => `${API_BASE_URL}/api/upload/receipt`,
     []
   )

   async function handleUpload() {
     if (!file) {
       setError('Please select an image file first.')
       return
     }

     setLoading(true)
     setError(null)
     setResult(null)

     try {
       const formData = new FormData()
       formData.append('file', file)

       const res = await fetch(endpoint, {
         method: 'POST',
         body: formData,
       })

       if (!res.ok) {
         const text = await res.text().catch(() => '')
         throw new Error(`Upload failed (${res.status}). ${text}`)
       }

       const payload = await res.json()
       setResult(payload?.data ?? payload)
     } catch (e) {
       setError(e?.message || 'OCR upload failed.')
     } finally {
       setLoading(false)
     }
   }

   return (
     <div className="card" style={{ padding: 24, maxWidth: 820 }}>
       <h1 style={{ margin: '0 0 8px 0', fontSize: '1.6rem' }}>OCR Receipt</h1>
       <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)' }}>
         Upload an image of a receipt to extract the handwritten transcript.
       </p>

       <div style={{ display: 'grid', gap: 12 }}>
         <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
           Receipt image
           <input
             type="file"
             accept="image/*"
             onChange={(e) => setFile(e.target.files?.[0] || null)}
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
   )
 }

