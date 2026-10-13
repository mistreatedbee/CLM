import { createClient } from '@/lib/supabase/server'

export const ADMIN_ROLES = ['admin', 'reviewer'] as const

/**
 * The signed-in user if they are an admin or reviewer, otherwise null.
 * Server actions that use the service-role client MUST call this first,
 * because the service role bypasses row-level security.
 */
export async function getAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()
  if (!profile || !(ADMIN_ROLES as readonly string[]).includes(profile.role)) return null
  return { user, fullName: profile.full_name ?? user.email ?? 'Admin', role: profile.role as (typeof ADMIN_ROLES)[number] }
}
