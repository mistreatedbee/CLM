import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin | Christian Leadership Movement',
  description: 'Manage applications, members, and reports for the Christian Leadership Movement.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name ?? user.email ?? 'Admin'
  const role = profile?.role ?? 'admin'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <AdminShell userFullName={fullName} userInitials={initials} userRole={role}>
      {children}
    </AdminShell>
  )
}
