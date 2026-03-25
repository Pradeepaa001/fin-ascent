'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './onboarding.module.css'
import { Building2, Building, Factory, AlertCircle } from 'lucide-react'

const BUSINESS_TYPES = [
  { id: 'small', name: 'Small Business', desc: '< 50 employees or low turnover', icon: Building },
  { id: 'medium', name: 'Medium Business', desc: '50-250 employees', icon: Building2 },
  { id: 'large', name: 'Large Business', desc: '250+ employees', icon: Factory },
]

export default function OnboardingPage() {
  const [userId, setUserId] = useState(null)
  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState('small')
  const [employees, setEmployees] = useState('')
  const [revenue, setRevenue] = useState('')
  const [industry, setIndustry] = useState('')
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
        setName(user.user_metadata?.full_name || '')
      }
    })
  }, [router, supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.from('user_profiles').insert({
        user_id: userId,
        name: name || 'User',
        business_type: businessType,
        employees: employees ? parseInt(employees) : null,
        revenue_range: revenue,
        industry: industry,
        onboarding_completed: true
      })

      if (error) throw error

      router.push(`/dashboard/${businessType}`)
    } catch (err) {
      setError(err.message || 'Failed to save profile. Make sure you pressed RUN on setup.sql in Supabase!')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) return null

  return (
    <div className={styles.container}>
      <div className={`card ${styles.onboardingCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tell us about your business</h1>
          <p className={styles.subtitle}>We'll use this to personalize your FinAscend dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
           {error && (
            <div style={{background: '#fee3e2', border: '1px solid #fecdd2', padding: 12, borderRadius: 8, color: '#b91c1c', display: 'flex', alignItems: 'center', fontSize: '0.875rem'}}>
              <AlertCircle size={16} style={{marginRight: 8, flexShrink: 0}} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Business Size (Required)</label>
            <div className={styles.typeGrid}>
              {BUSINESS_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <div 
                    key={type.id} 
                    className={`${styles.typeCard} ${businessType === type.id ? styles.selected : ''}`}
                    onClick={() => setBusinessType(type.id)}
                  >
                    <div style={{ marginRight: 16, color: businessType === type.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.typeContent}>
                      <span className={styles.typeName}>{type.name}</span>
                      <span className={styles.typeDesc}>{type.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Industry</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Retail, SaaS, Logistics" 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Est. Revenue / year</label>
              <select 
                className="input-field" 
                value={revenue} 
                onChange={e => setRevenue(e.target.value)}
                style={{ appearance: 'auto' }}
              >
                 <option value="">Select range...</option>
                 <option value="<500k">Under $500k</option>
                 <option value="500k-2M">$500k - $2M</option>
                 <option value="2M-10M">$2M - $10M</option>
                 <option value=">10M">$10M+</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Total Employees</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="25" 
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="primary-button" disabled={loading} style={{marginTop: 8}}>
            {loading ? 'Saving Profile...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  )
}
