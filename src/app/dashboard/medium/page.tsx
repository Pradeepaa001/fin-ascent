import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'

export default async function MediumDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user?.id).single()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
       <div>
         <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Welcome, {profile?.name}</h1>
         <p style={{ color: 'var(--primary)', fontWeight: 600, background: 'rgba(99,91,255,0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: 16, margin: 0 }}>Medium Business Dashboard</p>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Cash Flow</h3>
               <DollarSign size={20} color="var(--primary)" />
             </div>
             <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>$245,000</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Receivables</h3>
               <ArrowUpRight size={20} color="var(--accent)" />
             </div>
             <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>$120,400</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Payables</h3>
               <ArrowDownRight size={20} color="#ef4444" />
             </div>
             <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>$85,200</p>
          </div>
       </div>
    </div>
  )
}
