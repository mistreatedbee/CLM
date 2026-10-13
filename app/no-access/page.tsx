import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { signOut } from '@/app/actions/auth'

export const metadata = { title: 'No admin access | Christian Leadership Movement' }

export default async function NoAccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  if (await getAdmin()) redirect('/admin')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">No admin access</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        You are signed in as {user.email}, but this account is not an administrator or reviewer.
        Ask a CLM administrator to grant you access.
      </p>
      <div className="mt-6 flex gap-3">
        <form action={signOut}>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign out</button>
        </form>
        <Link href="/" className="rounded-lg border px-4 py-2 text-sm font-medium">Go home</Link>
      </div>
    </main>
  )
}
