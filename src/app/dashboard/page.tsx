import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRoot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('business_type')
    .eq('user_id', user.id)
    .single()

  if (profile?.business_type) {
    redirect(`/dashboard/${profile.business_type}`)
  } else {
    redirect('/onboarding')
  }
}
