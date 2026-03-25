import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OcrClient from './OcrClient'

export default async function OcrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return <OcrClient />
}

