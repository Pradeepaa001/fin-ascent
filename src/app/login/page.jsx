'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, BarChart3, AlertCircle } from 'lucide-react'
import styles from './login.module.css'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avgInflow, setAvgInflow] = useState('')
  const [avgOutflow, setAvgOutflow] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              signup_avg_inflow: avgInflow || null,
              signup_avg_outflow: avgOutflow || null,
            }
          }
        })

        if (error) throw error

        if (data.session) {
          // Logged in immediately, go to onboarding
          router.push('/onboarding')
        } else {
          setError("Signup successful! Please check your email to verify your account.")
        }
      } else {
        // Login Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Check onboarding status
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed, business_type')
            .eq('user_id', user.id)
            .single()

          if (profile?.onboarding_completed && profile.business_type) {
            router.push(`/dashboard`)
          } else {
            router.push('/onboarding')
          }
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`card ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <BarChart3 color="white" size={28} />
          </div>
          <h1 className={styles.title}>{isSignUp ? 'Create your account' : 'Sign in to FinAscend'}</h1>
          <p className={styles.subtitle}>
            {isSignUp ? 'Start making brilliant financial decisions' : 'Welcome back! Please enter your details.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} style={{marginRight: 8, flexShrink: 0}} />
              <span>{error}</span>
            </div>
          )}
          
          {isSignUp && (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="name">Full Name</label>
              <input 
                id="name"
                type="text" 
                className="input-field" 
                placeholder="Jane Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className="input-field" 
              placeholder="you@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
              <input 
                id="confirmPassword"
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          {isSignUp && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="avgIn">
                  Typical cash inflow (per month, $)
                </label>
                <input
                  id="avgIn"
                  type="number"
                  min={0}
                  step={100}
                  className="input-field"
                  placeholder="e.g. 25000"
                  value={avgInflow}
                  onChange={(e) => setAvgInflow(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="avgOut">
                  Typical cash outflow (per month, $)
                </label>
                <input
                  id="avgOut"
                  type="number"
                  min={0}
                  step={100}
                  className="input-field"
                  placeholder="e.g. 20000"
                  value={avgOutflow}
                  onChange={(e) => setAvgOutflow(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <button type="submit" className="primary-button" disabled={loading} style={{marginTop: 8}}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
          </button>
        </form>

        <div className={styles.toggleAuth}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button" 
            className={styles.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setAvgInflow('')
              setAvgOutflow('')
            }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}
