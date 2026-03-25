import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, LogOut, Settings, MessageCircle } from 'lucide-react'
import NextLink from 'next/link'

export default async function DashboardLayout({
  children,
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--primary)', padding: 8, borderRadius: 8 }}>
            <Building2 color="white" size={20} />
          </div>
          <NextLink href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
            <strong style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>FinAscend</strong>
          </NextLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <NextLink href="/dashboard/chat" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 500 }}>
            <MessageCircle size={16} /> Assistant
          </NextLink>
          <NextLink href="/dashboard/personalization" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 500 }}>
            <Settings size={16} /> Personalization
          </NextLink>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {profile.name} <span style={{opacity: 0.5}}>|</span> <span style={{textTransform: 'capitalize'}}>{profile.business_type}</span>
          </span>
          <NextLink
            href="/ocr"
            style={{
              color: 'var(--text-muted)',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'white',
            }}
          >
            OCR
          </NextLink>
          <form action="/auth/signout" method="post">
            <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <LogOut size={16} /> Exit
            </button>
          </form>
        </div>
      </nav>
      <main style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
