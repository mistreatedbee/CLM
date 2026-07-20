import { ApplicationsTable } from '@/components/admin/applications-table'

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Applications
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Review, filter, and manage all applications to the movement.
        </p>
      </div>
      <ApplicationsTable />
    </div>
  )
}
