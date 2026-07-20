import type { Metadata } from 'next'
import { AdminLoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Admin Login | Christian Leadership Movement',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <img
              src="/images/logo.jpeg"
              alt="Christian Leadership Movement"
              className="h-24 w-24 object-cover"
            />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Christian Leadership Movement
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Sign in to the admin portal.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  )
}
