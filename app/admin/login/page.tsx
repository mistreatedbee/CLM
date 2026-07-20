import type { Metadata } from 'next'
import { AdminLoginForm } from './login-form'
import { ClmLogo } from '@/components/clm-logo'

export const metadata: Metadata = {
  title: 'Admin Login | Christian Leadership Movement',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <ClmLogo />
          <h1 className="mt-6 font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Admin Portal
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Sign in to manage applications and members.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  )
}
