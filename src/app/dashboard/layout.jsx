import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, LogOut } from 'lucide-react'

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
          <strong style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>FinAscend</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {profile.name} <span style={{opacity: 0.5}}>|</span> <span style={{textTransform: 'capitalize'}}>{profile.business_type}</span>
          </span>
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
