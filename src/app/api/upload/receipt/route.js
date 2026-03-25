import { NextResponse } from 'next/server'

const backendBase =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://127.0.0.1:8000'

export async function POST(request) {
  try {
    let formData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ detail: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ detail: 'Missing file' }, { status: 400 })
    }

    const forward = new FormData()
    const name =
      typeof file === 'object' && 'name' in file && file.name
        ? file.name
        : 'receipt.jpg'
    forward.append('file', file, name)

    let res
    try {
      res = await fetch(`${backendBase.replace(/\/$/, '')}/api/upload/receipt`, {
        method: 'POST',
        body: forward,
      })
    } catch {
      return NextResponse.json(
        {
          detail:
            'Could not reach the OCR API. Start the FastAPI server (e.g. uvicorn on port 8000).',
        },
        { status: 502 }
      )
    }

    const text = await res.text()
    let payload
    try {
      payload = text ? JSON.parse(text) : {}
    } catch {
      payload = { detail: text || 'Unexpected response from OCR API' }
    }

    return NextResponse.json(payload, { status: res.status })
  } catch (err) {
    console.error('[api/upload/receipt]', err)
    return NextResponse.json(
      { detail: err?.message || 'OCR proxy failed' },
      { status: 500 }
    )
  }
}
