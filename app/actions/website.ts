'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { normalizeSiteContent } from '@/lib/site-content'
import type { Json } from '@/lib/supabase/types'

export type WebsiteResult = { success: true } | { success: false; error: string }

/** Save the public website text (admins only). Goes live immediately. */
export async function saveSiteContent(content: unknown): Promise<WebsiteResult> {
  try {
    const admin = await getAdmin()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Only administrators can change the website content.' }
    }
    const clean = normalizeSiteContent(content)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clm_site_content')
      .update({ content: clean as unknown as Json, updated_by: admin.user.id })
      .eq('id', 'site')
      .select('id')
    if (error) {
      console.error('[website]', error.message)
      return { success: false, error: 'Could not save. Please try again.' }
    }
    if (!data?.length) {
      return { success: false, error: 'Website content is not set up yet — run supabase/20261023_site_content_and_members.sql.' }
    }
    revalidatePath('/')
    revalidatePath('/apply')
    revalidatePath('/admin/website')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}
