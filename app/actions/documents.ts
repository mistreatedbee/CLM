'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getPublishedForm } from '@/lib/form-config-server'
import type { UploadedDoc } from '@/lib/form-config'
import { DOCUMENTS_BUCKET } from '@/lib/documents-server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES = 5 * 1024 * 1024

// Simple per-connection throttle (best effort; resets when the server restarts).
const hits = new Map<string, { n: number; until: number }>()
async function throttled(max: number, windowMs: number) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  const key = createHash('sha256').update(`clm:${ip}`).digest('hex')
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.until < now) { hits.set(key, { n: 1, until: now + windowMs }); return false }
  entry.n += 1
  return entry.n > max
}

/** Identify the real file type from its first bytes, not the name the browser sent. */
function sniff(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { mime: 'application/pdf', ext: 'pdf' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  return null
}

export async function uploadDocument(formData: FormData): Promise<{ ok: true; doc: UploadedDoc } | { ok: false; error: string }> {
  try {
    const draftId = String(formData.get('draftId') ?? '')
    const docType = String(formData.get('docType') ?? '')
    const file = formData.get('file')
    if (!UUID.test(draftId)) return { ok: false, error: 'Your session has expired. Please refresh the page.' }
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Please choose a file to upload.' }
    if (file.size > MAX_BYTES) return { ok: false, error: 'That file is larger than 5 MB. Please upload a smaller file.' }

    const form = await getPublishedForm()
    if (!form.documents.some((d) => d.enabled && d.type === docType)) return { ok: false, error: 'This document is not requested.' }
    if (await throttled(30, 10 * 60 * 1000)) return { ok: false, error: 'Too many uploads. Please wait a few minutes and try again.' }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const kind = sniff(bytes)
    if (!kind) return { ok: false, error: 'Please upload a PDF, JPG or PNG file.' }

    const path = `applications/${draftId}/${docType}-${Date.now()}.${kind.ext}`
    const admin = await createAdminClient()
    const { error } = await admin.storage.from(DOCUMENTS_BUCKET).upload(path, bytes, { contentType: kind.mime })
    if (error) {
      console.error('[documents] upload failed:', error.message)
      return { ok: false, error: 'Upload failed. Please try again.' }
    }
    const name = file.name.replace(/[^\w.\- ()]/g, '_').slice(0, 120) || `${docType}.${kind.ext}`
    return { ok: true, doc: { type: docType, path, name, size: file.size } }
  } catch (err) {
    console.error('[documents] upload error:', err)
    return { ok: false, error: 'Upload failed. Please try again.' }
  }
}

export async function removeDocument(draftId: string, path: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(draftId) || !path.startsWith(`applications/${draftId}/`) || path.includes('..')) {
    return { ok: false, error: 'Could not remove the file.' }
  }
  try {
    const admin = await createAdminClient()
    const { error } = await admin.storage.from(DOCUMENTS_BUCKET).remove([path])
    return error ? { ok: false, error: 'Could not remove the file. Please try again.' } : { ok: true }
  } catch {
    return { ok: false, error: 'Could not remove the file. Please try again.' }
  }
}
