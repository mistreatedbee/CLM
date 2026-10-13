import { createClient } from '@/lib/supabase/server'
import type { PublicCourse } from '@/lib/courses'

/**
 * Active courses with current fees, straight from the database.
 * Returns [] (rather than throwing) if the courses migration hasn't been
 * run yet, so the membership application keeps working.
 */
export async function getPublicCourses(): Promise<PublicCourse[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_clm_courses')
    if (error) {
      console.error('[courses] get_clm_courses failed:', error.message)
      return []
    }
    return (data as unknown as PublicCourse[]) ?? []
  } catch (err) {
    console.error('[courses] load failed:', err)
    return []
  }
}
