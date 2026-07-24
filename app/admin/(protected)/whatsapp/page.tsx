import type { Metadata } from 'next'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppTemplates } from '@/components/admin/whatsapp-templates'

export const metadata: Metadata = {
  title: 'WhatsApp | CLM Admin',
}

export default async function WhatsAppPage() {
  const supabase = await createClient()

  const [templatesResult, settingsResult] = await Promise.allSettled([
    supabase.from('whatsapp_templates').select('*').order('trigger_type').order('name'),
    supabase.from('whatsapp_settings').select('*').single(),
  ])

  const templates =
    templatesResult.status === 'fulfilled' ? (templatesResult.value.data ?? []) : []
  const settings =
    settingsResult.status === 'fulfilled' ? settingsResult.value.data : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-[#25D366]/15">
          <MessageCircle className="size-6 text-[#25D366]" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            WhatsApp
          </h1>
          <p className="mt-0.5 text-base text-muted-foreground">
            Manage message templates and automatic notification settings.
          </p>
        </div>
      </div>

      {templates.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <strong>Database tables not found.</strong> Run{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-900/40">
            supabase/whatsapp_migration.sql
          </code>{' '}
          in your Supabase SQL Editor to enable WhatsApp features.
        </div>
      )}

      <WhatsAppTemplates initialTemplates={templates} initialSettings={settings} />
    </div>
  )
}
