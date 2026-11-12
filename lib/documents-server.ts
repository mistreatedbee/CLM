import { createAdminClient } from '@/lib/supabase/server'
import type { UploadedDoc } from '@/lib/form-config'

/** Private bucket for applicants' documents (server-only helpers). */
export const DOCUMENTS_BUCKET = 'clm-application-documents'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Documents must be in this draft's folder and actually exist in storage; null if any isn't. */
export async function verifyDocuments(draftId: string, docs: UploadedDoc[]): Promise<UploadedDoc[] | null> {
  if (docs.length === 0) return []
  if (!UUID.test(draftId)) return null
  const admin = await createAdminClient()
  const { data, error } = await admin.storage.from(DOCUMENTS_BUCKET).list(`applications/${draftId}`, { limit: 100 })
  if (error) return null
  const existing = new Set((data ?? []).map((o) => `applications/${draftId}/${o.name}`))
  for (const d of docs) if (!existing.has(d.path)) return null
  return docs
}
