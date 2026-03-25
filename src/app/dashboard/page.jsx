import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from 'lucide-react'

export default async function DashboardRoot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Format the liquidity for display
  const liquidityValue = profile?.current_balance || 0;
  const liquidityFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(liquidityValue)

  // Use base liquidity to generate some relative mock data so it looks realistic and dynamic
  const cashFlow = liquidityValue * 0.8;
  const receivables = liquidityValue * 0.4;
  const payables = liquidityValue * 0.3;

  const currencyFormat = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Welcome, {profile?.name}</h1>
        <p style={{ color: 'var(--primary)', fontWeight: 600, background: 'rgba(99,91,255,0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: 16, margin: 0 }}>
          <span style={{ textTransform: 'capitalize' }}>{profile?.business_type || 'Business'}</span> Dashboard
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {/* New Current Liquidity Card */}
        <div className="card" style={{ padding: 24, border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1rem', fontWeight: 700 }}>Current Liquidity</h3>
            <Wallet size={20} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>{liquidityFormat}</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Cash Flow</h3>
            <DollarSign size={20} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{currencyFormat(cashFlow)}</p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Receivables</h3>
            <ArrowUpRight size={20} color="var(--accent)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{currencyFormat(receivables)}</p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Payables</h3>
            <ArrowDownRight size={20} color="#ef4444" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{currencyFormat(payables)}</p>
        </div>
      </div>
    </div>
  )
}
