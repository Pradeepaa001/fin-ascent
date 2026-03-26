/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy FastAPI from the Next dev server so the browser only talks to :3000.
   * Avoids pending fetches when localhost:8000 is not reachable from the browser
   * (common with WSL2 / cross-host setups). Start uvicorn on 127.0.0.1:8000 in WSL.
   */
  async rewrites() {
    const backend = process.env.BACKEND_PROXY_URL || 'http://127.0.0.1:8000'
    const b = backend.replace(/\/$/, '')
    return [
      { source: '/api/dashboard/:path*', destination: `${b}/api/dashboard/:path*` },
      { source: '/api/chat/:path*', destination: `${b}/api/chat/:path*` },
      { source: '/api/personalization/:path*', destination: `${b}/api/personalization/:path*` },
      { source: '/api/decision/:path*', destination: `${b}/api/decision/:path*` },
    ]
  },
}

export default nextConfig
